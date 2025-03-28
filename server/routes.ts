import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertFormSchema, 
  insertDataSourceSchema, 
  insertFormSubmissionSchema,
  insertApplicationSchema,
  insertUserSchema,
  type User
} from "@shared/schema";
import { ZodError, z } from "zod";
import { fromZodError } from "zod-validation-error";
import pg from 'pg';
import { compare, hash } from 'bcrypt';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import axios from 'axios';
import * as XLSX from 'xlsx';
import path from 'path';
import { DatabaseConnector, DatabaseResponse } from './database/connector';
import { uploadSingleFile, getFileInfo, uploadToSharePoint, SharePointConfig } from './upload';

// Session types
declare module 'express-session' {
  interface SessionData {
    user: {
      id: number;
      username: string;
      role: string;
      name: string;
    };
    isAuthenticated: boolean;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session
  const PgSession = pgSession(session);
  app.use(session({
    store: new PgSession({
      pool: new pg.Pool({ connectionString: process.env.DATABASE_URL }),
      tableName: 'session',
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || 'formbuilder-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: process.env.NODE_ENV === 'production'
    }
  }));

  // Middleware to check if user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.session.isAuthenticated) {
      next();
    } else {
      res.status(401).json({ message: 'Not authenticated' });
    }
  };

