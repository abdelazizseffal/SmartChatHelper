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
} from "@shared/schema-mysql";
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
    const result = await db.select().from(users).where(eq(users.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result.length > 0 ? result[0] : undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    // MySQL doesn't support returning in the same statement
    const inserted = await db.insert(users).values(user);
    
    // Get the inserted user by id
    const insertId = Number(inserted.insertId);
    const [newUser] = await db.select().from(users).where(eq(users.id, insertId));
    
    return newUser;
  }

  async updateUserStripeInfo(userId: number, stripeInfo: { customerId: string; subscriptionId: string }): Promise<User> {
    await db.update(users)
      .set({
        stripeCustomerId: stripeInfo.customerId,
        stripeSubscriptionId: stripeInfo.subscriptionId
      })
      .where(eq(users.id, userId));
    
    // Get the updated user
    const [updatedUser] = await db.select().from(users).where(eq(users.id, userId));
    return updatedUser;
  }

  // Workspace operations
  async createWorkspace(workspace: InsertWorkspace): Promise<Workspace> {
    // MySQL doesn't support returning in the same statement
    const inserted = await db.insert(workspaces).values(workspace);
    
    // Get the inserted workspace by id
    const insertId = Number(inserted.insertId);
    const [newWorkspace] = await db.select().from(workspaces).where(eq(workspaces.id, insertId));
    
    // Add the owner as a member with 'owner' role
    await this.addWorkspaceMember({
      workspaceId: newWorkspace.id,
      userId: workspace.ownerId,
      role: 'owner'
    });
    
    return newWorkspace;
  }

  async getWorkspace(id: number): Promise<Workspace | undefined> {
    const result = await db.select().from(workspaces).where(eq(workspaces.id, id));
    return result.length > 0 ? result[0] : undefined;
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
      const result = await db.select().from(workspaces).where(eq(workspaces.id, member.workspaceId));
      if (result.length > 0) {
        allWorkspaces.push(result[0]);
      }
    }
    
    return allWorkspaces;
  }

  async updateWorkspace(id: number, data: Partial<Workspace>): Promise<Workspace> {
    await db.update(workspaces)
      .set(data)
      .where(eq(workspaces.id, id));
    
    // Get the updated workspace
    const [updatedWorkspace] = await db.select().from(workspaces).where(eq(workspaces.id, id));
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
    // MySQL doesn't support returning in the same statement
    const inserted = await db.insert(workspaceMembers).values(member);
    
    // Get the inserted member by id
    const insertId = Number(inserted.insertId);
    const [newMember] = await db.select().from(workspaceMembers).where(eq(workspaceMembers.id, insertId));
    
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
    await db.update(workspaceMembers)
      .set(data)
      .where(eq(workspaceMembers.id, id));
    
    // Get the updated member
    const [updatedMember] = await db.select().from(workspaceMembers).where(eq(workspaceMembers.id, id));
    return updatedMember;
  }

  async removeWorkspaceMember(id: number): Promise<void> {
    await db.delete(workspaceMembers).where(eq(workspaceMembers.id, id));
  }

  // Project operations
  async createProject(project: InsertProject): Promise<Project> {
    // MySQL doesn't support returning in the same statement
    const inserted = await db.insert(projects).values(project);
    
    // Get the inserted project by id
    const insertId = Number(inserted.insertId);
    const [newProject] = await db.select().from(projects).where(eq(projects.id, insertId));
    
    return newProject;
  }

  async getProject(id: number): Promise<Project | undefined> {
    const result = await db.select().from(projects).where(eq(projects.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getWorkspaceProjects(workspaceId: number): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.workspaceId, workspaceId));
  }

  async updateProject(id: number, data: Partial<Project>): Promise<Project> {
    await db.update(projects)
      .set(data)
      .where(eq(projects.id, id));
    
    // Get the updated project
    const [updatedProject] = await db.select().from(projects).where(eq(projects.id, id));
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
    // MySQL doesn't support returning in the same statement
    const inserted = await db.insert(pipeSpecs).values(pipeSpec);
    
    // Get the inserted pipeSpec by id
    const insertId = Number(inserted.insertId);
    const [newPipeSpec] = await db.select().from(pipeSpecs).where(eq(pipeSpecs.id, insertId));
    
    return newPipeSpec;
  }

  async getProjectPipeSpecs(projectId: number): Promise<PipeSpec[]> {
    return await db.select().from(pipeSpecs).where(eq(pipeSpecs.projectId, projectId));
  }

  async updatePipeSpec(id: number, data: Partial<PipeSpec>): Promise<PipeSpec> {
    await db.update(pipeSpecs)
      .set(data)
      .where(eq(pipeSpecs.id, id));
    
    // Get the updated pipeSpec
    const [updatedPipeSpec] = await db.select().from(pipeSpecs).where(eq(pipeSpecs.id, id));
    return updatedPipeSpec;
  }

  async deletePipeSpec(id: number): Promise<void> {
    await db.delete(pipeSpecs).where(eq(pipeSpecs.id, id));
  }

  // Required cuts operations
  async createRequiredCut(requiredCut: InsertRequiredCut): Promise<RequiredCut> {
    // MySQL doesn't support returning in the same statement
    const inserted = await db.insert(requiredCuts).values(requiredCut);
    
    // Get the inserted requiredCut by id
    const insertId = Number(inserted.insertId);
    const [newRequiredCut] = await db.select().from(requiredCuts).where(eq(requiredCuts.id, insertId));
    
    return newRequiredCut;
  }

  async getProjectRequiredCuts(projectId: number): Promise<RequiredCut[]> {
    return await db.select().from(requiredCuts).where(eq(requiredCuts.projectId, projectId));
  }

  async updateRequiredCut(id: number, data: Partial<RequiredCut>): Promise<RequiredCut> {
    await db.update(requiredCuts)
      .set(data)
      .where(eq(requiredCuts.id, id));
    
    // Get the updated requiredCut
    const [updatedRequiredCut] = await db.select().from(requiredCuts).where(eq(requiredCuts.id, id));
    return updatedRequiredCut;
  }

  async deleteRequiredCut(id: number): Promise<void> {
    await db.delete(requiredCuts).where(eq(requiredCuts.id, id));
  }

  // Optimization results operations
  async createOptimizationResult(result: InsertOptimizationResult): Promise<OptimizationResult> {
    // MySQL doesn't support returning in the same statement
    const inserted = await db.insert(optimizationResults).values(result);
    
    // Get the inserted optimizationResult by id
    const insertId = Number(inserted.insertId);
    const [newOptimizationResult] = await db.select().from(optimizationResults).where(eq(optimizationResults.id, insertId));
    
    return newOptimizationResult;
  }

  async getProjectOptimizationResults(projectId: number): Promise<OptimizationResult[]> {
    return await db.select().from(optimizationResults).where(eq(optimizationResults.projectId, projectId));
  }

  async getOptimizationResult(id: number): Promise<OptimizationResult | undefined> {
    const result = await db.select().from(optimizationResults).where(eq(optimizationResults.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteOptimizationResult(id: number): Promise<void> {
    await db.delete(optimizationResults).where(eq(optimizationResults.id, id));
  }

  // Subscription operations
  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    // MySQL doesn't support returning in the same statement
    const inserted = await db.insert(subscriptions).values(subscription);
    
    // Get the inserted subscription by id
    const insertId = Number(inserted.insertId);
    const [newSubscription] = await db.select().from(subscriptions).where(eq(subscriptions.id, insertId));
    
    return newSubscription;
  }

  async getUserSubscription(userId: number): Promise<Subscription | undefined> {
    const result = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
    return result.length > 0 ? result[0] : undefined;
  }

  async updateSubscription(id: number, data: Partial<Subscription>): Promise<Subscription> {
    await db.update(subscriptions)
      .set(data)
      .where(eq(subscriptions.id, id));
    
    // Get the updated subscription
    const [updatedSubscription] = await db.select().from(subscriptions).where(eq(subscriptions.id, id));
    return updatedSubscription;
  }
}