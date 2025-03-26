import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"), // "admin" or "user"
  email: text("email").notNull(),
  name: text("name").notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Applications schema
export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon").default("app"),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  createdBy: z.number().optional()
});

export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applications.$inferSelect;

// Form Element Types
// We need to define the base schema first to avoid circular references
const formElementBase = z.object({
  id: z.string(),
  type: z.enum([
    "text", "number", "date", "textarea", "dropdown", 
    "radio", "checkbox", "toggle", "section", "column", "divider",
    "button" // Added button type
  ]),
  label: z.string(),
  name: z.string(),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  required: z.boolean().default(false),
  validation: z.object({
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    pattern: z.string().optional(),
    errorMessage: z.string().optional(),
  }).optional(),
  options: z.array(z.object({
    label: z.string(),
    value: z.string()
  })).optional(),
  dataSource: z.object({
    id: z.string().optional(),
    field: z.string().optional()
  }).optional(),
  defaultValue: z.string().optional(),
  cssClass: z.string().optional(),
  visibilityCondition: z.object({
    field: z.string(),
    operator: z.string(),
    value: z.string()
  }).optional(),
  // New properties for buttons
  buttonType: z.enum(["submit", "reset", "approve", "reject", "custom"]).optional(),
  buttonVariant: z.enum(["default", "primary", "secondary", "outline", "destructive", "ghost", "link"]).optional(),
  buttonAction: z.object({
    type: z.enum(["submit-form", "reset-form", "approve", "reject", "navigate", "custom-code"]).optional(),
    confirmationMessage: z.string().optional(),
    requireConfirmation: z.boolean().optional(),
    requireReason: z.boolean().optional(),
    navigateTo: z.string().optional(),
    customCode: z.string().optional(),
    notifyUsers: z.array(z.string()).optional(),
    validationRules: z.string().optional(),
    onSuccess: z.string().optional(),
    onError: z.string().optional()
  }).optional(),
});

// Now define the full schema with recursive elements
export const formElementSchema: z.ZodType<any> = formElementBase.extend({
  columns: z.array(z.object({
    id: z.string(),
    elements: z.array(z.lazy(() => formElementSchema)).optional()
  })).optional(),
  elements: z.array(z.lazy(() => formElementSchema)).optional(),
});

export type FormElement = z.infer<typeof formElementSchema>;

// Forms schema
export const forms = pgTable("forms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  applicationId: integer("application_id"), // Link to the application
  elements: jsonb("elements").notNull(),
  dataSourceId: text("data_source_id"),
  isPublished: boolean("is_published").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertFormSchema = createInsertSchema(forms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertForm = z.infer<typeof insertFormSchema>;
export type Form = typeof forms.$inferSelect;

// Define Field Type schema
export const fieldSchema = z.object({
  name: z.string(),
  type: z.string(),
  selected: z.boolean().optional(),
});

export type Field = z.infer<typeof fieldSchema>;

// Data Sources schema
export const dataSources = pgTable("data_sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // "database", "sharepoint", or "excel"
  config: jsonb("config").notNull(),
  fields: jsonb("fields").default('[]'), // Store the field mappings
  selectedFields: jsonb("selected_fields").default('[]'), // Store the selected field names
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDataSourceSchema = createInsertSchema(dataSources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  fields: z.array(fieldSchema).optional().default([]),
  selectedFields: z.array(z.string()).optional().default([]),
});

export type InsertDataSource = z.infer<typeof insertDataSourceSchema>;
export type DataSource = typeof dataSources.$inferSelect;

// Form Submissions schema
export const formSubmissions = pgTable("form_submissions", {
  id: serial("id").primaryKey(),
  formId: integer("form_id").notNull(),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFormSubmissionSchema = createInsertSchema(formSubmissions).omit({
  id: true,
  createdAt: true,
});

export type InsertFormSubmission = z.infer<typeof insertFormSubmissionSchema>;
export type FormSubmission = typeof formSubmissions.$inferSelect;

// Approval Requests Schema
export const approvalRequests = pgTable("approval_requests", {
  id: serial("id").primaryKey(),
  formSubmissionId: integer("form_submission_id").references(() => formSubmissions.id),
  requesterId: integer("requester_id").references(() => users.id),
  status: text("status").default("pending").notNull(), // pending, approved, rejected
  approvedById: integer("approved_by_id").references(() => users.id),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertApprovalRequestSchema = createInsertSchema(approvalRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvedById: true,
  status: true,
});

export type InsertApprovalRequest = z.infer<typeof insertApprovalRequestSchema>;
export type ApprovalRequest = typeof approvalRequests.$inferSelect;
