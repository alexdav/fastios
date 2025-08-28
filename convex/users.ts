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
      // Create new user - default to agent role for testing
      // In production, you might want to determine this differently
      const newUserId = await ctx.db.insert("users", {
        clerkId: userId,
        email,
        name,
        role: "agent", // Default to agent for testing - change as needed
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return newUserId;
    }
  },
});

// Mutation to change user role for testing purposes
export const setUserRole = mutation({
  args: { 
    role: v.union(v.literal("agent"), v.literal("client"))
  },
  handler: async (ctx, { role }) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const userId = identity.subject;
    
    // Find the user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", userId))
      .first();
    
    if (!user) {
      throw new Error("User not found");
    }
    
    // Update the role
    await ctx.db.patch(user._id, {
      role,
      updatedAt: Date.now(),
    });
    
    return user._id;
  },
});