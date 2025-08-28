import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_clerk_id", ["clerkId"]),

  agents: defineTable({
    userId: v.id("users"),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    licenseNumber: v.optional(v.string()),
    subscriptionStatus: v.string(), // 'trial' | 'active' | 'canceled'
    subscriptionEndsAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"]),

  clients: defineTable({
    userId: v.id("users"),
    agentId: v.id("agents"),
    phone: v.optional(v.string()),
    status: v.string(), // 'invited' | 'active'
    invitedAt: v.number(),
    acceptedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_agent", ["agentId"]),
});