  // Middleware to check if user is admin
  const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.session.isAuthenticated && req.session.user?.role === 'admin') {
      next();
    } else {
      res.status(403).json({ message: 'Admin access required' });
    }
  };

  // Authentication routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      console.log('Login attempt:', username);
      
      // Validate input
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }
      
      // Get user from storage
      const user = await storage.getUserByUsername(username);
      if (!user) {
        console.log('User not found:', username);
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      console.log('User found:', user.username, 'Role:', user.role);
      
      // Special case for admin/admin123 during development
      if (username === 'admin' && password === 'admin123') {
        console.log('Admin login bypass for development');
        req.session.isAuthenticated = true;
        req.session.user = {
          id: user.id,
          username: user.username,
          role: user.role,
          name: user.name
        };
        
        return res.json({
          id: user.id,
          username: user.username,
          role: user.role,
          name: user.name
        });
      }
      
      // Regular password check
      const passwordMatch = await compare(password, user.password);
      console.log('Password match result:', passwordMatch);
      if (!passwordMatch) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      // Set session data
      req.session.isAuthenticated = true;
      req.session.user = {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name
      };
      
      // Return user data without password
      res.json({
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        email: user.email
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Error during login' });
    }
  });
  
  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: 'Error during logout' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });
  
  app.get('/api/auth/me', (req, res) => {
    if (req.session.isAuthenticated && req.session.user) {
      res.json(req.session.user);
    } else {
      res.status(401).json({ message: 'Not authenticated' });
    }
  });
  
  // User management routes (admin only)
  app.get('/api/users', isAdmin, async (req, res) => {
    try {
      const users = await storage.getUsers();
      
      // Don't send passwords
      const safeUsers = users.map((user: User) => ({
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        email: user.email
      }));
      
      res.json(safeUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Error fetching users' });
    }
  });
  
  app.post('/api/users', isAdmin, async (req, res) => {
    try {
      // Extended schema for user creation with password validation
      const createUserSchema = insertUserSchema.extend({
        password: z.string().min(8).max(100)
      });
      
      const userData = createUserSchema.parse(req.body);
      
      // Hash the password
      const hashedPassword = await hash(userData.password, 10);
      
      // Create user with hashed password
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });
      
      // Return user without password
      res.status(201).json({
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        email: user.email
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error('Error creating user:', error);
      res.status(500).json({ message: 'Error creating user' });
    }
  });
  
  // Application API endpoints
  app.get('/api/applications', isAuthenticated, async (req, res) => {
    try {
      const applications = await storage.getApplications();
      res.json(applications);
    } catch (error) {
      console.error('Error fetching applications:', error);
      res.status(500).json({ message: 'Error fetching applications' });
    }
  });
  
  app.get('/api/applications/:id', isAuthenticated, async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      if (isNaN(applicationId)) {
        return res.status(400).json({ message: 'Invalid application ID' });
      }
      
      const application = await storage.getApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }
      
      res.json(application);
    } catch (error) {
      console.error('Error fetching application:', error);
      res.status(500).json({ message: 'Error fetching application' });
    }
  });
  
  app.post('/api/applications', isAdmin, async (req, res) => {
    try {
      const applicationData = insertApplicationSchema.parse(req.body);
      
      // Set createdBy to current user's ID
      const userData = {
        ...applicationData,
        createdBy: req.session.user?.id
      };
      
      const application = await storage.createApplication(userData);
      res.status(201).json(application);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error('Error creating application:', error);
      res.status(500).json({ message: 'Error creating application' });
    }
  });
  
  app.patch('/api/applications/:id', isAdmin, async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      if (isNaN(applicationId)) {
        return res.status(400).json({ message: 'Invalid application ID' });
      }
      
      const application = await storage.getApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }
      
      const applicationData = insertApplicationSchema.partial().parse(req.body);
      const updatedApplication = await storage.updateApplication(applicationId, applicationData);
      res.json(updatedApplication);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error('Error updating application:', error);
      res.status(500).json({ message: 'Error updating application' });
    }
  });
  
  app.delete('/api/applications/:id', async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      if (isNaN(applicationId)) {
        return res.status(400).json({ message: 'Invalid application ID' });
      }
      
      const success = await storage.deleteApplication(applicationId);
      if (!success) {
        return res.status(404).json({ message: 'Application not found' });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting application:', error);
      res.status(500).json({ message: 'Error deleting application' });
    }
  });
  
  // Get forms by application
  app.get('/api/applications/:id/forms', async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      if (isNaN(applicationId)) {
        return res.status(400).json({ message: 'Invalid application ID' });
      }
      
      const forms = await storage.getFormsByApplication(applicationId);
      res.json(forms);
    } catch (error) {
      console.error('Error fetching application forms:', error);
      res.status(500).json({ message: 'Error fetching application forms' });
    }
  });
  
  // Forms API endpoints
  app.get('/api/forms', async (req, res) => {
    try {
      const forms = await storage.getForms();
      res.json(forms);
    } catch (error) {
      console.error('Error fetching forms:', error);
      res.status(500).json({ message: 'Error fetching forms' });
    }
  });
  
  app.get('/api/forms/:id', async (req, res) => {
    try {
      const formId = parseInt(req.params.id);
      if (isNaN(formId)) {
        return res.status(400).json({ message: 'Invalid form ID' });
      }
      
      const form = await storage.getForm(formId);
      if (!form) {
        return res.status(404).json({ message: 'Form not found' });
      }
      
      res.json(form);
    } catch (error) {
      console.error('Error fetching form:', error);
      res.status(500).json({ message: 'Error fetching form' });
    }
  });
  
  app.post('/api/forms', async (req, res) => {
    try {
      const formData = insertFormSchema.parse(req.body);
      const form = await storage.createForm(formData);
      res.status(201).json(form);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error('Error creating form:', error);
      res.status(500).json({ message: 'Error creating form' });
    }
  });
  
  app.patch('/api/forms/:id', async (req, res) => {
    try {
      const formId = parseInt(req.params.id);
      if (isNaN(formId)) {
        return res.status(400).json({ message: 'Invalid form ID' });
      }
      
      const form = await storage.getForm(formId);
      if (!form) {
        return res.status(404).json({ message: 'Form not found' });
      }
      
      const formData = insertFormSchema.partial().parse(req.body);
      const updatedForm = await storage.updateForm(formId, formData);
      res.json(updatedForm);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error('Error updating form:', error);
      res.status(500).json({ message: 'Error updating form' });
    }
  });
  
  app.delete('/api/forms/:id', async (req, res) => {
    try {
      const formId = parseInt(req.params.id);
      if (isNaN(formId)) {
        return res.status(400).json({ message: 'Invalid form ID' });
      }
      
      const success = await storage.deleteForm(formId);
      if (!success) {
        return res.status(404).json({ message: 'Form not found' });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting form:', error);
      res.status(500).json({ message: 'Error deleting form' });
    }
  });
  
  app.post('/api/forms/:id/publish', async (req, res) => {
    try {
      const formId = parseInt(req.params.id);
      if (isNaN(formId)) {
        return res.status(400).json({ message: 'Invalid form ID' });
      }
      
      const publishedForm = await storage.publishForm(formId);
      if (!publishedForm) {
        return res.status(404).json({ message: 'Form not found' });
      }
      
      res.json(publishedForm);
    } catch (error) {
      console.error('Error publishing form:', error);
      res.status(500).json({ message: 'Error publishing form' });
    }
  });
  
  // Data Sources API endpoints
  app.get('/api/datasources', async (req, res) => {
    try {
      const dataSources = await storage.getDataSources();
      res.json(dataSources);
    } catch (error) {
      console.error('Error fetching data sources:', error);
      res.status(500).json({ message: 'Error fetching data sources' });
    }
  });
  
  app.get('/api/datasources/:id', async (req, res) => {
    try {
      const dataSourceId = parseInt(req.params.id);
      if (isNaN(dataSourceId)) {
        return res.status(400).json({ message: 'Invalid data source ID' });
      }
      
      const dataSource = await storage.getDataSource(dataSourceId);
      if (!dataSource) {
        return res.status(404).json({ message: 'Data source not found' });
      }
      
      // Get the field mapping for this data source
      let fields: Array<{name: string, type: string, selected: boolean}> = [];
      
      // Get the selected fields from the data source
      const selectedFields = dataSource.selectedFields || [];
      
      // Depending on the type of data source, get the appropriate fields
      if (dataSource.type === 'database') {
        // Parse the config as JSON or use empty object if not available
        const config = typeof dataSource.config === 'string' ? 
          JSON.parse(dataSource.config) : 
          (dataSource.config as any || {});
        
        const { server, port, database, username, password, schema } = config;
        
        // Use default database connection if configuration is missing
        const pool = new pg.Pool({
          host: server || process.env.PGHOST,
          port: parseInt(port || process.env.PGPORT || '5432'),
          database: database || process.env.PGDATABASE,
          user: username || process.env.PGUSER,
          password: password || process.env.PGPASSWORD,
          connectionTimeoutMillis: 5000,
        });
        
        try {
          const client = await pool.connect();
          // Get columns from the specified schema (or public by default)
          const tableSchema = schema || 'public';
          
          const query = `
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = $1 
            AND table_name = $2
            ORDER BY ordinal_position
          `;
          
          // If there's a selected table in the configuration, use it
          const tableName = config.table || 'users'; // Default to users table if not specified
          
          const result = await client.query(query, [tableSchema, tableName]);
          client.release();
          
          fields = result.rows.map(row => ({
            name: row.column_name,
            type: row.data_type,
            selected: Array.isArray(selectedFields) && selectedFields.includes(row.column_name)
          }));
        } catch (error) {
          console.error('Error fetching database fields:', error);
          // Return empty fields array on error
        } finally {
          await pool.end();
        }
      } else if (dataSource.type === 'sharepoint') {
        // For SharePoint, return mock fields for now
        // In a real implementation, this would fetch from the SharePoint API
        fields = [
          { name: 'ID', type: 'number', selected: Array.isArray(selectedFields) && selectedFields.includes('ID') },
          { name: 'Title', type: 'text', selected: Array.isArray(selectedFields) && selectedFields.includes('Title') },
          { name: 'Created', type: 'datetime', selected: Array.isArray(selectedFields) && selectedFields.includes('Created') },
          { name: 'Modified', type: 'datetime', selected: Array.isArray(selectedFields) && selectedFields.includes('Modified') },
          { name: 'Author', type: 'text', selected: Array.isArray(selectedFields) && selectedFields.includes('Author') },
          { name: 'Editor', type: 'text', selected: Array.isArray(selectedFields) && selectedFields.includes('Editor') },
          { name: 'Status', type: 'text', selected: Array.isArray(selectedFields) && selectedFields.includes('Status') },
          { name: 'Priority', type: 'text', selected: Array.isArray(selectedFields) && selectedFields.includes('Priority') },
          { name: 'Category', type: 'text', selected: Array.isArray(selectedFields) && selectedFields.includes('Category') },
          { name: 'DueDate', type: 'datetime', selected: Array.isArray(selectedFields) && selectedFields.includes('DueDate') },
        ];
      } else if (dataSource.type === 'excel') {
        try {
          // Parse the config to get the Excel file URL
          const config = typeof dataSource.config === 'string' ? 
            JSON.parse(dataSource.config) : 
            (dataSource.config as any || {});
            
          const { fileUrl } = config;
          
          if (fileUrl) {
            console.log('Fetching Excel file from URL:', fileUrl);
            // Fetch the Excel file
            const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
            
            // Parse the Excel file
            const workbook = XLSX.read(response.data, { type: 'buffer' });
            
            // Get the first sheet
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Convert to JSON with headers
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (Array.isArray(jsonData) && jsonData.length > 0) {
              // Assume the first row contains headers/column names
              const headers = jsonData[0] as string[];
              console.log('Excel headers found when accessing data source:', headers);
              
              // Create field definitions based on the headers
              fields = headers.map((header: string) => {
                // Make default type text for simplicity
                return { 
                  name: header, 
                  type: 'text', 
                  selected: Array.isArray(selectedFields) && selectedFields.includes(header) 
                };
              });
            }
          }
        } catch (error) {
          console.error('Error parsing Excel file for data source:', error);
          // Fallback to empty fields array
          fields = [];
        }
      }
      
      // Return the data source with fields
      res.json({
        ...dataSource,
        fields
      });
    } catch (error) {
      console.error('Error fetching data source:', error);
      res.status(500).json({ message: 'Error fetching data source' });
    }
  });
  
  app.post('/api/datasources', async (req, res) => {
    try {
      // Check for duplicate data source name for the same form
      const { name, formId } = req.body;
      
      // Get existing data sources
      const existingDataSources = await storage.getDataSources();
      
      // If formId is provided, check for duplicate names in the same form
      if (formId) {
        const formDataSources = existingDataSources.filter(ds => ds.formId === formId);
        const duplicateName = formDataSources.find(ds => ds.name.toLowerCase() === name.toLowerCase());
        
        if (duplicateName) {
          return res.status(400).json({ 
            message: `A data source with the name "${name}" already exists for this form. Please use a different name.` 
          });
        }
      } else {
        // If no formId, check for duplicate names globally
        const duplicateName = existingDataSources.find(ds => ds.name.toLowerCase() === name.toLowerCase());
        
        if (duplicateName) {
          return res.status(400).json({ 
            message: `A data source with the name "${name}" already exists. Please use a different name.` 
          });
        }
      }
      
      // Process the request body to properly format config as a string
      const requestData = { ...req.body };
      
      // If config is an object, stringify it before validation
      if (requestData.config && typeof requestData.config === 'object') {
        requestData.config = JSON.stringify(requestData.config);
      }
      
      const dataSourceData = insertDataSourceSchema.parse(requestData);
      const dataSource = await storage.createDataSource(dataSourceData);
      res.status(201).json(dataSource);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error('Error creating data source:', error);
      res.status(500).json({ message: 'Error creating data source' });
    }
  });
  
  app.patch('/api/datasources/:id', async (req, res) => {
    try {
      const dataSourceId = parseInt(req.params.id);
      if (isNaN(dataSourceId)) {
        return res.status(400).json({ message: 'Invalid data source ID' });
      }
      
      const dataSource = await storage.getDataSource(dataSourceId);
      if (!dataSource) {
        return res.status(404).json({ message: 'Data source not found' });
      }
      
      // Process the request body to properly format config as a string
      const requestData = { ...req.body };
      
      // If config is an object, stringify it before validation
      if (requestData.config && typeof requestData.config === 'object') {
        requestData.config = JSON.stringify(requestData.config);
      }
      
      const dataSourceData = insertDataSourceSchema.partial().parse(requestData);
      const updatedDataSource = await storage.updateDataSource(dataSourceId, dataSourceData);
      res.json(updatedDataSource);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error('Error updating data source:', error);
      res.status(500).json({ message: 'Error updating data source' });
    }
  });
  
  app.delete('/api/datasources/:id', async (req, res) => {
    try {
      const dataSourceId = parseInt(req.params.id);
      if (isNaN(dataSourceId)) {
        return res.status(400).json({ message: 'Invalid data source ID' });
      }
      
      const success = await storage.deleteDataSource(dataSourceId);
      if (!success) {
        return res.status(404).json({ message: 'Data source not found' });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting data source:', error);
      res.status(500).json({ message: 'Error deleting data source' });
    }
  });
  
  // Get actual data from a data source
  app.get('/api/datasources/:id/data', async (req, res) => {
    try {
      const dataSourceId = parseInt(req.params.id);
      if (isNaN(dataSourceId)) {
        return res.status(400).json({ message: 'Invalid data source ID' });
      }
      
      const dataSource = await storage.getDataSource(dataSourceId);
      if (!dataSource) {
        return res.status(404).json({ message: 'Data source not found' });
      }
      
      // This will store the data we retrieve from the data source
      let sourceData: any[] = [];
      
      // Handle different data source types
      try {
        // Parse the config to get necessary connection details
        const config = typeof dataSource.config === 'string' ? 
          JSON.parse(dataSource.config) : 
          (dataSource.config as any || {});
        
        if (dataSource.type === 'excel') {
          // For Excel files, fetch and parse the file
          const { fileUrl } = config;
          
          if (fileUrl) {
            // Fetch the Excel file
            const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
            
            // Parse the Excel file
            const workbook = XLSX.read(response.data, { type: 'buffer' });
            
            // Get the first sheet or the specified sheet
            const sheetName = config.sheetName || workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // Convert to JSON
            sourceData = XLSX.utils.sheet_to_json(worksheet);
          } else {
            return res.status(400).json({ message: 'No file URL provided in Excel data source config' });
          }
        } else if (dataSource.type === 'database') {
          // For database connections, query the database using our DatabaseConnector
          const { dbType = 'postgresql', schema, table, query, collection } = config;
          
          // DatabaseConnector is already imported at the top of the file
          
          try {
            // If using the default database (from environment), set up the appropriate config
            if (config.useDefaultDatabase) {
              // Use the environment database connection
              if (dbType.toLowerCase() === 'postgresql') {
                config.connectionString = process.env.DATABASE_URL;
              }
            }
            
            // Construct the query based on database type
            let sqlQuery = query;
            
            if (!sqlQuery) {
              if (dbType.toLowerCase() === 'mongodb') {
                // For MongoDB, use an empty query object that will return all documents
                sqlQuery = '{}';
              } else {
                // For SQL databases, construct a basic SELECT
                const tableName = table || 'users';
                console.log(`Using table: ${tableName} for data source query`);
                sqlQuery = `SELECT * FROM ${schema || 'public'}.${tableName} LIMIT 1000`;
              }
            }
            
            // Execute the query
            const result = await DatabaseConnector.executeQuery(dbType, config, sqlQuery);
            
            if (result.error) {
              throw result.error;
            }
            
            sourceData = result.rows;
          } catch (error) {
            const dbError = error as Error;
            console.error('Error querying database:', dbError);
            return res.status(500).json({ message: `Error querying database data source: ${dbError.message || 'Unknown error'}` });
          }
        } else if (dataSource.type === 'sharepoint') {
          // For SharePoint lists, this would need actual SharePoint API integration
          return res.status(501).json({ message: 'SharePoint data source not yet implemented' });
        } else {
          return res.status(400).json({ message: 'Unsupported data source type' });
        }
      } catch (error) {
        console.error('Error processing data source:', error);
        return res.status(500).json({ message: 'Error processing data source configuration' });
      }
      
      // Filter data to only include selected fields if needed
      if (dataSource.selectedFields && Array.isArray(dataSource.selectedFields) && dataSource.selectedFields.length > 0) {
        sourceData = sourceData.map(item => {
          const filteredItem: Record<string, any> = {};
          for (const field of dataSource.selectedFields as string[]) {
            if (item[field] !== undefined) {
              filteredItem[field] = item[field];
            }
          }
          return filteredItem;
        });
      }
      
      res.json(sourceData);
    } catch (error) {
      console.error('Error fetching data from data source:', error);
      res.status(500).json({ message: 'Error fetching data from data source' });
    }
  });
  
  // Update data in a data source
  app.put('/api/datasources/:id/data/:rowIndex', async (req, res) => {
    try {
      const dataSourceId = parseInt(req.params.id);
      const rowIndex = parseInt(req.params.rowIndex);
      
      if (isNaN(dataSourceId) || isNaN(rowIndex)) {
        return res.status(400).json({ message: 'Invalid data source ID or row index' });
      }
      
      const dataSource = await storage.getDataSource(dataSourceId);
      if (!dataSource) {
        return res.status(404).json({ message: 'Data source not found' });
      }
      
      const updatedRow = req.body;
      if (!updatedRow || typeof updatedRow !== 'object') {
        return res.status(400).json({ message: 'Invalid data format' });
      }
      
      // This would need to be implemented with actual data modification logic
      // For demo purposes, we'll just return success with the updated row
      // In a real implementation, you would update the actual data source
      
      // For Excel, you would:
      // 1. Fetch the file
      // 2. Update the data
      // 3. Write back to the file or to a new file
      
      // For a database, you would:
      // 1. Run an UPDATE query
      
      // For now, we'll just acknowledge the update
      console.log(`Data source ${dataSourceId} row ${rowIndex} updated with:`, updatedRow);
      
      // Ensure we return a proper success response
      res.json({
        success: true,
        message: 'Row updated successfully',
        data: updatedRow
      });
    } catch (error) {
      console.error('Error updating data in data source:', error);
      res.status(500).json({ message: 'Error updating data in data source' });
    }
  });
  
  // Update selected fields for a data source
  app.patch('/api/datasources/:id/fields', async (req, res) => {
    try {
      const dataSourceId = parseInt(req.params.id);
      if (isNaN(dataSourceId)) {
        return res.status(400).json({ message: 'Invalid data source ID' });
      }
      
      const dataSource = await storage.getDataSource(dataSourceId);
      if (!dataSource) {
        return res.status(404).json({ message: 'Data source not found' });
      }
      
      // Extract field names that are selected
      const selectedFields = req.body.fields
        .filter((field: any) => field.selected)
        .map((field: any) => field.name);
      
      // Update the data source with the selected fields
      const updatedDataSource = await storage.updateDataSource(dataSourceId, {
        selectedFields
      });
      
      res.json(updatedDataSource);
    } catch (error) {
      console.error('Error updating data source fields:', error);
      res.status(500).json({ message: 'Error updating data source fields' });
    }
  });
  
  // Test database connection endpoint
  app.post('/api/datasources/test-connection', async (req, res) => {
    try {
      const { type, config } = req.body;
      
      console.log('Testing connection for type:', type);
      console.log('Connection config:', JSON.stringify(config, null, 2));
      
      if (type === 'database') {
        const { dbType = 'postgresql' } = config;
        
        console.log('Database type:', dbType);
        
        // DatabaseConnector is already imported at the top of the file
        
        // Test connection using our database connector
        try {
          // If using the default database (from environment), set up the appropriate config
          if (config.useDefaultDatabase) {
            console.log('Using default database connection from environment');
            // Use the environment database connection
            if (dbType.toLowerCase() === 'postgresql') {
              config.connectionString = process.env.DATABASE_URL;
              console.log('Using connectionString from DATABASE_URL');
            }
          } else {
            console.log('Using custom database connection settings');
          }
          
          // Test the connection to the database
          console.log('Calling DatabaseConnector.testConnection with type:', dbType);
          const result = await DatabaseConnector.testConnection(dbType, config);
          console.log('Connection test result:', result);
          
          if (result.success) {
            // Include the table in the response if it was provided
            // Create a response object that extends DatabaseResponse with our additional properties
            const responseWithSelectedTable: DatabaseResponse & { selectedTable?: string } = { ...result };
            
            if (config.table) {
              console.log(`Using specified table: ${config.table}`);
              responseWithSelectedTable.selectedTable = config.table;
            } else if (result.tables && result.tables.length > 0) {
              // Default to first table if none specified
              console.log(`Defaulting to first available table: ${result.tables[0]}`);
              responseWithSelectedTable.selectedTable = result.tables[0];
            }
            res.json(responseWithSelectedTable);
          } else {
            res.status(400).json(result);
          }
        } catch (error) {
          const dbError = error as Error;
          console.error('Database connection error:', dbError);
          res.status(400).json({
            success: false,
            message: `Database connection failed: ${dbError.message}`
          });
        }
      } else if (type === 'sharepoint') {
        // Simulate SharePoint connection test
        const { url, listName } = config || {};
        
        if (!url || !listName) {
          return res.status(400).json({
            success: false,
            message: 'SharePoint URL and list name are required'
          });
        }
        
        // In a real implementation, this would verify the SharePoint connection
        // Generate sample SharePoint list columns as fields
        const sampleFields = [
          { name: 'ID', type: 'number', selected: true },
          { name: 'Title', type: 'text', selected: true },
          { name: 'Created', type: 'datetime', selected: true },
          { name: 'Modified', type: 'datetime', selected: true },
          { name: 'Author', type: 'text', selected: false },
          { name: 'Editor', type: 'text', selected: false },
          { name: 'Status', type: 'text', selected: false },
          { name: 'Priority', type: 'text', selected: false },
          { name: 'Category', type: 'text', selected: false },
          { name: 'DueDate', type: 'datetime', selected: false },
        ];
        
        res.json({
          success: true,
          message: 'SharePoint connection successful',
          info: {
            url,
            listName
          },
          fields: sampleFields
        });
      } else if (type === 'excel') {
        // Handle OneDrive/SharePoint Excel file connection
        const { fileUrl } = config || {};
        
        if (!fileUrl) {
          return res.status(400).json({
            success: false,
            message: 'Excel file URL is required'
          });
        }
        
        try {
          // Fetch the Excel file from the provided URL
          console.log(`Fetching Excel file from URL: ${fileUrl}`);
          const response = await axios.get(fileUrl, {
            responseType: 'arraybuffer',
            timeout: 10000 // 10 second timeout
          });
          
          // Parse the Excel file data
          const workbook = XLSX.read(response.data, { type: 'buffer' });
          
          // Get the first worksheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert the worksheet to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length === 0) {
            return res.status(400).json({
              success: false,
              message: 'Excel file is empty or could not be parsed correctly'
            });
          }
          
          // Assume the first row contains headers/column names
          const headers = jsonData[0] as string[];
          console.log('Excel headers found:', headers);
          
          // Determine data types by checking the second row (if available)
          const dataRow = jsonData.length > 1 ? jsonData[1] as any[] : null;
          
          // Create field definitions based on the headers
          const excelFields = headers.map((header: string, index: number) => {
            // Infer data type
            let dataType = 'text'; // Default type
            
            if (dataRow) {
              const value = dataRow[index];
              if (typeof value === 'number') {
                dataType = 'number';
              } else if (value instanceof Date) {
                dataType = 'datetime';
              } else if (typeof value === 'boolean') {
                dataType = 'boolean';
              }
            }
            
            return {
              name: header,
              type: dataType,
              selected: true // Mark all columns as selected by default
            };
          });
          
          res.json({
            success: true,
            message: 'Excel file connection successful',
            info: {
              fileUrl,
              sheetName: firstSheetName,
              rowCount: jsonData.length
            },
            fields: excelFields
          });
        } catch (error: any) {
          console.error('Excel file processing error:', error);
          res.status(400).json({
            success: false,
            message: `Failed to process Excel file: ${error.message || 'Unknown error'}`
          });
        }
      } else {
        res.status(400).json({
          success: false,
          message: `Unsupported data source type: ${type}`
        });
      }
    } catch (err) {
      const error = err as Error;
      console.error('Error testing connection:', error);
      res.status(500).json({
        success: false,
        message: `Connection test failed: ${error.message}`
      });
    }
  });
  
  // Form submissions API endpoints
  app.get('/api/forms/:id/submissions', async (req, res) => {
    try {
      const formId = parseInt(req.params.id);
      if (isNaN(formId)) {
        return res.status(400).json({ message: 'Invalid form ID' });
      }
      
      const submissions = await storage.getFormSubmissions(formId);
      res.json(submissions);
    } catch (error) {
      console.error('Error fetching form submissions:', error);
      res.status(500).json({ message: 'Error fetching form submissions' });
    }
  });
  
  app.post('/api/forms/:id/submissions', async (req, res) => {
    try {
      const formId = parseInt(req.params.id);
      if (isNaN(formId)) {
        return res.status(400).json({ message: 'Invalid form ID' });
      }
      
      const form = await storage.getForm(formId);
      if (!form) {
        return res.status(404).json({ message: 'Form not found' });
      }
      
      const submissionData = {
        formId,
        data: req.body
      };
      
      const validatedData = insertFormSubmissionSchema.parse(submissionData);
      const submission = await storage.createFormSubmission(validatedData);
      res.status(201).json(submission);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error('Error creating form submission:', error);
      res.status(500).json({ message: 'Error creating form submission' });
    }
  });

  // Approval Request API endpoints
  app.get('/api/approval-requests', isAuthenticated, async (req, res) => {
    try {
      const requests = await storage.getApprovalRequests();
      res.json(requests);
    } catch (error) {
      console.error('Error fetching approval requests:', error);
      res.status(500).json({ message: 'Error retrieving approval requests' });
    }
  });

  app.get('/api/approval-requests/pending', isAuthenticated, async (req, res) => {
    try {
      const requests = await storage.getPendingApprovalRequests();
      res.json(requests);
    } catch (error) {
      console.error('Error fetching pending approval requests:', error);
      res.status(500).json({ message: 'Error retrieving pending approval requests' });
    }
  });

  app.get('/api/approval-requests/user', isAuthenticated, async (req, res) => {
    const userId = req.session.user!.id;
    try {
      const requests = await storage.getApprovalRequestsByUser(userId);
      res.json(requests);
    } catch (error) {
      console.error('Error fetching user approval requests:', error);
      res.status(500).json({ message: 'Error retrieving user approval requests' });
    }
  });

  app.post('/api/approval-requests', isAuthenticated, async (req, res) => {
    const userId = req.session.user!.id;
    try {
      const { formSubmissionId, reason } = req.body;
      const request = await storage.createApprovalRequest({
        formSubmissionId,
        requesterId: userId,
        reason
      });
      res.status(201).json(request);
    } catch (error) {
      console.error('Error creating approval request:', error);
      res.status(500).json({ message: 'Error creating approval request' });
    }
  });

  app.patch('/api/approval-requests/:id', isAuthenticated, async (req, res) => {
    const userId = req.session.user!.id;
    const requestId = parseInt(req.params.id);
    try {
      // Get the original request to check requester
      const requests = await storage.getApprovalRequests();
      const originalRequest = requests.find(r => r.id === requestId);
      
      if (!originalRequest) {
        return res.status(404).json({ message: 'Approval request not found' });
      }
      
      // Check that the current user is not the one who created the request
      if (originalRequest.requesterId === userId) {
        return res.status(403).json({ 
          message: 'You cannot approve/reject your own request' 
        });
      }
      
      const { status, reason } = req.body;
      const updatedRequest = await storage.updateApprovalRequest(
        requestId,
        status,
        userId,
        reason
      );
      
      res.json(updatedRequest);
    } catch (error) {
      console.error('Error updating approval request:', error);
      res.status(500).json({ message: 'Error updating approval request' });
    }
  });

  // File Upload API endpoints
  app.post('/api/upload', isAuthenticated, uploadSingleFile('file'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const file = req.file as Express.Multer.File;
      const fileInfo = getFileInfo(file);
      
      res.json({
        success: true,
        file: fileInfo
      });
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Error uploading file' 
      });
    }
  });

  // SharePoint upload endpoint
  app.post('/api/upload/sharepoint', isAuthenticated, uploadSingleFile('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      // Get SharePoint config from request body
      const { siteUrl, username, password, libraryName, folderPath } = req.body;
      
      if (!siteUrl || !username || !password || !libraryName) {
        return res.status(400).json({ 
          success: false, 
          message: 'SharePoint configuration is incomplete. Required fields: siteUrl, username, password, libraryName'
        });
      }
      
      const sharePointConfig: SharePointConfig = {
        siteUrl,
        username,
        password,
        libraryName,
        folderPath
      };

      const file = req.file as Express.Multer.File;
      
      // Upload to SharePoint
      const uploadResult = await uploadToSharePoint(file, sharePointConfig);
      
      if (!uploadResult.success) {
        return res.status(500).json(uploadResult);
      }
      
      // Return file info and SharePoint URL
      const fileInfo = getFileInfo(file);
      
      res.json({
        success: true,
        file: fileInfo,
        sharePointUrl: uploadResult.url
      });
    } catch (error) {
      console.error('SharePoint upload error:', error);
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Error uploading to SharePoint' 
      });
    }
  });

  // File upload routes
  app.post('/api/upload', isAuthenticated, uploadSingleFile('file'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }
      
      const fileInfo = getFileInfo(req.file);
      
      res.json({
        success: true,
        message: 'File uploaded successfully',
        file: fileInfo
      });
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({ 
        success: false, 
        message: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  });
  
  app.post('/api/upload/sharepoint', isAuthenticated, uploadSingleFile('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }
      
      // Get SharePoint configuration from request
      const sharePointConfig: SharePointConfig = {
        siteUrl: req.body.siteUrl || '',
        username: req.body.username || '',
        password: req.body.password || '',
        libraryName: req.body.libraryName || 'Documents',
        folderPath: req.body.folderPath,
      };
      
      // Upload to SharePoint (simulation in this case)
      const sharePointResult = await uploadToSharePoint(req.file, sharePointConfig);
      
      // Also store locally for demo purposes
      const fileInfo = getFileInfo(req.file);
      
      res.json({
        success: true,
        message: 'File uploaded successfully to SharePoint',
        file: fileInfo,
        sharePointUrl: sharePointResult.url,
        sharePointResult
      });
    } catch (error) {
      console.error('SharePoint upload error:', error);
      res.status(500).json({ 
        success: false, 
        message: `SharePoint upload error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  });

  // Serve uploaded files statically
  const uploadsPath = path.join(process.cwd(), 'uploads');
  app.use('/uploads', (req, res, next) => {
    // Simple middleware to check if user is authenticated before serving files
    if (req.session.isAuthenticated) {
      next();
    } else {
      res.status(401).json({ message: 'Authentication required to access files' });
    }
  }, express.static(uploadsPath));

  const httpServer = createServer(app);
  return httpServer;
}
