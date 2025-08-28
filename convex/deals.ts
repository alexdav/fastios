import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Helper function to create a revision
async function createRevision(
  ctx: any,
  dealId: string,
  userId: string,
  changeType: string,
  changes?: any,
  message?: string
) {
  const deal = await ctx.db.get(dealId);
  if (!deal) throw new Error("Deal not found");

  const newRevisionNumber = deal.currentRevision + 1;

  // Create snapshot of current deal state
  const snapshot = {
    title: deal.title,
    description: deal.description,
    propertyAddress: deal.propertyAddress,
    propertyType: deal.propertyType,
    listPrice: deal.listPrice,
    offerPrice: deal.offerPrice,
    status: deal.status,
    stage: deal.stage,
    targetCloseDate: deal.targetCloseDate,
    actualCloseDate: deal.actualCloseDate,
  };

  // Store revision
  await ctx.db.insert("dealRevisions", {
    dealId,
    revisionNumber: newRevisionNumber,
    modifiedBy: userId,
    modifiedAt: Date.now(),
    changeType,
    changes: changes ? JSON.stringify(changes) : undefined,
    snapshot: JSON.stringify(snapshot),
    message,
  });

  // Update deal's current revision number
  await ctx.db.patch(dealId, {
    currentRevision: newRevisionNumber,
    updatedAt: Date.now(),
  });

  return newRevisionNumber;
}

// Create a new deal
export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    propertyAddress: v.optional(v.string()),
    propertyType: v.optional(v.string()),
    listPrice: v.optional(v.number()),
    offerPrice: v.optional(v.number()),
    status: v.optional(v.string()),
    stage: v.optional(v.string()),
    targetCloseDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Not authenticated");

    // Get user and agent
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const agent = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!agent) throw new Error("Agent profile not found");

    // Create the deal
    const dealId = await ctx.db.insert("deals", {
      agentId: agent._id,
      title: args.title,
      description: args.description,
      propertyAddress: args.propertyAddress,
      propertyType: args.propertyType,
      listPrice: args.listPrice,
      offerPrice: args.offerPrice,
      status: args.status || "draft",
      stage: args.stage || "lead",
      targetCloseDate: args.targetCloseDate,
      actualCloseDate: undefined,
      currentRevision: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: user._id,
      isDeleted: false,
    });

    // Create initial revision
    await createRevision(ctx, dealId, user._id, "created", args, "Deal created");

    return dealId;
  },
});

// List deals for the authenticated agent
export const list = query({
  args: {
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return [];

    const agent = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!agent) return [];

    // Query deals based on status if provided
    let dealsQuery = ctx.db
      .query("deals")
      .withIndex("by_agent", (q) => q.eq("agentId", agent._id));

    const deals = await dealsQuery.collect();

    // Filter out deleted deals and by status if specified
    const filteredDeals = deals.filter(deal => {
      if (deal.isDeleted) return false;
      if (args.status && deal.status !== args.status) return false;
      return true;
    });

    // Get client associations for each deal
    const dealsWithClients = await Promise.all(
      filteredDeals.map(async (deal) => {
        const dealClients = await ctx.db
          .query("dealClients")
          .withIndex("by_deal", (q) => q.eq("dealId", deal._id))
          .collect();

        const clients = await Promise.all(
          dealClients.map(async (dc) => {
            const client = await ctx.db.get(dc.clientId);
            if (!client) return null;
            const clientUser = await ctx.db.get(client.userId);
            return {
              ...client,
              user: clientUser,
              role: dc.role,
            };
          })
        );

        return {
          ...deal,
          clients: clients.filter(Boolean),
        };
      })
    );

    return dealsWithClients;
  },
});

