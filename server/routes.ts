import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import Stripe from "stripe";
import { z } from "zod";
import { insertWorkspaceSchema, insertProjectSchema, insertPipeSpecSchema, insertRequiredCutSchema } from "@shared/schema";
import { runOptimization } from "./optimization";

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
      
      // Get data from the request body instead of the database
      const { pipeSpec, requiredCuts, parameters } = req.body;
      
      if (!pipeSpec) {
        return res.status(400).json({ message: "No pipe specification provided" });
      }
      
      if (!requiredCuts || requiredCuts.length === 0) {
        return res.status(400).json({ message: "No required cuts provided" });
      }
      
      // Set up optimization parameters
      const optimizationParams = {
        kerfWidth: parameters?.kerfWidth || 2.0,
        minWasteThreshold: parameters?.minWasteThreshold || 100,
        prioritizeWasteReduction: parameters?.prioritizeWasteReduction || 70
      };
      
      // Log the received data for debugging
      console.log("Running optimization with parameters:", JSON.stringify(optimizationParams));
      console.log("Pipe spec:", JSON.stringify(pipeSpec));
      console.log("Required cuts:", JSON.stringify(requiredCuts));
      
      // Convert the pipe spec into the expected format and run the optimization
      const formattedPipeSpec = [{
        length: pipeSpec.length,
        diameter: pipeSpec.diameter,
        thickness: pipeSpec.thickness,
        material: pipeSpec.material,
        quantity: pipeSpec.quantity
      }];
      
      // Run the optimization algorithm with the provided data
      const optimizationResults = runOptimization(formattedPipeSpec, requiredCuts, optimizationParams);
      
      // Make sure we convert to a serializable format and back to ensure full object is recorded
      const serializedResults = JSON.parse(JSON.stringify(optimizationResults));
      console.log("Optimization results:", JSON.stringify(serializedResults, null, 2));
      
      // Save optimization result
      const optimizationResult = await storage.createOptimizationResult({
        projectId,
        createdById: req.user.id,
        pipesUsed: optimizationResults.pipesUsed,
        materialEfficiency: optimizationResults.materialEfficiency,
        totalWaste: optimizationResults.totalWaste,
        cutOperations: optimizationResults.cutOperations,
        results: optimizationResults.results,
        parameters: optimizationResults.parameters
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
      const { planId, paymentMethod } = req.body;
      
      // Create or update subscription with basic info
      const subscriptionData = {
        userId: user.id,
        planId: planId || 'pro', // Default to pro plan if none specified
        status: 'active', // Now we're auto-activating the subscription with the custom payment form
        paymentMethod: paymentMethod || 'credit-card', // Track which payment method was used
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      };
      
      // Check if user already has a subscription
      const existingSubscription = await storage.getUserSubscription(user.id);
      let subscription;
      
      if (existingSubscription) {
        // Update existing subscription
        subscription = await storage.updateSubscription(existingSubscription.id, subscriptionData);
      } else {
        // Create new subscription
        subscription = await storage.createSubscription(subscriptionData);
      }
      
      // In a real implementation, here we would:
      // 1. Create customer in payment processor if they don't exist
      // 2. Create payment method with tokenized card data
      // 3. Attach payment method to customer
      // 4. Create subscription or one-time charge
      
      // For PayPal specifically, we would:
      // 1. Create a PayPal order
      // 2. Return the approval URL for redirect
      
      // Log the subscription creation
      console.log(`Subscription created/updated for user ${user.id}: Plan ${planId} via ${paymentMethod}`);
      
      // Return the subscription data for the frontend
      res.status(200).json({
        success: true,
        subscription: {
          id: subscription.id,
          planId: subscription.planId,
          status: subscription.status,
          paymentMethod: subscription.paymentMethod,
          currentPeriodEnd: subscription.currentPeriodEnd
        }
      });
    } catch (error: any) {
      console.error('Subscription creation error:', error);
      res.status(500).json({ message: `Error creating subscription: ${error.message}` });
    }
  });
  
  // Process payment details for custom payment form
  app.post('/api/process-payment', isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      const { 
        paymentMethod, 
        planId, 
        amount,
        // Credit card fields
        cardNumber,
        cardName,
        expiryDate,
        cvv,
        // PayPal fields
        paypalEmail
      } = req.body;
      
      // Validate payment method
      if (!paymentMethod) {
        return res.status(400).json({ message: 'Payment method is required' });
      }
      
      // Process based on payment method
      if (paymentMethod === 'credit-card') {
        // Validate credit card fields
        if (!cardNumber || !cardName || !expiryDate || !cvv) {
          return res.status(400).json({ message: 'All credit card details are required' });
        }
        
        // In a real implementation, we would:
        // 1. Tokenize card details using a PCI-compliant payment processor
        // 2. Create a payment method or charge with the token
        console.log('Processing credit card payment...');
        // Don't log actual card details in production!
        console.log(`Card info: ${cardName}, ${cardNumber.substring(cardNumber.length - 4)}`);
      } 
      else if (paymentMethod === 'paypal') {
        // Validate PayPal fields
        if (!paypalEmail) {
          return res.status(400).json({ message: 'PayPal email is required' });
        }
        
        // In a real implementation, we would:
        // 1. Create a PayPal order
        // 2. Return the approval URL
        console.log('Processing PayPal payment...');
        console.log(`PayPal email: ${paypalEmail}`);
      } 
      else {
        return res.status(400).json({ message: 'Unsupported payment method' });
      }
      
      // Get the user's subscription
      const subscription = await storage.getUserSubscription(user.id);
      if (!subscription) {
        return res.status(404).json({ message: 'No subscription found' });
      }
      
      // Update subscription with payment details
      await storage.updateSubscription(subscription.id, {
        status: 'active',
        paymentMethod: paymentMethod
      });
      
      // Return success response with updated subscription
      res.json({ 
        success: true,
        subscription: await storage.getUserSubscription(user.id)
      });
    } catch (error: any) {
      console.error('Payment processing error:', error);
      res.status(500).json({ message: `Payment processing failed: ${error.message}` });
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
