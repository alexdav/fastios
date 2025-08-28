import { query, mutation } from "./_generated/server";
import { auth } from "./auth";
import { v } from "convex/values";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return null;
    }
    
    // Get or create user in database
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", userId))
      .first();
    
    return user;
  },
});

export const createOrUpdateUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const userId = identity.subject;
    const email = identity.email;
    const name = identity.name;
    
    // Check if user exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", userId))
      .first();
    
    if (existingUser) {
      // Update user
      await ctx.db.patch(existingUser._id, {
        email,
        name,
        updatedAt: Date.now(),
      });
      return existingUser._id;
    } else {
      // Create new user
      const newUserId = await ctx.db.insert("users", {
        clerkId: userId,
        email,
        name,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return newUserId;
    }
  },
});

// Get user role based on agents/clients tables
export const getUserRole = query({
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

    // Check if user is an agent
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (agent) {
      return "agent";
    }

    // Check if user is a client
    const client = await ctx.db
      .query("clients")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (client) {
      return "client";
    }

    // User has no role yet
    return null;
  },
});

// Get user with role included
export const getCurrentUserWithRole = query({
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

    // Check if user is an agent
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (agent) {
      return { ...user, role: "agent" as const };
    }

    // Check if user is a client
    const client = await ctx.db
      .query("clients")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (client) {
      return { ...user, role: "client" as const };
    }

    // User has no role yet
    return { ...user, role: null };
  },
});