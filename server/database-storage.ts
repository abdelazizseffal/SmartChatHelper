import session from "express-session";
import { db, pool } from "./db";
import { 
  users, User, InsertUser,
  workspaces, Workspace, InsertWorkspace,
  workspaceMembers, WorkspaceMember, InsertWorkspaceMember,
  projects, Project, InsertProject, 
  pipeSpecs, PipeSpec, InsertPipeSpec,
  requiredCuts, RequiredCut, InsertRequiredCut,
  optimizationResults, OptimizationResult, InsertOptimizationResult,
  subscriptions, Subscription, InsertSubscription,
  subscriptionPlans, SubscriptionPlan, InsertSubscriptionPlan,
  materialGroups, MaterialGroup, InsertMaterialGroup,
  materialWarehouse, MaterialWarehouseItem, InsertMaterialWarehouseItem,
  customTextFields, CustomTextField, InsertCustomTextField,
  cuttingPlans, CuttingPlan, InsertCuttingPlan,
  userSettings, UserSettings, InsertUserSettings
} from "@shared/schema";
import { eq, and } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { IStorage } from "./storage";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUserStripeInfo(userId: number, stripeInfo: { customerId: string; subscriptionId: string }): Promise<User> {
    const [updatedUser] = await db.update(users)
      .set({
        stripeCustomerId: stripeInfo.customerId,
        stripeSubscriptionId: stripeInfo.subscriptionId
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  // Workspace operations
  async createWorkspace(workspace: InsertWorkspace): Promise<Workspace> {
    const [newWorkspace] = await db.insert(workspaces).values(workspace).returning();
    
    // Add the owner as a member with 'owner' role
    await this.addWorkspaceMember({
      workspaceId: newWorkspace.id,
      userId: workspace.ownerId,
      role: 'owner'
    });
    
    return newWorkspace;
  }

  async getWorkspace(id: number): Promise<Workspace | undefined> {
    const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, id));
    return workspace;
  }

  async getUserWorkspaces(userId: number): Promise<Workspace[]> {
    // Get workspace IDs where the user is a member
    const members = await db.select().from(workspaceMembers).where(eq(workspaceMembers.userId, userId));
    
    if (members.length === 0) {
      return [];
    }
    
    const workspaceIds = members.map(member => member.workspaceId);
    
    // If no memberships, return empty array
    if (workspaceIds.length === 0) {
      return [];
    }
    
    // Get all workspaces manually by ID - we have to do this because drizzle-orm doesn't have an "in" operator
    const allWorkspaces = [];
    for (const workspaceId of workspaceIds) {
      const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId));
      if (workspace) {
        allWorkspaces.push(workspace);
      }
    }
    
    return allWorkspaces;
  }

  async updateWorkspace(id: number, data: Partial<Workspace>): Promise<Workspace> {
    const [updatedWorkspace] = await db.update(workspaces)
      .set(data)
      .where(eq(workspaces.id, id))
      .returning();
    return updatedWorkspace;
  }

  async deleteWorkspace(id: number): Promise<void> {
    // Delete all related records first to maintain referential integrity
    await db.delete(workspaceMembers).where(eq(workspaceMembers.workspaceId, id));
    
    // Get all projects in this workspace
    const projectsToDelete = await db.select().from(projects).where(eq(projects.workspaceId, id));
    
    for (const project of projectsToDelete) {
      await this.deleteProject(project.id);
    }
    
    // Now delete the workspace
    await db.delete(workspaces).where(eq(workspaces.id, id));
  }

  // Workspace membership operations
  async addWorkspaceMember(member: InsertWorkspaceMember): Promise<WorkspaceMember> {
    const [newMember] = await db.insert(workspaceMembers).values(member).returning();
    return newMember;
  }

  async getWorkspaceMembers(workspaceId: number): Promise<(WorkspaceMember & { user: User })[]> {
    // This is a complex query to join workspace members with users
    const result = await db.select({
      member: workspaceMembers,
      user: users
    })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.workspaceId, workspaceId))
    .innerJoin(users, eq(workspaceMembers.userId, users.id));
    
    // Transform the result to match the expected format
    return result.map(({ member, user }) => ({
      ...member,
      user
    }));
  }

  async updateWorkspaceMember(id: number, data: Partial<WorkspaceMember>): Promise<WorkspaceMember> {
    const [updatedMember] = await db.update(workspaceMembers)
      .set(data)
      .where(eq(workspaceMembers.id, id))
      .returning();
    return updatedMember;
  }

  async removeWorkspaceMember(id: number): Promise<void> {
    await db.delete(workspaceMembers).where(eq(workspaceMembers.id, id));
  }

  // Project operations
  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async getWorkspaceProjects(workspaceId: number): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.workspaceId, workspaceId));
  }

  async updateProject(id: number, data: Partial<Project>): Promise<Project> {
    const [updatedProject] = await db.update(projects)
      .set(data)
      .where(eq(projects.id, id))
      .returning();
    return updatedProject;
  }

  async deleteProject(id: number): Promise<void> {
    // Delete all related records first to maintain referential integrity
    await db.delete(pipeSpecs).where(eq(pipeSpecs.projectId, id));
    await db.delete(requiredCuts).where(eq(requiredCuts.projectId, id));
    await db.delete(optimizationResults).where(eq(optimizationResults.projectId, id));
    
    // Now delete the project
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Pipe specs operations
  async createPipeSpec(pipeSpec: InsertPipeSpec): Promise<PipeSpec> {
    const [newPipeSpec] = await db.insert(pipeSpecs).values(pipeSpec).returning();
    return newPipeSpec;
  }

  async getProjectPipeSpecs(projectId: number): Promise<PipeSpec[]> {
    return await db.select().from(pipeSpecs).where(eq(pipeSpecs.projectId, projectId));
  }

  async updatePipeSpec(id: number, data: Partial<PipeSpec>): Promise<PipeSpec> {
    const [updatedPipeSpec] = await db.update(pipeSpecs)
      .set(data)
      .where(eq(pipeSpecs.id, id))
      .returning();
    return updatedPipeSpec;
  }

  async deletePipeSpec(id: number): Promise<void> {
    await db.delete(pipeSpecs).where(eq(pipeSpecs.id, id));
  }

  // Required cuts operations
  async createRequiredCut(requiredCut: InsertRequiredCut): Promise<RequiredCut> {
    const [newRequiredCut] = await db.insert(requiredCuts).values(requiredCut).returning();
    return newRequiredCut;
  }

  async getProjectRequiredCuts(projectId: number): Promise<RequiredCut[]> {
    return await db.select().from(requiredCuts).where(eq(requiredCuts.projectId, projectId));
  }

  async updateRequiredCut(id: number, data: Partial<RequiredCut>): Promise<RequiredCut> {
    const [updatedRequiredCut] = await db.update(requiredCuts)
      .set(data)
      .where(eq(requiredCuts.id, id))
      .returning();
    return updatedRequiredCut;
  }

  async deleteRequiredCut(id: number): Promise<void> {
    await db.delete(requiredCuts).where(eq(requiredCuts.id, id));
  }

  // Optimization results operations
  async createOptimizationResult(result: InsertOptimizationResult): Promise<OptimizationResult> {
    const [newOptimizationResult] = await db.insert(optimizationResults).values(result).returning();
    return newOptimizationResult;
  }

  async getProjectOptimizationResults(projectId: number): Promise<OptimizationResult[]> {
    return await db.select().from(optimizationResults).where(eq(optimizationResults.projectId, projectId));
  }

  async getOptimizationResult(id: number): Promise<OptimizationResult | undefined> {
    const [result] = await db.select().from(optimizationResults).where(eq(optimizationResults.id, id));
    return result;
  }

  async deleteOptimizationResult(id: number): Promise<void> {
    await db.delete(optimizationResults).where(eq(optimizationResults.id, id));
  }

  // Subscription operations
  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [newSubscription] = await db.insert(subscriptions).values(subscription).returning();
    return newSubscription;
  }

  async getUserSubscription(userId: number): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
    return subscription;
  }

  async updateSubscription(id: number, data: Partial<Subscription>): Promise<Subscription> {
    const [updatedSubscription] = await db.update(subscriptions)
      .set(data)
      .where(eq(subscriptions.id, id))
      .returning();
    return updatedSubscription;
  }

  async incrementProjectCount(userId: number): Promise<Subscription> {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription) {
      throw new Error(`Subscription for user with ID ${userId} not found`);
    }
    
    const [updatedSubscription] = await db.update(subscriptions)
      .set({
        projectsCreated: subscription.projectsCreated + 1
      })
      .where(eq(subscriptions.id, subscription.id))
      .returning();
    
    return updatedSubscription;
  }
  
  async incrementOptimizationCount(userId: number): Promise<Subscription> {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription) {
      throw new Error(`Subscription for user with ID ${userId} not found`);
    }
    
    const [updatedSubscription] = await db.update(subscriptions)
      .set({
        optimizationsRun: subscription.optimizationsRun + 1
      })
      .where(eq(subscriptions.id, subscription.id))
      .returning();
    
    return updatedSubscription;
  }

  // Subscription Plan operations
  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const [newPlan] = await db.insert(subscriptionPlans).values(plan).returning();
    return newPlan;
  }

  async getSubscriptionPlan(planId: string): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.planId, planId));
    return plan;
  }

  async getSubscriptionPlanById(id: number): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id));
    return plan;
  }

  async getSubscriptionPlanByPlanId(planId: string): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.planId, planId));
    return plan;
  }

  async getAllSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await db.select().from(subscriptionPlans);
  }

  async getActiveSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.active, true));
  }

  async updateSubscriptionPlan(id: number, data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    const [updatedPlan] = await db.update(subscriptionPlans)
      .set(data)
      .where(eq(subscriptionPlans.id, id))
      .returning();
    return updatedPlan;
  }

  async deleteSubscriptionPlan(id: number): Promise<void> {
    await db.delete(subscriptionPlans).where(eq(subscriptionPlans.id, id));
  }

  // Material Group operations
  async createMaterialGroup(group: InsertMaterialGroup): Promise<MaterialGroup> {
    const [newGroup] = await db.insert(materialGroups).values(group).returning();
    return newGroup;
  }

  async getMaterialGroup(id: number): Promise<MaterialGroup | undefined> {
    const [group] = await db.select().from(materialGroups).where(eq(materialGroups.id, id));
    return group;
  }

  async getWorkspaceMaterialGroups(workspaceId: number): Promise<MaterialGroup[]> {
    return await db.select().from(materialGroups).where(eq(materialGroups.workspaceId, workspaceId));
  }

  async updateMaterialGroup(id: number, data: Partial<MaterialGroup>): Promise<MaterialGroup> {
    const [updatedGroup] = await db.update(materialGroups)
      .set(data)
      .where(eq(materialGroups.id, id))
      .returning();
    return updatedGroup;
  }

  async deleteMaterialGroup(id: number): Promise<void> {
    await db.delete(materialGroups).where(eq(materialGroups.id, id));
  }

  // Material Warehouse operations
  async createMaterialWarehouseItem(item: InsertMaterialWarehouseItem): Promise<MaterialWarehouseItem> {
    const [newItem] = await db.insert(materialWarehouse).values(item).returning();
    return newItem;
  }

  async getMaterialWarehouseItem(id: number): Promise<MaterialWarehouseItem | undefined> {
    const [item] = await db.select().from(materialWarehouse).where(eq(materialWarehouse.id, id));
    return item;
  }

  async getWorkspaceMaterialWarehouse(workspaceId: number): Promise<MaterialWarehouseItem[]> {
    return await db.select().from(materialWarehouse).where(eq(materialWarehouse.workspaceId, workspaceId));
  }

  async updateMaterialWarehouseItem(id: number, data: Partial<MaterialWarehouseItem>): Promise<MaterialWarehouseItem> {
    const [updatedItem] = await db.update(materialWarehouse)
      .set(data)
      .where(eq(materialWarehouse.id, id))
      .returning();
    return updatedItem;
  }

  async deleteMaterialWarehouseItem(id: number): Promise<void> {
    await db.delete(materialWarehouse).where(eq(materialWarehouse.id, id));
  }

  // Custom Text Fields operations
  async createCustomTextField(field: InsertCustomTextField): Promise<CustomTextField> {
    const [newField] = await db.insert(customTextFields).values(field).returning();
    return newField;
  }

  async getCustomTextField(id: number): Promise<CustomTextField | undefined> {
    const [field] = await db.select().from(customTextFields).where(eq(customTextFields.id, id));
    return field;
  }

  async getWorkspaceCustomTextFields(workspaceId: number): Promise<CustomTextField[]> {
    return await db.select().from(customTextFields).where(eq(customTextFields.workspaceId, workspaceId));
  }

  async updateCustomTextField(id: number, data: Partial<CustomTextField>): Promise<CustomTextField> {
    const [updatedField] = await db.update(customTextFields)
      .set(data)
      .where(eq(customTextFields.id, id))
      .returning();
    return updatedField;
  }

  async deleteCustomTextField(id: number): Promise<void> {
    await db.delete(customTextFields).where(eq(customTextFields.id, id));
  }

  // Cutting Plan operations
  async createCuttingPlan(plan: InsertCuttingPlan): Promise<CuttingPlan> {
    const [newPlan] = await db.insert(cuttingPlans).values(plan).returning();
    return newPlan;
  }

  async getCuttingPlan(id: number): Promise<CuttingPlan | undefined> {
    const [plan] = await db.select().from(cuttingPlans).where(eq(cuttingPlans.id, id));
    return plan;
  }

  async getWorkspaceCuttingPlans(workspaceId: number): Promise<CuttingPlan[]> {
    return await db.select().from(cuttingPlans).where(eq(cuttingPlans.workspaceId, workspaceId));
  }

  async updateCuttingPlan(id: number, data: Partial<CuttingPlan>): Promise<CuttingPlan> {
    const [updatedPlan] = await db.update(cuttingPlans)
      .set(data)
      .where(eq(cuttingPlans.id, id))
      .returning();
    return updatedPlan;
  }

  async deleteCuttingPlan(id: number): Promise<void> {
    await db.delete(cuttingPlans).where(eq(cuttingPlans.id, id));
  }

  // User Settings operations
  async getUserSettings(userId: number): Promise<UserSettings | undefined> {
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    return settings;
  }

  async createOrUpdateUserSettings(settings: InsertUserSettings): Promise<UserSettings> {
    // Check if settings already exist for this user
    const existingSettings = await this.getUserSettings(settings.userId);
    
    if (existingSettings) {
      // Update existing settings
      const [updatedSettings] = await db.update(userSettings)
        .set({
          ...settings,
          updatedAt: new Date()
        })
        .where(eq(userSettings.userId, settings.userId))
        .returning();
      return updatedSettings;
    } else {
      // Create new settings
      const [newSettings] = await db.insert(userSettings)
        .values({
          ...settings,
          updatedAt: new Date()
        })
        .returning();
      return newSettings;
    }
  }
}