// Get a single deal with revision history
export const get = query({
  args: {
    dealId: v.id("deals"),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return null;

    const agent = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!agent) return null;

    const deal = await ctx.db.get(args.dealId);
    if (!deal || deal.isDeleted) return null;

    // Verify ownership
    if (deal.agentId !== agent._id) return null;

    // Get clients
    const dealClients = await ctx.db
      .query("dealClients")
      .withIndex("by_deal", (q) => q.eq("dealId", args.dealId))
      .collect();

    const clients = await Promise.all(
      dealClients.map(async (dc) => {
        const client = await ctx.db.get(dc.clientId);
        if (!client) return null;
        const clientUser = await ctx.db.get(client.userId);
        return {
          ...client,
          user: clientUser,
          role: dc.role,
          addedAt: dc.addedAt,
        };
      })
    );

    // Get revision history
    const revisions = await ctx.db
      .query("dealRevisions")
      .withIndex("by_deal", (q) => q.eq("dealId", args.dealId))
      .order("desc")
      .collect();

    // Get user info for revision authors
    const revisionsWithUsers = await Promise.all(
      revisions.map(async (rev) => {
        const modifiedByUser = await ctx.db.get(rev.modifiedBy);
        return {
          ...rev,
          modifiedByUser,
        };
      })
    );

    // Get documents count
    const documents = await ctx.db
      .query("documents")
      .withIndex("by_deal", (q) => q.eq("dealId", args.dealId))
      .collect();

    const activeDocuments = documents.filter(d => !d.isDeleted);

    return {
      ...deal,
      clients: clients.filter(Boolean),
      revisions: revisionsWithUsers,
      documentCount: activeDocuments.length,
    };
  },
});

// Update a deal
export const update = mutation({
  args: {
    dealId: v.id("deals"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    propertyAddress: v.optional(v.string()),
    propertyType: v.optional(v.string()),
    listPrice: v.optional(v.number()),
    offerPrice: v.optional(v.number()),
    status: v.optional(v.string()),
    stage: v.optional(v.string()),
    targetCloseDate: v.optional(v.number()),
    actualCloseDate: v.optional(v.number()),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const agent = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!agent) throw new Error("Agent profile not found");

    const deal = await ctx.db.get(args.dealId);
    if (!deal || deal.isDeleted) throw new Error("Deal not found");

    // Verify ownership
    if (deal.agentId !== agent._id) throw new Error("Unauthorized");

    const { dealId, message, ...updates } = args;

    // Track what changed
    const changes: any = {};
    let changeType = "updated";

    // Check for specific change types
    if (updates.stage && updates.stage !== deal.stage) {
      changeType = "stage_change";
      changes.previousStage = deal.stage;
      changes.newStage = updates.stage;
    } else if (updates.status && updates.status !== deal.status) {
      changeType = "status_change";
      changes.previousStatus = deal.status;
      changes.newStatus = updates.status;
    }

    // Record all changes
    Object.keys(updates).forEach((key) => {
      const updateKey = key as keyof typeof updates;
      if (updates[updateKey] !== undefined && updates[updateKey] !== deal[updateKey as keyof typeof deal]) {
        changes[key] = {
          from: deal[updateKey as keyof typeof deal],
          to: updates[updateKey],
        };
      }
    });

    // Update the deal
    await ctx.db.patch(dealId, {
      ...updates,
      updatedAt: Date.now(),
    });

    // Create revision
    await createRevision(ctx, dealId, user._id, changeType, changes, message);

    return dealId;
  },
});

// Delete a deal (soft delete)
export const remove = mutation({
  args: {
    dealId: v.id("deals"),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const agent = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!agent) throw new Error("Agent profile not found");

    const deal = await ctx.db.get(args.dealId);
    if (!deal) throw new Error("Deal not found");

    // Verify ownership
    if (deal.agentId !== agent._id) throw new Error("Unauthorized");

    // Soft delete
    await ctx.db.patch(args.dealId, {
      isDeleted: true,
      updatedAt: Date.now(),
    });

    // Create deletion revision
    await createRevision(ctx, args.dealId, user._id, "deleted", null, "Deal deleted");

    return { success: true };
  },
});

