import session from "express-session";
import { db, pool } from "./mysql-db";
import { 
  users, User, InsertUser,
  workspaces, Workspace, InsertWorkspace,
  workspaceMembers, WorkspaceMember, InsertWorkspaceMember,
  projects, Project, InsertProject, 
  pipeSpecs, PipeSpec, InsertPipeSpec,
  requiredCuts, RequiredCut, InsertRequiredCut,
  optimizationResults, OptimizationResult, InsertOptimizationResult,
  subscriptions, Subscription, InsertSubscription 
} from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { IStorage } from "./storage";
import createMemoryStore from "memorystore";

// Use MemoryStore for sessions since MySQL doesn't have a good session store
const MemoryStore = createMemoryStore(session);

export class MySQLStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // Using memory store for sessions since connect-mysql is outdated
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
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
    
    // Get all workspaces manually by ID
    const allWorkspaces = [];
    for (const member of members) {
      const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, member.workspaceId));
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
    // For MySQL, we'll need to make separate queries and combine them
    const members = await db.select().from(workspaceMembers).where(eq(workspaceMembers.workspaceId, workspaceId));
    
    // Get users for each member
    const membersWithUsers = [];
    for (const member of members) {
      const [user] = await db.select().from(users).where(eq(users.id, member.userId));
      if (user) {
        membersWithUsers.push({
          ...member,
          user
        });
      }
    }
    
    return membersWithUsers;
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
}