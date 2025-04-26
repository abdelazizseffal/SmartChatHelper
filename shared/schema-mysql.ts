import { mysqlTable, text, varchar, int, boolean, timestamp, datetime, json, float } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users
export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 100 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 100 }),
  role: varchar("role", { length: 50 }).default("user").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
});

// Workspaces
export const workspaces = mysqlTable("workspaces", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull(),
  ownerId: int("owner_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  settings: json("settings"),
});

export const insertWorkspaceSchema = createInsertSchema(workspaces).pick({
  name: true,
  ownerId: true,
  settings: true,
});

// Workspace Members
export const workspaceMembers = mysqlTable("workspace_members", {
  id: int("id").primaryKey().autoincrement(),
  workspaceId: int("workspace_id").notNull(),
  userId: int("user_id").notNull(),
  role: varchar("role", { length: 50 }).default("member").notNull(),
});

export const insertWorkspaceMemberSchema = createInsertSchema(workspaceMembers).pick({
  workspaceId: true,
  userId: true,
  role: true,
});

// Projects
export const projects = mysqlTable("projects", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull(),
  workspaceId: int("workspace_id").notNull(),
  createdById: int("created_by_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  workspaceId: true,
  createdById: true,
});

// Pipe Specifications
export const pipeSpecs = mysqlTable("pipe_specs", {
  id: int("id").primaryKey().autoincrement(),
  projectId: int("project_id").notNull(),
  length: float("length").notNull(),
  diameter: float("diameter").notNull(),
  thickness: float("thickness").notNull(),
  material: varchar("material", { length: 100 }).notNull(),
  quantity: int("quantity").notNull(),
  createdById: int("created_by_id").notNull(),
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
export const requiredCuts = mysqlTable("required_cuts", {
  id: int("id").primaryKey().autoincrement(),
  projectId: int("project_id").notNull(),
  length: float("length").notNull(),
  quantity: int("quantity").notNull(),
  createdById: int("created_by_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRequiredCutSchema = createInsertSchema(requiredCuts).pick({
  projectId: true,
  length: true,
  quantity: true,
  createdById: true,
});

// Optimization Results
export const optimizationResults = mysqlTable("optimization_results", {
  id: int("id").primaryKey().autoincrement(),
  projectId: int("project_id").notNull(),
  createdById: int("created_by_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  pipesUsed: int("pipes_used").notNull(),
  materialEfficiency: float("material_efficiency").notNull(),
  totalWaste: float("total_waste").notNull(),
  cutOperations: int("cut_operations").notNull(),
  results: json("results").notNull(),
  parameters: json("parameters").notNull(),
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
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  planId: varchar("plan_id", { length: 100 }).notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).pick({
  userId: true,
  planId: true,
  status: true,
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