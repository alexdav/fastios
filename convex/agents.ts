import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Create an agent profile for a user
export const createAgent = mutation({
  args: {
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    licenseNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get the user record
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if agent profile already exists
    const existingAgent = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (existingAgent) {
      throw new Error("Agent profile already exists");
    }

    // Create agent profile
    const agentId = await ctx.db.insert("agents", {
      userId: user._id,
      phone: args.phone,
      company: args.company,
      licenseNumber: args.licenseNumber,
      subscriptionStatus: "trial",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return agentId;
  },
});

// Get agent profile by user ID
export const getAgentByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});

// Get current user's agent profile
export const getCurrentAgent = query({
  handler: async (ctx) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return null;
    }

    const agent = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!agent) {
      return null;
    }

    // Return agent with user info
    return {
      ...agent,
      user,
    };
  },
});

// Update agent profile
export const updateAgentProfile = mutation({
  args: {
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    licenseNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const agent = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!agent) {
      throw new Error("Agent profile not found");
    }

    // Update agent profile
    await ctx.db.patch(agent._id, {
      ...args,
      updatedAt: Date.now(),
    });

    return agent._id;
  },
});

// Check if user is an agent
export const isUserAgent = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return !!agent;
  },
});

// Update subscription status (for testing/admin)
export const updateSubscriptionStatus = mutation({
  args: {
    agentId: v.id("agents"),
    status: v.string(),
    endsAt: v.optional(v.number()),
  },
  handler: async (ctx, { agentId, status, endsAt }) => {
    await ctx.db.patch(agentId, {
      subscriptionStatus: status,
      subscriptionEndsAt: endsAt,
      updatedAt: Date.now(),
    });

    return agentId;
  },
});

// Get first available agent (for demo/testing)
export const getFirstAgent = query({
  handler: async (ctx) => {
    const agent = await ctx.db
      .query("agents")
      .first();
    
    return agent;
  },
});

// Create a demo agent (for testing clients without being an agent)
export const createDemoAgent = mutation({
  handler: async (ctx) => {
    // First check if a demo agent already exists
    const existingDemoAgent = await ctx.db
      .query("agents")
      .filter((q) => q.eq(q.field("company"), "Demo Agency"))
      .first();
    
    if (existingDemoAgent) {
      return existingDemoAgent._id;
    }

    // Create a demo user first
    const demoUserId = await ctx.db.insert("users", {
      clerkId: `demo_agent_${Date.now()}`,
      email: "demo@example.com",
      name: "Demo Agent",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create demo agent profile
    const agentId = await ctx.db.insert("agents", {
      userId: demoUserId,
      phone: "555-DEMO",
      company: "Demo Agency",
      licenseNumber: "DEMO-12345",
      subscriptionStatus: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return agentId;
  },
});

// Delete agent profile
export const deleteAgent = mutation({
  handler: async (ctx) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get the user record
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Find agent profile
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!agent) {
      throw new Error("Agent profile not found");
    }

    // Find and delete all clients associated with this agent
    const clients = await ctx.db
      .query("clients")
      .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
      .collect();

    // Delete all associated client profiles
    for (const client of clients) {
      await ctx.db.delete(client._id);
    }

    // Delete agent profile
    await ctx.db.delete(agent._id);

    return { success: true, deletedClients: clients.length };
  },
});