import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real } from "drizzle-orm/pg-core";
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

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
