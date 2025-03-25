import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertFormSchema, 
  insertDataSourceSchema, 
  insertFormSubmissionSchema,
  insertApplicationSchema
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import pg from 'pg';

export async function registerRoutes(app: Express): Promise<Server> {
  // Application API endpoints
  app.get('/api/applications', async (req, res) => {
    try {
      const applications = await storage.getApplications();
      res.json(applications);
    } catch (error) {
      console.error('Error fetching applications:', error);
      res.status(500).json({ message: 'Error fetching applications' });
    }
  });
  
  app.get('/api/applications/:id', async (req, res) => {
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
  
  app.post('/api/applications', async (req, res) => {
    try {
      const applicationData = insertApplicationSchema.parse(req.body);
      const application = await storage.createApplication(applicationData);
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
  
  app.patch('/api/applications/:id', async (req, res) => {
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
        // For Excel, return mock fields for now
        // In a real implementation, this would parse the Excel file
        fields = [
          { name: 'Column1', type: 'text', selected: Array.isArray(selectedFields) && selectedFields.includes('Column1') },
          { name: 'Column2', type: 'text', selected: Array.isArray(selectedFields) && selectedFields.includes('Column2') },
          { name: 'Column3', type: 'number', selected: Array.isArray(selectedFields) && selectedFields.includes('Column3') },
          { name: 'Column4', type: 'datetime', selected: Array.isArray(selectedFields) && selectedFields.includes('Column4') },
          { name: 'Column5', type: 'number', selected: Array.isArray(selectedFields) && selectedFields.includes('Column5') },
          { name: 'Column6', type: 'text', selected: Array.isArray(selectedFields) && selectedFields.includes('Column6') },
          { name: 'Column7', type: 'text', selected: Array.isArray(selectedFields) && selectedFields.includes('Column7') },
          { name: 'Column8', type: 'text', selected: Array.isArray(selectedFields) && selectedFields.includes('Column8') },
        ];
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
      const dataSourceData = insertDataSourceSchema.parse(req.body);
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
      
      const dataSourceData = insertDataSourceSchema.partial().parse(req.body);
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
      
      if (type === 'database') {
        // Handle PostgreSQL connection test
        const {
          server = process.env.PGHOST,
          port = process.env.PGPORT,
          database = process.env.PGDATABASE,
          username = process.env.PGUSER,
          password = process.env.PGPASSWORD
        } = config || {};
        
        const pool = new pg.Pool({
          host: server,
          port: parseInt(port || '5432'),
          database,
          user: username,
          password,
          // Set a connection timeout
          connectionTimeoutMillis: 5000,
        });
        
        try {
          // Test connection by querying PostgreSQL version
          const client = await pool.connect();
          const result = await client.query('SELECT version()');
          client.release();
          
          // Return success with database info
          // Get sample metadata about tables in the database
          const tableQuery = await client.query(`
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            ORDER BY table_name, ordinal_position 
            LIMIT 50
          `);
          
          // Group columns by table to create field metadata
          const fieldsByTable = tableQuery.rows.reduce((acc: any, row: any) => {
            const { table_name, column_name, data_type } = row;
            if (!acc[table_name]) {
              acc[table_name] = [];
            }
            acc[table_name].push({
              name: column_name,
              type: data_type,
              selected: ["id", "name", "title", "email", "description"].includes(column_name.toLowerCase())
            });
            return acc;
          }, {});
          
          res.json({
            success: true,
            message: 'Database connection successful',
            info: {
              server,
              database,
              version: result.rows[0].version
            },
            tables: Object.keys(fieldsByTable),
            fields: fieldsByTable
          });
        } catch (error) {
          const dbError = error as Error;
          console.error('Database connection error:', dbError);
          res.status(400).json({
            success: false,
            message: `Database connection failed: ${dbError.message}`
          });
        } finally {
          await pool.end();
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
        
        // In a real implementation, this would verify the Excel file is accessible and parse columns
        // Generate sample Excel columns as fields
        const sampleFields = [
          { name: 'Column1', type: 'text', selected: true },
          { name: 'Column2', type: 'text', selected: true },
          { name: 'Column3', type: 'number', selected: true },
          { name: 'Column4', type: 'datetime', selected: false },
          { name: 'Column5', type: 'number', selected: false },
          { name: 'Column6', type: 'text', selected: false },
          { name: 'Column7', type: 'text', selected: false },
          { name: 'Column8', type: 'text', selected: false },
        ];
        
        res.json({
          success: true,
          message: 'Excel file connection successful',
          info: {
            fileUrl
          },
          fields: sampleFields
        });
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

  const httpServer = createServer(app);
  return httpServer;
}
