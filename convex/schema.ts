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

  deals: defineTable({
    agentId: v.id("agents"),
    title: v.string(),
    description: v.optional(v.string()),
    propertyAddress: v.optional(v.string()),
    propertyType: v.optional(v.string()), // 'single_family' | 'condo' | 'townhouse' | 'multi_family' | 'land' | 'commercial'
    listPrice: v.optional(v.number()),
    offerPrice: v.optional(v.number()),
    status: v.string(), // 'draft' | 'active' | 'pending' | 'closed' | 'cancelled'
    stage: v.string(), // 'lead' | 'showing' | 'offer' | 'negotiation' | 'contract' | 'inspection' | 'closing' | 'closed'
    targetCloseDate: v.optional(v.number()),
    actualCloseDate: v.optional(v.number()),
    currentRevision: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.id("users"),
    isDeleted: v.optional(v.boolean()),
  })
    .index("by_agent", ["agentId"])
    .index("by_status", ["status"])
    .index("by_agent_status", ["agentId", "status"]),

  dealRevisions: defineTable({
    dealId: v.id("deals"),
    revisionNumber: v.number(),
    modifiedBy: v.id("users"),
    modifiedAt: v.number(),
    changeType: v.string(), // 'created' | 'updated' | 'stage_change' | 'status_change' | 'client_change' | 'document_change' | 'deleted'
    changes: v.optional(v.string()), // JSON string of what changed
    snapshot: v.string(), // JSON string of full deal state at this revision
    message: v.optional(v.string()), // Optional change message/note
  })
    .index("by_deal", ["dealId"])
    .index("by_deal_revision", ["dealId", "revisionNumber"]),

  dealClients: defineTable({
    dealId: v.id("deals"),
    clientId: v.id("clients"),
    role: v.string(), // 'buyer' | 'seller' | 'co_buyer' | 'co_seller'
    addedAt: v.number(),
    addedBy: v.id("users"),
  })
    .index("by_deal", ["dealId"])
    .index("by_client", ["clientId"])
    .index("by_deal_client", ["dealId", "clientId"]),

  documents: defineTable({
    dealId: v.id("deals"),
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(), // MIME type
    fileSize: v.number(), // Size in bytes
    category: v.string(), // 'contract' | 'disclosure' | 'inspection' | 'financial' | 'correspondence' | 'other'
    uploadedBy: v.id("users"),
    uploadedAt: v.number(),
    revisionId: v.optional(v.id("dealRevisions")), // Link to deal revision when uploaded
    metadata: v.optional(v.string()), // JSON string for additional metadata
    isDeleted: v.optional(v.boolean()),
  })
    .index("by_deal", ["dealId"])
    .index("by_category", ["category"])
    .index("by_deal_category", ["dealId", "category"]),

  documentAccessTokens: defineTable({
    token: v.string(),
    sessionId: v.string(), // Unique session identifier
    documentId: v.id("documents"),
    userId: v.id("users"),
    userAgent: v.string(), // Clerk user ID for additional validation
    ipAddress: v.optional(v.string()), // Optional IP tracking
    expiresAt: v.number(),
    createdAt: v.number(),
    usedAt: v.optional(v.number()), // When token was first used
    usageCount: v.number(), // Track usage to prevent replay attacks
  })
    .index("by_token", ["token"])
    .index("by_document", ["documentId"])
    .index("by_user", ["userId"])
    .index("by_session", ["sessionId"]),

  documentAccessLogs: defineTable({
    documentId: v.id("documents"),
    userId: v.id("users"),
    accessType: v.string(), // 'view' | 'download'
    accessedAt: v.number(),
  })
    .index("by_document", ["documentId"])
    .index("by_user", ["userId"])
    .index("by_document_user", ["documentId", "userId"]),
});
