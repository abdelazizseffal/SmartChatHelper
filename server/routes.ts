import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import Stripe from "stripe";
import { z } from "zod";
import { insertWorkspaceSchema, insertProjectSchema, insertPipeSpecSchema, insertRequiredCutSchema } from "@shared/schema";

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

// Auth middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

// Admin middleware to check if user is an admin
const isAdmin = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated() && req.user.role === "admin") {
    return next();
  }
  res.status(403).json({ message: "Forbidden" });
};

// Workspace access middleware
const hasWorkspaceAccess = async (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const workspaceId = parseInt(req.params.workspaceId);
  if (isNaN(workspaceId)) {
    return res.status(400).json({ message: "Invalid workspace ID" });
  }
  
  const workspace = await storage.getWorkspace(workspaceId);
  if (!workspace) {
    return res.status(404).json({ message: "Workspace not found" });
  }
  
  // Check if user is admin (bypass check)
  if (req.user.role === "admin") {
    return next();
  }
  
  // Get workspace members to check if user has access
  const members = await storage.getWorkspaceMembers(workspaceId);
  const userMembership = members.find(member => member.userId === req.user.id);
  
  if (!userMembership) {
    return res.status(403).json({ message: "You don't have access to this workspace" });
  }
  
  // Add user's role in this workspace to the request for later use
  req.workspaceRole = userMembership.role;
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  // Workspaces
  app.post("/api/workspaces", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertWorkspaceSchema.parse({
        ...req.body,
        ownerId: req.user.id
      });
      
      const workspace = await storage.createWorkspace(validatedData);
      res.status(201).json(workspace);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });
  
  app.get("/api/workspaces", isAuthenticated, async (req, res) => {
    try {
      const workspaces = await storage.getUserWorkspaces(req.user.id);
      res.json(workspaces);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/workspaces/:workspaceId", hasWorkspaceAccess, async (req, res) => {
    const workspaceId = parseInt(req.params.workspaceId);
    try {
      const workspace = await storage.getWorkspace(workspaceId);
      res.json(workspace);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.put("/api/workspaces/:workspaceId", hasWorkspaceAccess, async (req, res) => {
    // Only owners or admins can update workspace
    if (req.workspaceRole !== "owner" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only workspace owners can update workspace settings" });
    }
    
    const workspaceId = parseInt(req.params.workspaceId);
    try {
      const updatedWorkspace = await storage.updateWorkspace(workspaceId, req.body);
      res.json(updatedWorkspace);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.delete("/api/workspaces/:workspaceId", hasWorkspaceAccess, async (req, res) => {
    // Only owners or admins can delete workspaces
    if (req.workspaceRole !== "owner" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only workspace owners can delete workspaces" });
    }
    
    const workspaceId = parseInt(req.params.workspaceId);
    try {
      await storage.deleteWorkspace(workspaceId);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Workspace Members
  app.get("/api/workspaces/:workspaceId/members", hasWorkspaceAccess, async (req, res) => {
    const workspaceId = parseInt(req.params.workspaceId);
    try {
      const members = await storage.getWorkspaceMembers(workspaceId);
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/workspaces/:workspaceId/members", hasWorkspaceAccess, async (req, res) => {
    // Only owners or admins can add members
    if (req.workspaceRole !== "owner" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only workspace owners can add members" });
    }
    
    const workspaceId = parseInt(req.params.workspaceId);
    try {
      // Check if user exists
      const user = await storage.getUserByEmail(req.body.email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user is already a member
      const members = await storage.getWorkspaceMembers(workspaceId);
      const existingMember = members.find(m => m.userId === user.id);
      if (existingMember) {
        return res.status(400).json({ message: "User is already a member of this workspace" });
      }
      
      const newMember = await storage.addWorkspaceMember({
        workspaceId,
        userId: user.id,
        role: req.body.role || "member"
      });
      
      res.status(201).json(newMember);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Projects
  app.post("/api/workspaces/:workspaceId/projects", hasWorkspaceAccess, async (req, res) => {
    const workspaceId = parseInt(req.params.workspaceId);
    try {
      const validatedData = insertProjectSchema.parse({
        ...req.body,
        workspaceId,
        createdById: req.user.id
      });
      
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });
  
  app.get("/api/workspaces/:workspaceId/projects", hasWorkspaceAccess, async (req, res) => {
    const workspaceId = parseInt(req.params.workspaceId);
    try {
      const projects = await storage.getWorkspaceProjects(workspaceId);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Pipe Specifications
  app.post("/api/projects/:projectId/pipe-specs", isAuthenticated, async (req, res) => {
    const projectId = parseInt(req.params.projectId);
    try {
      // Verify project exists and user has access
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check workspace access
      const workspace = await storage.getWorkspace(project.workspaceId);
      if (!workspace) {
        return res.status(404).json({ message: "Workspace not found" });
      }
      
      const members = await storage.getWorkspaceMembers(workspace.id);
      const userMembership = members.find(member => member.userId === req.user.id);
      
      if (!userMembership && req.user.role !== "admin") {
        return res.status(403).json({ message: "You don't have access to this project" });
      }
      
      const validatedData = insertPipeSpecSchema.parse({
        ...req.body,
        projectId,
        createdById: req.user.id
      });
      
      const pipeSpec = await storage.createPipeSpec(validatedData);
      res.status(201).json(pipeSpec);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });
  
  app.get("/api/projects/:projectId/pipe-specs", isAuthenticated, async (req, res) => {
    const projectId = parseInt(req.params.projectId);
    try {
      // Verify project exists and user has access
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Verify user has access to the project's workspace
      const workspace = await storage.getWorkspace(project.workspaceId);
      if (!workspace) {
        return res.status(404).json({ message: "Workspace not found" });
      }
      
      const members = await storage.getWorkspaceMembers(workspace.id);
      const userMembership = members.find(member => member.userId === req.user.id);
      
      if (!userMembership && req.user.role !== "admin") {
        return res.status(403).json({ message: "You don't have access to this project" });
      }
      
      const pipeSpecs = await storage.getProjectPipeSpecs(projectId);
      res.json(pipeSpecs);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Required Cuts
  app.post("/api/projects/:projectId/required-cuts", isAuthenticated, async (req, res) => {
    const projectId = parseInt(req.params.projectId);
    try {
      // Verify project exists and user has access
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Verify user has access to the project's workspace
      const workspace = await storage.getWorkspace(project.workspaceId);
      if (!workspace) {
        return res.status(404).json({ message: "Workspace not found" });
      }
      
      const members = await storage.getWorkspaceMembers(workspace.id);
      const userMembership = members.find(member => member.userId === req.user.id);
      
      if (!userMembership && req.user.role !== "admin") {
        return res.status(403).json({ message: "You don't have access to this project" });
      }
      
      const validatedData = insertRequiredCutSchema.parse({
        ...req.body,
        projectId,
        createdById: req.user.id
      });
      
      const requiredCut = await storage.createRequiredCut(validatedData);
      res.status(201).json(requiredCut);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });
  
  app.get("/api/projects/:projectId/required-cuts", isAuthenticated, async (req, res) => {
    const projectId = parseInt(req.params.projectId);
    try {
      // Verify project exists and user has access
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Verify user has access to the project's workspace
      const workspace = await storage.getWorkspace(project.workspaceId);
      if (!workspace) {
        return res.status(404).json({ message: "Workspace not found" });
      }
      
      const members = await storage.getWorkspaceMembers(workspace.id);
      const userMembership = members.find(member => member.userId === req.user.id);
      
      if (!userMembership && req.user.role !== "admin") {
        return res.status(403).json({ message: "You don't have access to this project" });
      }
      
      const requiredCuts = await storage.getProjectRequiredCuts(projectId);
      res.json(requiredCuts);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Optimization
  app.post("/api/projects/:projectId/optimize", isAuthenticated, async (req, res) => {
    const projectId = parseInt(req.params.projectId);
    try {
      // Verify project exists and user has access
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Verify user has access to the project's workspace
      const workspace = await storage.getWorkspace(project.workspaceId);
      if (!workspace) {
        return res.status(404).json({ message: "Workspace not found" });
      }
      
      const members = await storage.getWorkspaceMembers(workspace.id);
      const userMembership = members.find(member => member.userId === req.user.id);
      
      if (!userMembership && req.user.role !== "admin") {
        return res.status(403).json({ message: "You don't have access to this project" });
      }
      
      // Get pipe specs and required cuts for this project
      const pipeSpecs = await storage.getProjectPipeSpecs(projectId);
      const requiredCuts = await storage.getProjectRequiredCuts(projectId);
      
      if (pipeSpecs.length === 0) {
        return res.status(400).json({ message: "No pipe specifications found for this project" });
      }
      
      if (requiredCuts.length === 0) {
        return res.status(400).json({ message: "No required cuts found for this project" });
      }
      
      // Run optimization algorithm
      // This is a very simplified example - a real implementation would have a more complex algorithm
      
      // Extract optimization parameters from request
      const { kerfWidth, minWasteThreshold, prioritizeWasteReduction } = req.body.parameters || {};
      
      // Mock optimization results (in production, this would be calculated by the algorithm)
      const mockResults = {
        pipesUsed: 4,
        materialEfficiency: 92.4,
        totalWaste: 1824,
        cutOperations: 24,
        results: [
          // Simplified example of cutting pattern
          {
            pipeIndex: 0,
            cuts: [
              { length: 1200, startPos: 0, endPos: 1200 },
              { length: 1200, startPos: 1202, endPos: 2402 },
              { length: 1200, startPos: 2404, endPos: 3604 },
              { length: 1200, startPos: 3606, endPos: 4806 },
              { length: 850, startPos: 4808, endPos: 5658 }
            ],
            waste: 350
          },
          {
            pipeIndex: 1,
            cuts: [
              { length: 850, startPos: 0, endPos: 850 },
              { length: 850, startPos: 852, endPos: 1702 },
              { length: 850, startPos: 1704, endPos: 2554 },
              { length: 2400, startPos: 2556, endPos: 4956 }
            ],
            waste: 1050
          },
          {
            pipeIndex: 2,
            cuts: [
              { length: 2400, startPos: 0, endPos: 2400 },
              { length: 2400, startPos: 2402, endPos: 4802 },
              { length: 1200, startPos: 4804, endPos: 6004 }
            ],
            waste: 0
          },
          {
            pipeIndex: 3,
            cuts: [
              { length: 1200, startPos: 0, endPos: 1200 },
              { length: 1200, startPos: 1202, endPos: 2402 },
              { length: 1200, startPos: 2404, endPos: 3604 },
              { length: 1200, startPos: 3606, endPos: 4806 },
              { length: 850, startPos: 4808, endPos: 5658 }
            ],
            waste: 350
          }
        ],
        parameters: {
          kerfWidth: kerfWidth || 2.0,
          minWasteThreshold: minWasteThreshold || 100,
          prioritizeWasteReduction: prioritizeWasteReduction || 70
        }
      };
      
      // Save optimization result
      const optimizationResult = await storage.createOptimizationResult({
        projectId,
        createdById: req.user.id,
        pipesUsed: mockResults.pipesUsed,
        materialEfficiency: mockResults.materialEfficiency,
        totalWaste: mockResults.totalWaste,
        cutOperations: mockResults.cutOperations,
        results: mockResults.results,
        parameters: mockResults.parameters
      });
      
      res.status(201).json(optimizationResult);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/projects/:projectId/optimization-results", isAuthenticated, async (req, res) => {
    const projectId = parseInt(req.params.projectId);
    try {
      // Verify project exists and user has access
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Verify user has access to the project's workspace
      const workspace = await storage.getWorkspace(project.workspaceId);
      if (!workspace) {
        return res.status(404).json({ message: "Workspace not found" });
      }
      
      const members = await storage.getWorkspaceMembers(workspace.id);
      const userMembership = members.find(member => member.userId === req.user.id);
      
      if (!userMembership && req.user.role !== "admin") {
        return res.status(403).json({ message: "You don't have access to this project" });
      }
      
      const results = await storage.getProjectOptimizationResults(projectId);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Stripe payment endpoints
  app.post("/api/create-payment-intent", isAuthenticated, async (req, res) => {
    try {
      const { amount } = req.body;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ message: `Error creating payment intent: ${error.message}` });
    }
  });

  app.post('/api/create-subscription', isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      let customer;
      
      // Create or retrieve customer
      if (user.stripeCustomerId) {
        customer = await stripe.customers.retrieve(user.stripeCustomerId);
      } else {
        customer = await stripe.customers.create({
          email: user.email,
          name: user.username,
        });
        
        // Save customer ID to user
        await storage.updateUserStripeInfo(user.id, {
          customerId: customer.id,
          subscriptionId: user.stripeSubscriptionId || ''
        });
      }
      
      // Create subscription
      if (!process.env.STRIPE_PRICE_ID) {
        throw new Error('Missing required Stripe price ID');
      }
      
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price: process.env.STRIPE_PRICE_ID,
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });
      
      // Save subscription ID to user
      await storage.updateUserStripeInfo(user.id, {
        customerId: customer.id,
        subscriptionId: subscription.id
      });
      
      // Create subscription record
      await storage.createSubscription({
        userId: user.id,
        planId: subscription.items.data[0].price.id,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
      });
      
      // @ts-ignore - Stripe types are not catching the expanded fields correctly
      const clientSecret = subscription.latest_invoice?.payment_intent?.client_secret;
      
      res.json({
        subscriptionId: subscription.id,
        clientSecret
      });
    } catch (error: any) {
      res.status(500).json({ message: `Error creating subscription: ${error.message}` });
    }
  });
  
  // Admin routes
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      // In a real implementation, we would have a method to get all users with pagination
      // For this MVP, we'll return all users from our in-memory storage
      const users = Array.from(new Map(Array.from((storage as any).users.entries()).map(
        ([id, user]: [number, any]) => {
          // Don't expose passwords
          const { password, ...userWithoutPassword } = user;
          return [id, userWithoutPassword];
        }
      )).values());
      
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/admin/workspaces", isAdmin, async (req, res) => {
    try {
      // In a real implementation, we would have a method to get all workspaces with pagination
      const workspaces = Array.from((storage as any).workspaces.values());
      res.json(workspaces);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/admin/subscriptions", isAdmin, async (req, res) => {
    try {
      // In a real implementation, we would have a method to get all subscriptions with pagination
      const subscriptions = Array.from((storage as any).subscriptions.values());
      res.json(subscriptions);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
