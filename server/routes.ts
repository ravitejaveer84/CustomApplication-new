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
      
      res.json(dataSource);
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