// Add a client to a deal
export const addClient = mutation({
  args: {
    dealId: v.id("deals"),
    clientId: v.id("clients"),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const agent = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!agent) throw new Error("Agent profile not found");

    // Verify deal ownership
    const deal = await ctx.db.get(args.dealId);
    if (!deal || deal.isDeleted) throw new Error("Deal not found");
    if (deal.agentId !== agent._id) throw new Error("Unauthorized");

    // Verify client belongs to agent
    const client = await ctx.db.get(args.clientId);
    if (!client) throw new Error("Client not found");
    if (client.agentId !== agent._id) throw new Error("Client not found");

    // Check if already associated
    const existing = await ctx.db
      .query("dealClients")
      .withIndex("by_deal_client", (q) =>
        q.eq("dealId", args.dealId).eq("clientId", args.clientId)
      )
      .first();

    if (existing) throw new Error("Client already associated with this deal");

    // Add association
    await ctx.db.insert("dealClients", {
      dealId: args.dealId,
      clientId: args.clientId,
      role: args.role,
      addedAt: Date.now(),
      addedBy: user._id,
    });

    // Get client user for revision tracking
    const clientUser = await ctx.db.get(client.userId);

    // Create revision
    await createRevision(
      ctx,
      args.dealId,
      user._id,
      "client_change",
      {
        action: "added",
        clientName: clientUser?.name || "Unknown",
        role: args.role,
      },
      `Added client: ${clientUser?.name || "Unknown"} as ${args.role}`
    );

    return { success: true };
  },
});

// Remove a client from a deal
export const removeClient = mutation({
  args: {
    dealId: v.id("deals"),
    clientId: v.id("clients"),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const agent = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!agent) throw new Error("Agent profile not found");

    // Verify deal ownership
    const deal = await ctx.db.get(args.dealId);
    if (!deal || deal.isDeleted) throw new Error("Deal not found");
    if (deal.agentId !== agent._id) throw new Error("Unauthorized");

    // Find association
    const association = await ctx.db
      .query("dealClients")
      .withIndex("by_deal_client", (q) =>
        q.eq("dealId", args.dealId).eq("clientId", args.clientId)
      )
      .first();

    if (!association) throw new Error("Client not associated with this deal");

    // Get client info for revision
    const client = await ctx.db.get(args.clientId);
    const clientUser = client ? await ctx.db.get(client.userId) : null;

    // Delete association
    await ctx.db.delete(association._id);

    // Create revision
    await createRevision(
      ctx,
      args.dealId,
      user._id,
      "client_change",
      {
        action: "removed",
        clientName: clientUser?.name || "Unknown",
        role: association.role,
      },
      `Removed client: ${clientUser?.name || "Unknown"}`
    );

    return { success: true };
  },
});

// Get revision history for a deal
export const getRevisionHistory = query({
  args: {
    dealId: v.id("deals"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return [];

    const agent = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!agent) return [];

    // Verify deal ownership
    const deal = await ctx.db.get(args.dealId);
    if (!deal || deal.agentId !== agent._id) return [];

    // Get revisions
    let revisionsQuery = ctx.db
      .query("dealRevisions")
      .withIndex("by_deal", (q) => q.eq("dealId", args.dealId))
      .order("desc");

    if (args.limit) {
      revisionsQuery = revisionsQuery.take(args.limit);
    }

    const revisions = await revisionsQuery.collect();

    // Get user info for each revision
    const revisionsWithUsers = await Promise.all(
      revisions.map(async (rev) => {
        const modifiedByUser = await ctx.db.get(rev.modifiedBy);
        return {
          ...rev,
          modifiedByUser,
          changes: rev.changes ? JSON.parse(rev.changes) : null,
          snapshot: JSON.parse(rev.snapshot),
        };
      })
    );

    return revisionsWithUsers;
  },
});

// Update deal stage
export const updateStage = mutation({
  args: {
    dealId: v.id("deals"),
    stage: v.string(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const agent = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!agent) throw new Error("Agent profile not found");

    const deal = await ctx.db.get(args.dealId);
    if (!deal || deal.isDeleted) throw new Error("Deal not found");
    if (deal.agentId !== agent._id) throw new Error("Unauthorized");

    const previousStage = deal.stage;

    // Update stage
    await ctx.db.patch(args.dealId, {
      stage: args.stage,
      updatedAt: Date.now(),
    });

    // Create revision
    await createRevision(
      ctx,
      args.dealId,
      user._id,
      "stage_change",
      {
        previousStage,
        newStage: args.stage,
      },
      args.message || `Stage changed from ${previousStage} to ${args.stage}`
    );

    return { success: true };
  },
});