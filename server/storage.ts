import { users, workspaces, workspaceMembers, projects, pipeSpecs, requiredCuts, optimizationResults, subscriptions, subscriptionPlans, materialGroups, materialWarehouse, customTextFields, cuttingPlans, userSettings } from "@shared/schema";
import type { 
  User, InsertUser, Workspace, InsertWorkspace, WorkspaceMember, InsertWorkspaceMember, 
  Project, InsertProject, PipeSpec, InsertPipeSpec, RequiredCut, InsertRequiredCut, 
  OptimizationResult, InsertOptimizationResult, Subscription, InsertSubscription, 
  SubscriptionPlan, InsertSubscriptionPlan, MaterialGroup, InsertMaterialGroup,
  MaterialWarehouseItem, InsertMaterialWarehouseItem, CustomTextField, InsertCustomTextField,
  CuttingPlan, InsertCuttingPlan, UserSettings, InsertUserSettings
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Storage interface
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStripeInfo(userId: number, stripeInfo: { customerId: string; subscriptionId: string }): Promise<User>;
  
  // Workspace operations
  createWorkspace(workspace: InsertWorkspace): Promise<Workspace>;
  getWorkspace(id: number): Promise<Workspace | undefined>;
  getUserWorkspaces(userId: number): Promise<Workspace[]>;
  updateWorkspace(id: number, data: Partial<Workspace>): Promise<Workspace>;
  deleteWorkspace(id: number): Promise<void>;
  
  // Workspace membership operations
  addWorkspaceMember(member: InsertWorkspaceMember): Promise<WorkspaceMember>;
  getWorkspaceMembers(workspaceId: number): Promise<(WorkspaceMember & { user: User })[]>;
  updateWorkspaceMember(id: number, data: Partial<WorkspaceMember>): Promise<WorkspaceMember>;
  removeWorkspaceMember(id: number): Promise<void>;
  
  // Project operations
  createProject(project: InsertProject): Promise<Project>;
  getProject(id: number): Promise<Project | undefined>;
  getWorkspaceProjects(workspaceId: number): Promise<Project[]>;
  updateProject(id: number, data: Partial<Project>): Promise<Project>;
  deleteProject(id: number): Promise<void>;
  
  // Pipe specs operations
  createPipeSpec(pipeSpec: InsertPipeSpec): Promise<PipeSpec>;
  getProjectPipeSpecs(projectId: number): Promise<PipeSpec[]>;
  updatePipeSpec(id: number, data: Partial<PipeSpec>): Promise<PipeSpec>;
  deletePipeSpec(id: number): Promise<void>;
  
  // Required cuts operations
  createRequiredCut(requiredCut: InsertRequiredCut): Promise<RequiredCut>;
  getProjectRequiredCuts(projectId: number): Promise<RequiredCut[]>;
  updateRequiredCut(id: number, data: Partial<RequiredCut>): Promise<RequiredCut>;
  deleteRequiredCut(id: number): Promise<void>;
  
  // Optimization results operations
  createOptimizationResult(result: InsertOptimizationResult): Promise<OptimizationResult>;
  getProjectOptimizationResults(projectId: number): Promise<OptimizationResult[]>;
  getOptimizationResult(id: number): Promise<OptimizationResult | undefined>;
  deleteOptimizationResult(id: number): Promise<void>;
  
  // Subscription operations
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getUserSubscription(userId: number): Promise<Subscription | undefined>;
  updateSubscription(id: number, data: Partial<Subscription>): Promise<Subscription>;
  incrementProjectCount(userId: number): Promise<Subscription>;
  incrementOptimizationCount(userId: number): Promise<Subscription>;
  
  // Subscription Plan operations
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  getSubscriptionPlan(planId: string): Promise<SubscriptionPlan | undefined>;
  getSubscriptionPlanById(id: number): Promise<SubscriptionPlan | undefined>;
  getSubscriptionPlanByPlanId(planId: string): Promise<SubscriptionPlan | undefined>;
  getAllSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getActiveSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  updateSubscriptionPlan(id: number, data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan>;
  deleteSubscriptionPlan(id: number): Promise<void>;
  
  // Material Group operations
  createMaterialGroup(group: InsertMaterialGroup): Promise<MaterialGroup>;
  getMaterialGroup(id: number): Promise<MaterialGroup | undefined>;
  getWorkspaceMaterialGroups(workspaceId: number): Promise<MaterialGroup[]>;
  updateMaterialGroup(id: number, data: Partial<MaterialGroup>): Promise<MaterialGroup>;
  deleteMaterialGroup(id: number): Promise<void>;
  
  // Material Warehouse operations
  createMaterialWarehouseItem(item: InsertMaterialWarehouseItem): Promise<MaterialWarehouseItem>;
  getMaterialWarehouseItem(id: number): Promise<MaterialWarehouseItem | undefined>;
  getWorkspaceMaterialWarehouse(workspaceId: number): Promise<MaterialWarehouseItem[]>;
  updateMaterialWarehouseItem(id: number, data: Partial<MaterialWarehouseItem>): Promise<MaterialWarehouseItem>;
  deleteMaterialWarehouseItem(id: number): Promise<void>;
  
  // Custom Text Fields operations
  createCustomTextField(field: InsertCustomTextField): Promise<CustomTextField>;
  getCustomTextField(id: number): Promise<CustomTextField | undefined>;
  getWorkspaceCustomTextFields(workspaceId: number): Promise<CustomTextField[]>;
  updateCustomTextField(id: number, data: Partial<CustomTextField>): Promise<CustomTextField>;
  deleteCustomTextField(id: number): Promise<void>;
  
  // Cutting Plan operations
  createCuttingPlan(plan: InsertCuttingPlan): Promise<CuttingPlan>;
  getCuttingPlan(id: number): Promise<CuttingPlan | undefined>;
  getWorkspaceCuttingPlans(workspaceId: number): Promise<CuttingPlan[]>;
  updateCuttingPlan(id: number, data: Partial<CuttingPlan>): Promise<CuttingPlan>;
  deleteCuttingPlan(id: number): Promise<void>;
  
  // User Settings operations
  getUserSettings(userId: number): Promise<UserSettings | undefined>;
  createOrUpdateUserSettings(settings: InsertUserSettings): Promise<UserSettings>;
  
  // Session store
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private workspaces: Map<number, Workspace>;
  private workspaceMembers: Map<number, WorkspaceMember>;
  private projects: Map<number, Project>;
  private pipeSpecs: Map<number, PipeSpec>;
  private requiredCuts: Map<number, RequiredCut>;
  private optimizationResults: Map<number, OptimizationResult>;
  private subscriptions: Map<number, Subscription>;
  private subscriptionPlans: Map<number, SubscriptionPlan>;
  private materialGroups: Map<number, MaterialGroup> = new Map();
  private materialWarehouse: Map<number, MaterialWarehouseItem> = new Map();
  private customTextFields: Map<number, CustomTextField> = new Map();
  private cuttingPlans: Map<number, CuttingPlan> = new Map();
  private userSettings: Map<number, UserSettings> = new Map();
  
  sessionStore: session.Store;
  
  private userIdCounter: number = 1;
  private workspaceIdCounter: number = 1;
  private workspaceMemberIdCounter: number = 1;
  private projectIdCounter: number = 1;
  private pipeSpecIdCounter: number = 1;
  private requiredCutIdCounter: number = 1;
  private optimizationResultIdCounter: number = 1;
  private subscriptionIdCounter: number = 1;
  private subscriptionPlanIdCounter: number = 1;
  private materialGroupIdCounter: number = 1;
  private materialWarehouseIdCounter: number = 1;
  private customTextFieldIdCounter: number = 1;
  private cuttingPlanIdCounter: number = 1;
  
  constructor() {
    this.users = new Map();
    this.workspaces = new Map();
    this.workspaceMembers = new Map();
    this.projects = new Map();
    this.pipeSpecs = new Map();
    this.requiredCuts = new Map();
    this.optimizationResults = new Map();
    this.subscriptions = new Map();
    this.subscriptionPlans = new Map();
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
    
    // Create default subscription plans
    this.createSubscriptionPlan({
      planId: "free",
      name: "Free",
      price: 0,
      interval: "monthly",
      description: "Basic free plan with limited features",
      features: ["Basic pipe cutting optimization", "Limited to 1 project", "Limited to 1 optimization"],
      projectLimit: 1,
      optimizationLimit: 1,
      pdfExportEnabled: false,
      active: true
    });
    
    this.createSubscriptionPlan({
      planId: "premium",
      name: "Premium",
      price: 29.99,
      interval: "monthly",
      description: "Premium plan with unlimited features",
      features: ["Advanced pipe cutting optimization", "Unlimited projects", "Unlimited optimizations", "PDF export"],
      projectLimit: -1, // -1 means unlimited
      optimizationLimit: -1, // -1 means unlimited
      pdfExportEnabled: true,
      active: true
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: now,
      role: "user",
      stripeCustomerId: null,
      stripeSubscriptionId: null
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUserStripeInfo(userId: number, stripeInfo: { customerId: string; subscriptionId: string }): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    const updatedUser: User = {
      ...user,
      stripeCustomerId: stripeInfo.customerId,
      stripeSubscriptionId: stripeInfo.subscriptionId
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  // Workspace operations
  async createWorkspace(workspace: InsertWorkspace): Promise<Workspace> {
    const id = this.workspaceIdCounter++;
    const now = new Date();
    const newWorkspace: Workspace = {
      ...workspace,
      id,
      createdAt: now
    };
    this.workspaces.set(id, newWorkspace);
    
    // Automatically add creator as owner
    await this.addWorkspaceMember({
      workspaceId: id,
      userId: workspace.ownerId,
      role: "owner"
    });
    
    return newWorkspace;
  }
  
  async getWorkspace(id: number): Promise<Workspace | undefined> {
    return this.workspaces.get(id);
  }
  
  async getUserWorkspaces(userId: number): Promise<Workspace[]> {
    // Get all memberships for this user
    const memberships = Array.from(this.workspaceMembers.values()).filter(
      (member) => member.userId === userId
    );
    
    // Get all workspaces for these memberships
    return memberships.map(
      (membership) => this.workspaces.get(membership.workspaceId)!
    ).filter(Boolean);
  }
  
  async updateWorkspace(id: number, data: Partial<Workspace>): Promise<Workspace> {
    const workspace = await this.getWorkspace(id);
    if (!workspace) {
      throw new Error(`Workspace with ID ${id} not found`);
    }
    
    const updatedWorkspace: Workspace = {
      ...workspace,
      ...data
    };
    
    this.workspaces.set(id, updatedWorkspace);
    return updatedWorkspace;
  }
  
  async deleteWorkspace(id: number): Promise<void> {
    this.workspaces.delete(id);
    
    // Clean up related records
    const memberships = Array.from(this.workspaceMembers.values())
      .filter(m => m.workspaceId === id);
    
    for (const member of memberships) {
      this.workspaceMembers.delete(member.id);
    }
    
    const workspaceProjects = Array.from(this.projects.values())
      .filter(p => p.workspaceId === id);
    
    for (const project of workspaceProjects) {
      this.projects.delete(project.id);
      
      // Clean up project-related records
      const projectPipeSpecs = Array.from(this.pipeSpecs.values())
        .filter(ps => ps.projectId === project.id);
      
      for (const pipeSpec of projectPipeSpecs) {
        this.pipeSpecs.delete(pipeSpec.id);
      }
      
      const projectRequiredCuts = Array.from(this.requiredCuts.values())
        .filter(rc => rc.projectId === project.id);
      
      for (const requiredCut of projectRequiredCuts) {
        this.requiredCuts.delete(requiredCut.id);
      }
      
      const projectOptimizationResults = Array.from(this.optimizationResults.values())
        .filter(or => or.projectId === project.id);
      
      for (const optimizationResult of projectOptimizationResults) {
        this.optimizationResults.delete(optimizationResult.id);
      }
    }
  }
  
  // Workspace membership operations
  async addWorkspaceMember(member: InsertWorkspaceMember): Promise<WorkspaceMember> {
    const id = this.workspaceMemberIdCounter++;
    const newMember: WorkspaceMember = {
      ...member,
      id
    };
    this.workspaceMembers.set(id, newMember);
    return newMember;
  }
  
  async getWorkspaceMembers(workspaceId: number): Promise<(WorkspaceMember & { user: User })[]> {
    const members = Array.from(this.workspaceMembers.values())
      .filter(member => member.workspaceId === workspaceId);
    
    return members.map(member => {
      const user = this.users.get(member.userId);
      if (!user) {
        throw new Error(`User with ID ${member.userId} not found`);
      }
      return {
        ...member,
        user
      };
    });
  }
  
  async updateWorkspaceMember(id: number, data: Partial<WorkspaceMember>): Promise<WorkspaceMember> {
    const member = this.workspaceMembers.get(id);
    if (!member) {
      throw new Error(`Workspace member with ID ${id} not found`);
    }
    
    const updatedMember: WorkspaceMember = {
      ...member,
      ...data
    };
    
    this.workspaceMembers.set(id, updatedMember);
    return updatedMember;
  }
  
  async removeWorkspaceMember(id: number): Promise<void> {
    this.workspaceMembers.delete(id);
  }
  
  // Project operations
  async createProject(project: InsertProject): Promise<Project> {
    const id = this.projectIdCounter++;
    const now = new Date();
    const newProject: Project = {
      ...project,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.projects.set(id, newProject);
    return newProject;
  }
  
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }
  
  async getWorkspaceProjects(workspaceId: number): Promise<Project[]> {
    return Array.from(this.projects.values())
      .filter(project => project.workspaceId === workspaceId);
  }
  
  async updateProject(id: number, data: Partial<Project>): Promise<Project> {
    const project = await this.getProject(id);
    if (!project) {
      throw new Error(`Project with ID ${id} not found`);
    }
    
    const updatedProject: Project = {
      ...project,
      ...data,
      updatedAt: new Date()
    };
    
    this.projects.set(id, updatedProject);
    return updatedProject;
  }
  
  async deleteProject(id: number): Promise<void> {
    this.projects.delete(id);
    
    // Clean up related records
    const projectPipeSpecs = Array.from(this.pipeSpecs.values())
      .filter(ps => ps.projectId === id);
    
    for (const pipeSpec of projectPipeSpecs) {
      this.pipeSpecs.delete(pipeSpec.id);
    }
    
    const projectRequiredCuts = Array.from(this.requiredCuts.values())
      .filter(rc => rc.projectId === id);
    
    for (const requiredCut of projectRequiredCuts) {
      this.requiredCuts.delete(requiredCut.id);
    }
    
    const projectOptimizationResults = Array.from(this.optimizationResults.values())
      .filter(or => or.projectId === id);
    
    for (const optimizationResult of projectOptimizationResults) {
      this.optimizationResults.delete(optimizationResult.id);
    }
  }
  
  // Pipe specs operations
  async createPipeSpec(pipeSpec: InsertPipeSpec): Promise<PipeSpec> {
    const id = this.pipeSpecIdCounter++;
    const now = new Date();
    const newPipeSpec: PipeSpec = {
      ...pipeSpec,
      id,
      createdAt: now
    };
    this.pipeSpecs.set(id, newPipeSpec);
    return newPipeSpec;
  }
  
  async getProjectPipeSpecs(projectId: number): Promise<PipeSpec[]> {
    return Array.from(this.pipeSpecs.values())
      .filter(pipeSpec => pipeSpec.projectId === projectId);
  }
  
  async updatePipeSpec(id: number, data: Partial<PipeSpec>): Promise<PipeSpec> {
    const pipeSpec = this.pipeSpecs.get(id);
    if (!pipeSpec) {
      throw new Error(`Pipe specification with ID ${id} not found`);
    }
    
    const updatedPipeSpec: PipeSpec = {
      ...pipeSpec,
      ...data
    };
    
    this.pipeSpecs.set(id, updatedPipeSpec);
    return updatedPipeSpec;
  }
  
  async deletePipeSpec(id: number): Promise<void> {
    this.pipeSpecs.delete(id);
  }
  
  // Required cuts operations
  async createRequiredCut(requiredCut: InsertRequiredCut): Promise<RequiredCut> {
    const id = this.requiredCutIdCounter++;
    const now = new Date();
    const newRequiredCut: RequiredCut = {
      ...requiredCut,
      id,
      createdAt: now
    };
    this.requiredCuts.set(id, newRequiredCut);
    return newRequiredCut;
  }
  
  async getProjectRequiredCuts(projectId: number): Promise<RequiredCut[]> {
    return Array.from(this.requiredCuts.values())
      .filter(requiredCut => requiredCut.projectId === projectId);
  }
  
  async updateRequiredCut(id: number, data: Partial<RequiredCut>): Promise<RequiredCut> {
    const requiredCut = this.requiredCuts.get(id);
    if (!requiredCut) {
      throw new Error(`Required cut with ID ${id} not found`);
    }
    
    const updatedRequiredCut: RequiredCut = {
      ...requiredCut,
      ...data
    };
    
    this.requiredCuts.set(id, updatedRequiredCut);
    return updatedRequiredCut;
  }
  
  async deleteRequiredCut(id: number): Promise<void> {
    this.requiredCuts.delete(id);
  }
  
  // Optimization results operations
  async createOptimizationResult(result: InsertOptimizationResult): Promise<OptimizationResult> {
    const id = this.optimizationResultIdCounter++;
    const now = new Date();
    const newOptimizationResult: OptimizationResult = {
      ...result,
      id,
      createdAt: now
    };
    this.optimizationResults.set(id, newOptimizationResult);
    return newOptimizationResult;
  }
  
  async getProjectOptimizationResults(projectId: number): Promise<OptimizationResult[]> {
    return Array.from(this.optimizationResults.values())
      .filter(result => result.projectId === projectId);
  }
  
  async getOptimizationResult(id: number): Promise<OptimizationResult | undefined> {
    return this.optimizationResults.get(id);
  }
  
  async deleteOptimizationResult(id: number): Promise<void> {
    this.optimizationResults.delete(id);
  }
  
  // Subscription operations
  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const id = this.subscriptionIdCounter++;
    const now = new Date();
    const newSubscription: Subscription = {
      ...subscription,
      id,
      createdAt: now,
      projectsCreated: 0,
      optimizationsRun: 0
    };
    this.subscriptions.set(id, newSubscription);
    return newSubscription;
  }
  
  async getUserSubscription(userId: number): Promise<Subscription | undefined> {
    return Array.from(this.subscriptions.values())
      .find(subscription => subscription.userId === userId);
  }
  
  async updateSubscription(id: number, data: Partial<Subscription>): Promise<Subscription> {
    const subscription = this.subscriptions.get(id);
    if (!subscription) {
      throw new Error(`Subscription with ID ${id} not found`);
    }
    
    const updatedSubscription: Subscription = {
      ...subscription,
      ...data
    };
    
    this.subscriptions.set(id, updatedSubscription);
    return updatedSubscription;
  }

  async incrementProjectCount(userId: number): Promise<Subscription> {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription) {
      throw new Error(`Subscription for user with ID ${userId} not found`);
    }
    
    return this.updateSubscription(subscription.id, {
      projectsCreated: subscription.projectsCreated + 1
    });
  }
  
  async incrementOptimizationCount(userId: number): Promise<Subscription> {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription) {
      throw new Error(`Subscription for user with ID ${userId} not found`);
    }
    
    return this.updateSubscription(subscription.id, {
      optimizationsRun: subscription.optimizationsRun + 1
    });
  }
  
  // Subscription plan operations
  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const id = this.subscriptionPlanIdCounter++;
    const now = new Date();
    const newSubscriptionPlan: SubscriptionPlan = {
      ...plan,
      id,
      createdAt: now
    };
    this.subscriptionPlans.set(id, newSubscriptionPlan);
    return newSubscriptionPlan;
  }
  
  async getSubscriptionPlan(planId: string): Promise<SubscriptionPlan | undefined> {
    return Array.from(this.subscriptionPlans.values())
      .find(plan => plan.planId === planId);
  }
  
  async getSubscriptionPlanById(id: number): Promise<SubscriptionPlan | undefined> {
    return this.subscriptionPlans.get(id);
  }
  
  async getAllSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return Array.from(this.subscriptionPlans.values());
  }
  
  async getActiveSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return Array.from(this.subscriptionPlans.values())
      .filter(plan => plan.active);
  }
  
  async updateSubscriptionPlan(id: number, data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    const plan = this.subscriptionPlans.get(id);
    if (!plan) {
      throw new Error(`Subscription plan with ID ${id} not found`);
    }
    
    const updatedPlan: SubscriptionPlan = {
      ...plan,
      ...data
    };
    
    this.subscriptionPlans.set(id, updatedPlan);
    return updatedPlan;
  }
  
  async deleteSubscriptionPlan(id: number): Promise<void> {
    this.subscriptionPlans.delete(id);
  }

  async getSubscriptionPlanByPlanId(planId: string): Promise<SubscriptionPlan | undefined> {
    return Array.from(this.subscriptionPlans.values())
      .find(plan => plan.planId === planId);
  }

  // Material Group Map and Counter
  private materialGroups: Map<number, MaterialGroup> = new Map();
  private materialGroupIdCounter: number = 1;

  // Material Group operations
  async createMaterialGroup(group: InsertMaterialGroup): Promise<MaterialGroup> {
    const id = this.materialGroupIdCounter++;
    const now = new Date();
    const newGroup: MaterialGroup = {
      ...group,
      id,
      createdAt: now
    };
    this.materialGroups.set(id, newGroup);
    return newGroup;
  }

  async getMaterialGroup(id: number): Promise<MaterialGroup | undefined> {
    return this.materialGroups.get(id);
  }

  async getWorkspaceMaterialGroups(workspaceId: number): Promise<MaterialGroup[]> {
    return Array.from(this.materialGroups.values())
      .filter(group => group.workspaceId === workspaceId);
  }

  async updateMaterialGroup(id: number, data: Partial<MaterialGroup>): Promise<MaterialGroup> {
    const group = this.materialGroups.get(id);
    if (!group) {
      throw new Error(`Material group with ID ${id} not found`);
    }
    
    const updatedGroup: MaterialGroup = {
      ...group,
      ...data
    };
    
    this.materialGroups.set(id, updatedGroup);
    return updatedGroup;
  }

  async deleteMaterialGroup(id: number): Promise<void> {
    this.materialGroups.delete(id);
  }

  // Material Warehouse Map and Counter
  private materialWarehouse: Map<number, MaterialWarehouseItem> = new Map();
  private materialWarehouseIdCounter: number = 1;

  // Material Warehouse operations
  async createMaterialWarehouseItem(item: InsertMaterialWarehouseItem): Promise<MaterialWarehouseItem> {
    const id = this.materialWarehouseIdCounter++;
    const now = new Date();
    const newItem: MaterialWarehouseItem = {
      ...item,
      id,
      createdAt: now
    };
    this.materialWarehouse.set(id, newItem);
    return newItem;
  }

  async getMaterialWarehouseItem(id: number): Promise<MaterialWarehouseItem | undefined> {
    return this.materialWarehouse.get(id);
  }

  async getWorkspaceMaterialWarehouse(workspaceId: number): Promise<MaterialWarehouseItem[]> {
    return Array.from(this.materialWarehouse.values())
      .filter(item => item.workspaceId === workspaceId);
  }

  async updateMaterialWarehouseItem(id: number, data: Partial<MaterialWarehouseItem>): Promise<MaterialWarehouseItem> {
    const item = this.materialWarehouse.get(id);
    if (!item) {
      throw new Error(`Material warehouse item with ID ${id} not found`);
    }
    
    const updatedItem: MaterialWarehouseItem = {
      ...item,
      ...data
    };
    
    this.materialWarehouse.set(id, updatedItem);
    return updatedItem;
  }

  async deleteMaterialWarehouseItem(id: number): Promise<void> {
    this.materialWarehouse.delete(id);
  }

  // Custom Text Fields Map and Counter
  private customTextFields: Map<number, CustomTextField> = new Map();
  private customTextFieldIdCounter: number = 1;

  // Custom Text Fields operations
  async createCustomTextField(field: InsertCustomTextField): Promise<CustomTextField> {
    const id = this.customTextFieldIdCounter++;
    const now = new Date();
    const newField: CustomTextField = {
      ...field,
      id,
      createdAt: now
    };
    this.customTextFields.set(id, newField);
    return newField;
  }

  async getCustomTextField(id: number): Promise<CustomTextField | undefined> {
    return this.customTextFields.get(id);
  }

  async getWorkspaceCustomTextFields(workspaceId: number): Promise<CustomTextField[]> {
    return Array.from(this.customTextFields.values())
      .filter(field => field.workspaceId === workspaceId);
  }

  async updateCustomTextField(id: number, data: Partial<CustomTextField>): Promise<CustomTextField> {
    const field = this.customTextFields.get(id);
    if (!field) {
      throw new Error(`Custom text field with ID ${id} not found`);
    }
    
    const updatedField: CustomTextField = {
      ...field,
      ...data
    };
    
    this.customTextFields.set(id, updatedField);
    return updatedField;
  }

  async deleteCustomTextField(id: number): Promise<void> {
    this.customTextFields.delete(id);
  }

  // Cutting Plans Map and Counter
  private cuttingPlans: Map<number, CuttingPlan> = new Map();
  private cuttingPlanIdCounter: number = 1;

  // Cutting Plan operations
  async createCuttingPlan(plan: InsertCuttingPlan): Promise<CuttingPlan> {
    const id = this.cuttingPlanIdCounter++;
    const now = new Date();
    const newPlan: CuttingPlan = {
      ...plan,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.cuttingPlans.set(id, newPlan);
    return newPlan;
  }

  async getCuttingPlan(id: number): Promise<CuttingPlan | undefined> {
    return this.cuttingPlans.get(id);
  }

  async getWorkspaceCuttingPlans(workspaceId: number): Promise<CuttingPlan[]> {
    return Array.from(this.cuttingPlans.values())
      .filter(plan => plan.workspaceId === workspaceId);
  }

  async updateCuttingPlan(id: number, data: Partial<CuttingPlan>): Promise<CuttingPlan> {
    const plan = this.cuttingPlans.get(id);
    if (!plan) {
      throw new Error(`Cutting plan with ID ${id} not found`);
    }
    
    const updatedPlan: CuttingPlan = {
      ...plan,
      ...data,
      updatedAt: new Date()
    };
    
    this.cuttingPlans.set(id, updatedPlan);
    return updatedPlan;
  }

  async deleteCuttingPlan(id: number): Promise<void> {
    this.cuttingPlans.delete(id);
  }

  // User Settings Map
  private userSettings: Map<number, UserSettings> = new Map();

  // User Settings operations
  async getUserSettings(userId: number): Promise<UserSettings | undefined> {
    return this.userSettings.get(userId);
  }

  async createOrUpdateUserSettings(settings: InsertUserSettings): Promise<UserSettings> {
    const now = new Date();
    const userSettings: UserSettings = {
      ...settings,
      updatedAt: now
    };
    
    this.userSettings.set(settings.userId, userSettings);
    return userSettings;
  }
}

// Import the PostgreSQL DatabaseStorage class
import { DatabaseStorage } from './database-storage';

// Use DatabaseStorage for PostgreSQL
export const storage = new DatabaseStorage();
