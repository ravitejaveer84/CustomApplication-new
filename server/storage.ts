import { 
  users, type User, type InsertUser,
  applications, type Application, type InsertApplication,
  forms, type Form, type InsertForm,
  dataSources, type DataSource, type InsertDataSource,
  formSubmissions, type FormSubmission, type InsertFormSubmission
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

// Storage interface
export interface IStorage {
  // User methods
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Application methods
  getApplications(): Promise<Application[]>;
  getApplication(id: number): Promise<Application | undefined>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplication(id: number, application: Partial<InsertApplication>): Promise<Application | undefined>;
  deleteApplication(id: number): Promise<boolean>;
  
  // Form methods
  getForms(): Promise<Form[]>;
  getFormsByApplication(applicationId: number): Promise<Form[]>;
  getForm(id: number): Promise<Form | undefined>;
  createForm(form: InsertForm): Promise<Form>;
  updateForm(id: number, form: Partial<InsertForm>): Promise<Form | undefined>;
  deleteForm(id: number): Promise<boolean>;
  publishForm(id: number): Promise<Form | undefined>;
  
  // Data Source methods
  getDataSources(): Promise<DataSource[]>;
  getDataSource(id: number): Promise<DataSource | undefined>;
  createDataSource(dataSource: InsertDataSource): Promise<DataSource>;
  updateDataSource(id: number, dataSource: Partial<InsertDataSource>): Promise<DataSource | undefined>;
  deleteDataSource(id: number): Promise<boolean>;
  
  // Form Submission methods
  getFormSubmissions(formId: number): Promise<FormSubmission[]>;
  createFormSubmission(submission: InsertFormSubmission): Promise<FormSubmission>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private applications: Map<number, Application>;
  private forms: Map<number, Form>;
  private dataSources: Map<number, DataSource>;
  private formSubmissions: Map<number, FormSubmission>;
  
  private userCurrentId: number;
  private applicationCurrentId: number;
  private formCurrentId: number;
  private dataSourceCurrentId: number;
  private formSubmissionCurrentId: number;

  constructor() {
    this.users = new Map();
    this.applications = new Map();
    this.forms = new Map();
    this.dataSources = new Map();
    this.formSubmissions = new Map();
    
    this.userCurrentId = 1;
    this.applicationCurrentId = 1;
    this.formCurrentId = 1;
    this.dataSourceCurrentId = 1;
    this.formSubmissionCurrentId = 1;
    
    // Initialize with default users and applications
    this.initializeDefaultUsers();
    this.initializeDefaultApplications();
  }
  
  private async initializeDefaultUsers() {
    // Create admin user with password 'admin123'
    // In real implementation, we'd use bcrypt to hash the password, but for simplicity we'll use the hashed version
    const hashedPassword = '$2b$10$3euPzG8A0oNqLG/xCj.EROsKQjMB2iCPIT2sS/CnHkDNK5nLG4Ig6'; // 'admin123' hashed
    await this.createUser({
      username: "admin",
      password: hashedPassword,
      role: "admin",
      email: "admin@example.com",
      name: "Administrator"
    });
    
    console.log('Default users initialized in memory storage');
  }
  
  private async initializeDefaultApplications() {
    // Create default applications with admin as creator (id 1)
    await this.createApplication({
      name: "Reports",
      description: "Reporting application with various forms",
      icon: "bar-chart",
      createdBy: 1
    });
    
    await this.createApplication({
      name: "EDM",
      description: "Electronic Document Management",
      icon: "file-text",
      createdBy: 1
    });
    
    await this.createApplication({
      name: "US Custom",
      description: "US Customs application forms",
      icon: "clipboard-check",
      createdBy: 1
    });
  }

  // User methods
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = {
      id,
      username: insertUser.username,
      password: insertUser.password,
      role: insertUser.role || "user",
      name: insertUser.name,
      email: insertUser.email
    };
    this.users.set(id, user);
    return user;
  }
  
  // Application methods
  async getApplications(): Promise<Application[]> {
    return Array.from(this.applications.values());
  }
  
  async getApplication(id: number): Promise<Application | undefined> {
    return this.applications.get(id);
  }
  
  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const id = this.applicationCurrentId++;
    const now = new Date();
    const application: Application = { 
      id,
      name: insertApplication.name,
      description: insertApplication.description || null,
      icon: insertApplication.icon || null,
      createdBy: insertApplication.createdBy || null,
      createdAt: now,
      updatedAt: now
    };
    this.applications.set(id, application);
    return application;
  }
  
  async updateApplication(id: number, partialApplication: Partial<InsertApplication>): Promise<Application | undefined> {
    const application = this.applications.get(id);
    if (!application) return undefined;
    
    const updatedApplication: Application = {
      ...application,
      ...partialApplication,
      updatedAt: new Date()
    };
    
    this.applications.set(id, updatedApplication);
    return updatedApplication;
  }
  
  async deleteApplication(id: number): Promise<boolean> {
    return this.applications.delete(id);
  }
  
  // Form methods
  async getForms(): Promise<Form[]> {
    return Array.from(this.forms.values());
  }
  
  async getFormsByApplication(applicationId: number): Promise<Form[]> {
    return Array.from(this.forms.values())
      .filter(form => form.applicationId === applicationId);
  }
  
  async getForm(id: number): Promise<Form | undefined> {
    return this.forms.get(id);
  }
  
  async createForm(insertForm: InsertForm): Promise<Form> {
    const id = this.formCurrentId++;
    const now = new Date();
    const form: Form = { 
      id,
      name: insertForm.name,
      description: insertForm.description || null,
      elements: insertForm.elements,
      applicationId: insertForm.applicationId || null,
      dataSourceId: insertForm.dataSourceId || null,
      isPublished: insertForm.isPublished || null,
      createdAt: now,
      updatedAt: now
    };
    this.forms.set(id, form);
    return form;
  }
  
  async updateForm(id: number, partialForm: Partial<InsertForm>): Promise<Form | undefined> {
    const form = this.forms.get(id);
    if (!form) return undefined;
    
    const updatedForm: Form = {
      ...form,
      ...partialForm,
      updatedAt: new Date()
    };
    
    this.forms.set(id, updatedForm);
    return updatedForm;
  }
  
  async deleteForm(id: number): Promise<boolean> {
    return this.forms.delete(id);
  }
  
  async publishForm(id: number): Promise<Form | undefined> {
    const form = this.forms.get(id);
    if (!form) return undefined;
    
    const publishedForm: Form = {
      ...form,
      isPublished: true,
      updatedAt: new Date()
    };
    
    this.forms.set(id, publishedForm);
    return publishedForm;
  }
  
  // Data Source methods
  async getDataSources(): Promise<DataSource[]> {
    return Array.from(this.dataSources.values());
  }
  
  async getDataSource(id: number): Promise<DataSource | undefined> {
    return this.dataSources.get(id);
  }
  
  async createDataSource(insertDataSource: InsertDataSource): Promise<DataSource> {
    const id = this.dataSourceCurrentId++;
    const now = new Date();
    const dataSource: DataSource = {
      id,
      name: insertDataSource.name,
      type: insertDataSource.type,
      config: insertDataSource.config,
      fields: insertDataSource.fields || [],
      selectedFields: insertDataSource.selectedFields || [],
      createdAt: now,
      updatedAt: now
    };
    this.dataSources.set(id, dataSource);
    return dataSource;
  }
  
  async updateDataSource(id: number, partialDataSource: Partial<InsertDataSource>): Promise<DataSource | undefined> {
    const dataSource = this.dataSources.get(id);
    if (!dataSource) return undefined;
    
    const updatedDataSource: DataSource = {
      ...dataSource,
      ...partialDataSource,
      updatedAt: new Date()
    };
    
    this.dataSources.set(id, updatedDataSource);
    return updatedDataSource;
  }
  
  async deleteDataSource(id: number): Promise<boolean> {
    return this.dataSources.delete(id);
  }
  
  // Form Submission methods
  async getFormSubmissions(formId: number): Promise<FormSubmission[]> {
    return Array.from(this.formSubmissions.values())
      .filter(submission => submission.formId === formId);
  }
  
  async createFormSubmission(insertSubmission: InsertFormSubmission): Promise<FormSubmission> {
    const id = this.formSubmissionCurrentId++;
    const now = new Date();
    const submission: FormSubmission = {
      id,
      formId: insertSubmission.formId,
      data: insertSubmission.data,
      createdAt: now
    };
    this.formSubmissions.set(id, submission);
    return submission;
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  async getUsers(): Promise<User[]> {
    return db.select().from(users);
  }
  
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  // Application methods
  async getApplications(): Promise<Application[]> {
    return db.select().from(applications);
  }
  
  async getApplication(id: number): Promise<Application | undefined> {
    const [application] = await db.select().from(applications).where(eq(applications.id, id));
    return application || undefined;
  }
  
  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const [application] = await db
      .insert(applications)
      .values(insertApplication)
      .returning();
    return application;
  }
  
  async updateApplication(id: number, partialApplication: Partial<InsertApplication>): Promise<Application | undefined> {
    const [updatedApplication] = await db
      .update(applications)
      .set(partialApplication)
      .where(eq(applications.id, id))
      .returning();
    
    return updatedApplication || undefined;
  }
  
  async deleteApplication(id: number): Promise<boolean> {
    const result = await db
      .delete(applications)
      .where(eq(applications.id, id));
      
    return !!result;
  }
  
  // Form methods
  async getForms(): Promise<Form[]> {
    return db.select().from(forms);
  }
  
  async getFormsByApplication(applicationId: number): Promise<Form[]> {
    return db
      .select()
      .from(forms)
      .where(eq(forms.applicationId, applicationId));
  }
  
  async getForm(id: number): Promise<Form | undefined> {
    const [form] = await db.select().from(forms).where(eq(forms.id, id));
    return form || undefined;
  }
  
  async createForm(insertForm: InsertForm): Promise<Form> {
    const [form] = await db
      .insert(forms)
      .values(insertForm)
      .returning();
    return form;
  }
  
  async updateForm(id: number, partialForm: Partial<InsertForm>): Promise<Form | undefined> {
    const [updatedForm] = await db
      .update(forms)
      .set(partialForm)
      .where(eq(forms.id, id))
      .returning();
    
    return updatedForm || undefined;
  }
  
  async deleteForm(id: number): Promise<boolean> {
    const result = await db
      .delete(forms)
      .where(eq(forms.id, id));
      
    return !!result;
  }
  
  async publishForm(id: number): Promise<Form | undefined> {
    const [publishedForm] = await db
      .update(forms)
      .set({ isPublished: true })
      .where(eq(forms.id, id))
      .returning();
    
    return publishedForm || undefined;
  }
  
  // Data Source methods
  async getDataSources(): Promise<DataSource[]> {
    return db.select().from(dataSources);
  }
  
  async getDataSource(id: number): Promise<DataSource | undefined> {
    const [dataSource] = await db.select().from(dataSources).where(eq(dataSources.id, id));
    return dataSource || undefined;
  }
  
  async createDataSource(insertDataSource: InsertDataSource): Promise<DataSource> {
    const [dataSource] = await db
      .insert(dataSources)
      .values(insertDataSource)
      .returning();
    return dataSource;
  }
  
  async updateDataSource(id: number, partialDataSource: Partial<InsertDataSource>): Promise<DataSource | undefined> {
    const [updatedDataSource] = await db
      .update(dataSources)
      .set(partialDataSource)
      .where(eq(dataSources.id, id))
      .returning();
    
    return updatedDataSource || undefined;
  }
  
  async deleteDataSource(id: number): Promise<boolean> {
    const result = await db
      .delete(dataSources)
      .where(eq(dataSources.id, id));
      
    return !!result;
  }
  
  // Form Submission methods
  async getFormSubmissions(formId: number): Promise<FormSubmission[]> {
    return db
      .select()
      .from(formSubmissions)
      .where(eq(formSubmissions.formId, formId));
  }
  
  async createFormSubmission(insertSubmission: InsertFormSubmission): Promise<FormSubmission> {
    const [submission] = await db
      .insert(formSubmissions)
      .values(insertSubmission)
      .returning();
    return submission;
  }
}

// Use memory storage for easier testing
export const storage = new MemStorage();
// Uncomment the line below to use database storage instead
// export const storage = new DatabaseStorage();
