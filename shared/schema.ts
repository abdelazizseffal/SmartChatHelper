import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real, primaryKey, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  role: text("role").default("user").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
});

// Workspaces
export const workspaces = pgTable("workspaces", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ownerId: integer("owner_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  settings: jsonb("settings"),
});

export const insertWorkspaceSchema = createInsertSchema(workspaces).pick({
  name: true,
  ownerId: true,
  settings: true,
});

// Workspace Members
export const workspaceMembers = pgTable("workspace_members", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").notNull(),
  userId: integer("user_id").notNull(),
  role: text("role").default("member").notNull(),
});

export const insertWorkspaceMemberSchema = createInsertSchema(workspaceMembers).pick({
  workspaceId: true,
  userId: true,
  role: true,
});

// Projects
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  workspaceId: integer("workspace_id").notNull(),
  createdById: integer("created_by_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  workspaceId: true,
  createdById: true,
});

// Pipe Specifications
export const pipeSpecs = pgTable("pipe_specs", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  length: real("length").notNull(),
  diameter: real("diameter").notNull(),
  thickness: real("thickness").notNull(),
  material: text("material").notNull(),
  quantity: integer("quantity").notNull(),
  createdById: integer("created_by_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPipeSpecSchema = createInsertSchema(pipeSpecs).pick({
  projectId: true,
  length: true,
  diameter: true,
  thickness: true,
  material: true,
  quantity: true,
  createdById: true,
});

// Required Cuts
export const requiredCuts = pgTable("required_cuts", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  length: real("length").notNull(),
  quantity: integer("quantity").notNull(),
  createdById: integer("created_by_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRequiredCutSchema = createInsertSchema(requiredCuts).pick({
  projectId: true,
  length: true,
  quantity: true,
  createdById: true,
});

// Optimization Results
export const optimizationResults = pgTable("optimization_results", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  createdById: integer("created_by_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  pipesUsed: integer("pipes_used").notNull(),
  materialEfficiency: real("material_efficiency").notNull(),
  totalWaste: real("total_waste").notNull(),
  cutOperations: integer("cut_operations").notNull(),
  results: jsonb("results").notNull(),
  parameters: jsonb("parameters").notNull(),
});

export const insertOptimizationResultSchema = createInsertSchema(optimizationResults).pick({
  projectId: true,
  createdById: true,
  pipesUsed: true,
  materialEfficiency: true,
  totalWaste: true,
  cutOperations: true,
  results: true,
  parameters: true,
});

// Subscription Plans
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  planId: text("plan_id").notNull().unique(),
  name: text("name").notNull(),
  price: real("price").notNull(),
  interval: text("interval").notNull().default("monthly"),
  description: text("description"),
  features: jsonb("features").$type<string[]>(),
  projectLimit: integer("project_limit").notNull(),
  optimizationLimit: integer("optimization_limit").notNull(),
  pdfExportEnabled: boolean("pdf_export_enabled").notNull().default(false),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).pick({
  planId: true,
  name: true,
  price: true,
  interval: true,
  description: true,
  features: true,
  projectLimit: true,
  optimizationLimit: true,
  pdfExportEnabled: true,
  active: true,
});

