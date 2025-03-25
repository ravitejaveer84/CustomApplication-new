import { 
  users, type User, type InsertUser,
  forms, type Form, type InsertForm,
  dataSources, type DataSource, type InsertDataSource,
  formSubmissions, type FormSubmission, type InsertFormSubmission
} from "@shared/schema";

// Storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Form methods
  getForms(): Promise<Form[]>;
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
  private forms: Map<number, Form>;
  private dataSources: Map<number, DataSource>;
  private formSubmissions: Map<number, FormSubmission>;
  
  private userCurrentId: number;
  private formCurrentId: number;
  private dataSourceCurrentId: number;
  private formSubmissionCurrentId: number;

  constructor() {
    this.users = new Map();
    this.forms = new Map();
    this.dataSources = new Map();
    this.formSubmissions = new Map();
    
    this.userCurrentId = 1;
    this.formCurrentId = 1;
    this.dataSourceCurrentId = 1;
    this.formSubmissionCurrentId = 1;
  }

  // User methods
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
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Form methods
  async getForms(): Promise<Form[]> {
    return Array.from(this.forms.values());
  }
  
  async getForm(id: number): Promise<Form | undefined> {
    return this.forms.get(id);
  }
  
  async createForm(insertForm: InsertForm): Promise<Form> {
    const id = this.formCurrentId++;
    const now = new Date();
    const form: Form = { 
      ...insertForm, 
      id,
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
      ...insertDataSource,
      id,
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
      ...insertSubmission,
      id,
      createdAt: now
    };
    this.formSubmissions.set(id, submission);
    return submission;
  }
}

export const storage = new MemStorage();
