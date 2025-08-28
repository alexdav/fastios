import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Create a client profile for a user
export const createClient = mutation({
  args: {
    agentId: v.id("agents"),
    phone: v.optional(v.string()),
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

    // Check if client profile already exists
    const existingClient = await ctx.db
      .query("clients")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (existingClient) {
      throw new Error("Client profile already exists");
    }

    // Verify agent exists
    const agent = await ctx.db.get(args.agentId);
    if (!agent) {
      throw new Error("Agent not found");
    }

    // Create client profile
    const clientId = await ctx.db.insert("clients", {
      userId: user._id,
      agentId: args.agentId,
      phone: args.phone,
      status: "active",
      invitedAt: Date.now(),
      acceptedAt: Date.now(),
    });

    return clientId;
  },
});

// Get client profile by user ID
export const getClientByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("clients")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});

// Get current user's client profile
export const getCurrentClient = query({
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

    const client = await ctx.db
      .query("clients")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!client) {
      return null;
    }

    // Get agent info
    const agent = await ctx.db.get(client.agentId);
    const agentUser = agent ? await ctx.db.get(agent.userId) : null;

    // Return client with user and agent info
    return {
      ...client,
      user,
      agent: agent ? { ...agent, user: agentUser } : null,
    };
  },
});

// Check if user is a client
export const isUserClient = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const client = await ctx.db
      .query("clients")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return !!client;
  },
});

// List all clients for an agent
export const listAgentClients = query({
  handler: async (ctx) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return [];
    }

    const agent = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!agent) {
      return [];
    }

    const clients = await ctx.db
      .query("clients")
      .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
      .collect();

    // Get user info for each client
    const clientsWithUsers = await Promise.all(
      clients.map(async (client) => {
        const clientUser = await ctx.db.get(client.userId);
        return {
          ...client,
          user: clientUser,
        };
      })
    );

    return clientsWithUsers;
  },
});

// Delete client profile
export const deleteClient = mutation({
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

    // Find client profile
    const client = await ctx.db
      .query("clients")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!client) {
      throw new Error("Client profile not found");
    }

    // Delete client profile
    await ctx.db.delete(client._id);

    return { success: true };
  },
});