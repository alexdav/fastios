import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Generate an upload URL for file storage
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Not authenticated");

    // Generate and return upload URL
    return await ctx.storage.generateUploadUrl();
  },
});

// Save document metadata after successful upload
export const saveDocument = mutation({
  args: {
    dealId: v.id("deals"),
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    category: v.string(),
    metadata: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Not authenticated");

    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    // Get agent
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!agent) throw new Error("Agent profile not found");

    // Verify deal ownership
    const deal = await ctx.db.get(args.dealId);
    if (!deal || deal.isDeleted) throw new Error("Deal not found");
    if (deal.agentId !== agent._id) throw new Error("Unauthorized");

    // Get current revision for linking
    const currentRevision = await ctx.db
      .query("dealRevisions")
      .withIndex("by_deal_revision", (q) =>
        q.eq("dealId", args.dealId).eq("revisionNumber", deal.currentRevision)
      )
      .first();

    // Save document metadata
    const documentId = await ctx.db.insert("documents", {
      dealId: args.dealId,
      storageId: args.storageId,
      fileName: args.fileName,
      fileType: args.fileType,
      fileSize: args.fileSize,
      category: args.category,
      uploadedBy: user._id,
      uploadedAt: Date.now(),
      revisionId: currentRevision?._id,
      metadata: args.metadata,
      isDeleted: false,
    });

    // Create a revision for the document upload
    const newRevisionNumber = deal.currentRevision + 1;
    
    // Get current deal snapshot
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

    await ctx.db.insert("dealRevisions", {
      dealId: args.dealId,
      revisionNumber: newRevisionNumber,
      modifiedBy: user._id,
      modifiedAt: Date.now(),
      changeType: "document_change",
      changes: JSON.stringify({
        action: "document_added",
        fileName: args.fileName,
        category: args.category,
        fileSize: args.fileSize,
      }),
      snapshot: JSON.stringify(snapshot),
      message: `Added document: ${args.fileName}`,
    });

    // Update deal's revision number
    await ctx.db.patch(args.dealId, {
      currentRevision: newRevisionNumber,
      updatedAt: Date.now(),
    });

    return documentId;
  },
});

// Get URL for a document
export const getDocumentUrl = query({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) return null;

    // Generate and return file URL
    return await ctx.storage.getUrl(args.storageId);
  },
});

// List documents for a deal
export const listDealDocuments = query({
  args: {
    dealId: v.id("deals"),
    category: v.optional(v.string()),
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

    // Get documents
    let documentsQuery = ctx.db
      .query("documents")
      .withIndex("by_deal", (q) => q.eq("dealId", args.dealId));

    const documents = await documentsQuery.collect();

    // Filter by category if specified and exclude deleted
    const filteredDocs = documents.filter(doc => {
      if (doc.isDeleted) return false;
      if (args.category && doc.category !== args.category) return false;
      return true;
    });

    // Get URLs and uploader info for each document
    const docsWithDetails = await Promise.all(
      filteredDocs.map(async (doc) => {
        const url = await ctx.storage.getUrl(doc.storageId);
        const uploader = await ctx.db.get(doc.uploadedBy);
        
        // Get file metadata from storage
        const storageMetadata = await ctx.db.system.get(doc.storageId);
        
        return {
          ...doc,
          url,
          uploader: uploader ? {
            name: uploader.name,
            email: uploader.email,
          } : null,
          storageMetadata: storageMetadata ? {
            sha256: storageMetadata.sha256,
            contentType: storageMetadata.contentType,
          } : null,
        };
      })
    );

    return docsWithDetails;
  },
});

// Delete a document
export const deleteDocument = mutation({
  args: {
    documentId: v.id("documents"),
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

    // Get document
    const document = await ctx.db.get(args.documentId);
    if (!document || document.isDeleted) throw new Error("Document not found");

    // Verify deal ownership
    const deal = await ctx.db.get(document.dealId);
    if (!deal || deal.agentId !== agent._id) throw new Error("Unauthorized");

    // Soft delete the document metadata
    await ctx.db.patch(args.documentId, {
      isDeleted: true,
    });

    // Delete the actual file from storage
    await ctx.storage.delete(document.storageId);

    // Create a revision for the document deletion
    const newRevisionNumber = deal.currentRevision + 1;
    
    // Get current deal snapshot
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

    await ctx.db.insert("dealRevisions", {
      dealId: document.dealId,
      revisionNumber: newRevisionNumber,
      modifiedBy: user._id,
      modifiedAt: Date.now(),
      changeType: "document_change",
      changes: JSON.stringify({
        action: "document_deleted",
        fileName: document.fileName,
        category: document.category,
      }),
      snapshot: JSON.stringify(snapshot),
      message: `Deleted document: ${document.fileName}`,
    });

    // Update deal's revision number
    await ctx.db.patch(document.dealId, {
      currentRevision: newRevisionNumber,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Get document categories
export const getCategories = query({
  handler: async () => {
    return [
      { value: "contract", label: "Contract" },
      { value: "disclosure", label: "Disclosure" },
      { value: "inspection", label: "Inspection" },
      { value: "financial", label: "Financial" },
      { value: "correspondence", label: "Correspondence" },
      { value: "other", label: "Other" },
    ];
  },
});

// Get storage statistics for a deal
export const getDealStorageStats = query({
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

    // Verify deal ownership
    const deal = await ctx.db.get(args.dealId);
    if (!deal || deal.agentId !== agent._id) return null;

    // Get all documents for the deal
    const documents = await ctx.db
      .query("documents")
      .withIndex("by_deal", (q) => q.eq("dealId", args.dealId))
      .collect();

    const activeDocuments = documents.filter(d => !d.isDeleted);

    // Calculate statistics
    const totalSize = activeDocuments.reduce((sum, doc) => sum + doc.fileSize, 0);
    const documentsByCategory: Record<string, number> = {};
    
    activeDocuments.forEach(doc => {
      documentsByCategory[doc.category] = (documentsByCategory[doc.category] || 0) + 1;
    });

    return {
      totalDocuments: activeDocuments.length,
      totalSize,
      sizeInMB: (totalSize / (1024 * 1024)).toFixed(2),
      documentsByCategory,
      lastUpload: activeDocuments.length > 0 
        ? Math.max(...activeDocuments.map(d => d.uploadedAt))
        : null,
    };
  },
});