// Subscriptions
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  planId: text("plan_id").notNull(),
  status: text("status").notNull(),
  paymentMethod: text("payment_method"),
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  projectsCreated: integer("projects_created").notNull().default(0),
  optimizationsRun: integer("optimizations_run").notNull().default(0),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).pick({
  userId: true,
  planId: true,
  status: true,
  paymentMethod: true,
  currentPeriodStart: true,
  currentPeriodEnd: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Workspace = typeof workspaces.$inferSelect;
export type InsertWorkspace = z.infer<typeof insertWorkspaceSchema>;

export type WorkspaceMember = typeof workspaceMembers.$inferSelect;
export type InsertWorkspaceMember = z.infer<typeof insertWorkspaceMemberSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type PipeSpec = typeof pipeSpecs.$inferSelect;
export type InsertPipeSpec = z.infer<typeof insertPipeSpecSchema>;

export type RequiredCut = typeof requiredCuts.$inferSelect;
export type InsertRequiredCut = z.infer<typeof insertRequiredCutSchema>;

export type OptimizationResult = typeof optimizationResults.$inferSelect;
export type InsertOptimizationResult = z.infer<typeof insertOptimizationResultSchema>;

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

// Material Groups
export const materialGroups = pgTable("material_groups", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").notNull(),
  name: text("name").notNull(),
  createdById: integer("created_by_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMaterialGroupSchema = createInsertSchema(materialGroups).pick({
  workspaceId: true,
  name: true,
  createdById: true,
});

export type MaterialGroup = typeof materialGroups.$inferSelect;
export type InsertMaterialGroup = z.infer<typeof insertMaterialGroupSchema>;

// Material Warehouse (remnants)
export const materialWarehouse = pgTable("material_warehouse", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").notNull(),
  material: text("material").notNull(),
  length: real("length").notNull(),
  diameter: real("diameter").notNull(),
  thickness: real("thickness").notNull(),
  groupId: integer("group_id"),
  status: text("status").default("available").notNull(),
  createdById: integer("created_by_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  notes: text("notes"),
});

export const insertMaterialWarehouseSchema = createInsertSchema(materialWarehouse).pick({
  workspaceId: true,
  material: true,
  length: true,
  diameter: true,
  thickness: true,
  groupId: true,
  status: true,
  createdById: true,
  notes: true,
});

export type MaterialWarehouseItem = typeof materialWarehouse.$inferSelect;
export type InsertMaterialWarehouseItem = z.infer<typeof insertMaterialWarehouseSchema>;

// Custom Text Fields
export const customTextFields = pgTable("custom_text_fields", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").notNull(),
  fieldName: text("field_name").notNull(),
  displayInPlans: boolean("display_in_plans").default(true).notNull(),
  fieldOrder: integer("field_order").default(0).notNull(),
  createdById: integer("created_by_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCustomTextFieldSchema = createInsertSchema(customTextFields).pick({
  workspaceId: true,
  fieldName: true,
  displayInPlans: true,
  fieldOrder: true,
  createdById: true,
});

export type CustomTextField = typeof customTextFields.$inferSelect;
export type InsertCustomTextField = z.infer<typeof insertCustomTextFieldSchema>;

// Cutting Plans
export const cuttingPlans = pgTable("cutting_plans", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").notNull(),
  name: text("name").notNull(),
  optimizationResultId: integer("optimization_result_id").notNull(),
  status: text("status").default("draft").notNull(),
  customFields: jsonb("custom_fields"),
  createdById: integer("created_by_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCuttingPlanSchema = createInsertSchema(cuttingPlans).pick({
  workspaceId: true,
  name: true,
  optimizationResultId: true,
  status: true,
  customFields: true,
  createdById: true,
});

export type CuttingPlan = typeof cuttingPlans.$inferSelect;
export type InsertCuttingPlan = z.infer<typeof insertCuttingPlanSchema>;

// User Settings
export const userSettings = pgTable("user_settings", {
  userId: integer("user_id").primaryKey(),
  preferences: jsonb("preferences").default({}).notNull(),
  kerfWidth: real("kerf_width").default(2.0).notNull(),
  minWasteThreshold: real("min_waste_threshold").default(100).notNull(),
  displayLabels: boolean("display_labels").default(true).notNull(),
  colorHighlighting: boolean("color_highlighting").default(true).notNull(),
  leftTrim: real("left_trim").default(0).notNull(),
  rightTrim: real("right_trim").default(0).notNull(),
  showAdditionalInfo: boolean("show_additional_info").default(true).notNull(),
  includePartsList: boolean("include_parts_list").default(true).notNull(),
  minRemnantLength: real("min_remnant_length").default(100).notNull(),
  measurementFormat: text("measurement_format").default("generic").notNull(),
  canUsePipeCuttingOptimization: boolean("can_use_pipe_cutting_optimization").default(true).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSettingsSchema = createInsertSchema(userSettings)
  .omit({ userId: true })
  .extend({
    userId: z.number(),
  });

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
