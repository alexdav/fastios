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

// Add a client as an agent
export const addClientAsAgent = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
  },
  returns: v.id("clients"),
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get the agent user record
    const agentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!agentUser) {
      throw new Error("Agent user not found");
    }

    // Get the agent profile
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", agentUser._id))
      .first();

    if (!agent) {
      throw new Error("Agent profile not found");
    }

    // Check if user with this email already exists
    let clientUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (!clientUser) {
      // Create a new user for the client
      const userId = await ctx.db.insert("users", {
        clerkId: `pending_${args.email}_${Date.now()}`, // Temporary ID until they sign up
        email: args.email,
        name: args.name,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      
      clientUser = await ctx.db.get(userId);
    }

    if (!clientUser) {
      throw new Error("Failed to create client user");
    }

    // Check if this client already exists for this agent
    const existingClient = await ctx.db
      .query("clients")
      .withIndex("by_user", (q) => q.eq("userId", clientUser._id))
      .filter((q) => q.eq(q.field("agentId"), agent._id))
      .first();

    if (existingClient) {
      throw new Error("Client already exists for this agent");
    }

    // Create client profile
    const clientId = await ctx.db.insert("clients", {
      userId: clientUser._id,
      agentId: agent._id,
      phone: args.phone && args.phone.trim() !== "" ? args.phone : undefined,
      status: "invited",
      invitedAt: Date.now(),
    });

    return clientId;
  },
});

// Update client information
export const updateClient = mutation({
  args: {
    clientId: v.id("clients"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get the agent user record
    const agentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!agentUser) {
      throw new Error("Agent user not found");
    }

    // Get the agent profile
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", agentUser._id))
      .first();

    if (!agent) {
      throw new Error("Agent profile not found");
    }

    // Get the client
    const client = await ctx.db.get(args.clientId);
    if (!client) {
      throw new Error("Client not found");
    }

    // Verify this client belongs to this agent
    if (client.agentId !== agent._id) {
      throw new Error("Unauthorized: Client does not belong to this agent");
    }

    // Update client phone if provided
    if (args.phone !== undefined) {
      await ctx.db.patch(args.clientId, {
        phone: args.phone && args.phone.trim() !== "" ? args.phone : undefined,
      });
    }

    // Update user info if provided
    if (args.name !== undefined || args.email !== undefined) {
      const updates: Record<string, string | number> = { updatedAt: Date.now() };
      if (args.name !== undefined) updates.name = args.name;
      if (args.email !== undefined) updates.email = args.email;
      
      await ctx.db.patch(client.userId, updates);
    }

    return { success: true };
  },
});

// Remove a client as an agent
export const removeClient = mutation({
  args: {
    clientId: v.id("clients"),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get the agent user record
    const agentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!agentUser) {
      throw new Error("Agent user not found");
    }

    // Get the agent profile
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", agentUser._id))
      .first();

    if (!agent) {
      throw new Error("Agent profile not found");
    }

    // Get the client
    const client = await ctx.db.get(args.clientId);
    if (!client) {
      throw new Error("Client not found");
    }

    // Verify this client belongs to this agent
    if (client.agentId !== agent._id) {
      throw new Error("Unauthorized: Client does not belong to this agent");
    }

    // Check if client is associated with any deals
    const dealClients = await ctx.db
      .query("dealClients")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    if (dealClients.length > 0) {
      throw new Error("Cannot remove client: Client is associated with deals");
    }

    // Delete the client
    await ctx.db.delete(args.clientId);

    return { success: true };
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