import { v } from "convex/values";
import { mutation, query, internalQuery, internalMutation } from "./_generated/server";
import { auth } from "./auth";
import { internal } from "./_generated/api";

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

// Rename document
export const renameDocument = mutation({
  args: {
    documentId: v.id("documents"),
    fileName: v.string(),
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

    // Get document
    const document = await ctx.db.get(args.documentId);
    if (!document || document.isDeleted) throw new Error("Document not found");

    // Verify deal ownership
    const deal = await ctx.db.get(document.dealId);
    if (!deal || deal.agentId !== agent._id) throw new Error("Unauthorized");

    const oldFileName = document.fileName;

    // Update document name
    await ctx.db.patch(args.documentId, {
      fileName: args.fileName,
    });

    // Create a revision for the rename
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
        action: "document_renamed",
        oldFileName: oldFileName,
        newFileName: args.fileName,
      }),
      snapshot: JSON.stringify(snapshot),
      message: `Renamed document: ${oldFileName} → ${args.fileName}`,
    });

    // Update deal's revision number
    await ctx.db.patch(document.dealId, {
      currentRevision: newRevisionNumber,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Update document category
export const updateDocumentCategory = mutation({
  args: {
    documentId: v.id("documents"),
    category: v.string(),
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

    // Get document
    const document = await ctx.db.get(args.documentId);
    if (!document || document.isDeleted) throw new Error("Document not found");

    // Verify deal ownership
    const deal = await ctx.db.get(document.dealId);
    if (!deal || deal.agentId !== agent._id) throw new Error("Unauthorized");

    const oldCategory = document.category;

    // Update document category
    await ctx.db.patch(args.documentId, {
      category: args.category,
    });

    // Create a revision for the category change
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
        action: "document_category_changed",
        fileName: document.fileName,
        oldCategory: oldCategory,
        newCategory: args.category,
      }),
      snapshot: JSON.stringify(snapshot),
      message: `Changed category for ${document.fileName}: ${oldCategory} → ${args.category}`,
    });

    // Update deal's revision number
    await ctx.db.patch(document.dealId, {
      currentRevision: newRevisionNumber,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Get URL for a document with security checks
export const getSecureDocumentUrl = query({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) return null;

    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return null;

    // Get document
    const document = await ctx.db.get(args.documentId);
    if (!document || document.isDeleted) return null;

    // Get deal
    const deal = await ctx.db.get(document.dealId);
    if (!deal || deal.isDeleted) return null;

    // Check if user is the agent of the deal
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (agent && deal.agentId === agent._id) {
      // User is the agent, grant access
      return await ctx.storage.getUrl(document.storageId);
    }

    // Check if user is a client associated with the deal
    const client = await ctx.db
      .query("clients")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (client) {
      // Check if this client is associated with this specific deal
      const dealClient = await ctx.db
        .query("dealClients")
        .withIndex("by_deal_client", (q) =>
          q.eq("dealId", document.dealId).eq("clientId", client._id)
        )
        .first();

      if (dealClient) {
        // User is a client of this deal, grant access
        return await ctx.storage.getUrl(document.storageId);
      }
    }

    // No access granted
    return null;
  },
});


// List documents for a deal with secure access
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

    // Get deal
    const deal = await ctx.db.get(args.dealId);
    if (!deal || deal.isDeleted) return [];

    // Check if user has access to this deal
    let hasAccess = false;

    // Check if user is the agent of the deal
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (agent && deal.agentId === agent._id) {
      hasAccess = true;
    }

    // If not agent, check if user is a client of this deal
    if (!hasAccess) {
      const client = await ctx.db
        .query("clients")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();

      if (client) {
        const dealClient = await ctx.db
          .query("dealClients")
          .withIndex("by_deal_client", (q) =>
            q.eq("dealId", args.dealId).eq("clientId", client._id)
          )
          .first();

        if (dealClient) {
          hasAccess = true;
        }
      }
    }

    // No access - return empty array
    if (!hasAccess) return [];

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
    // NOTE: We don't return direct storage URLs anymore - clients must use getSecureDocumentUrl
    const docsWithDetails = await Promise.all(
      filteredDocs.map(async (doc) => {
        const uploader = await ctx.db.get(doc.uploadedBy);
        
        // Get file metadata from storage
        const storageMetadata = await ctx.db.system.get(doc.storageId);
        
        return {
          ...doc,
          url: null, // Don't expose direct URLs - use getSecureDocumentUrl instead
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

// Generate a secure access token for document access
export const generateDocumentAccessToken = mutation({
  args: {
    documentId: v.id("documents"),
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

    // Get document
    const document = await ctx.db.get(args.documentId);
    if (!document || document.isDeleted) throw new Error("Document not found");

    // Get deal
    const deal = await ctx.db.get(document.dealId);
    if (!deal || deal.isDeleted) throw new Error("Deal not found");

    // Check if user has access to this deal
    let hasAccess = false;

    // Check if user is the agent of the deal
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (agent && deal.agentId === agent._id) {
      hasAccess = true;
    }

    // If not agent, check if user is a client of this deal
    if (!hasAccess) {
      const client = await ctx.db
        .query("clients")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();

      if (client) {
        const dealClient = await ctx.db
          .query("dealClients")
          .withIndex("by_deal_client", (q) =>
            q.eq("dealId", document.dealId).eq("clientId", client._id)
          )
          .first();

        if (dealClient) {
          hasAccess = true;
        }
      }
    }

    if (!hasAccess) {
      throw new Error("Access denied");
    }

    // Generate a cryptographically secure token using Web Crypto API
    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    
    // Convert to URL-safe base64
    const token = btoa(String.fromCharCode(...tokenBytes))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    // Generate a unique session ID for this access
    const sessionId = crypto.randomUUID();
    
    // Set expiration (5 minutes for security)
    const expiresAt = Date.now() + 5 * 60 * 1000;

    // Store the token for validation with additional security metadata
    await ctx.db.insert("documentAccessTokens", {
      token,
      sessionId,
      documentId: args.documentId,
      userId: user._id,
      userAgent: identity.subject, // Store the Clerk user ID for additional validation
      ipAddress: null, // Can be populated if passed from client
      expiresAt,
      createdAt: Date.now(),
      usedAt: null, // Track when token is used
      usageCount: 0, // Track usage to prevent replay attacks
    });

    // Get the Convex site URL
    const siteUrl = process.env.CONVEX_SITE_URL || 
                    (process.env.NEXT_PUBLIC_CONVEX_URL?.replace('.convex.cloud', '.convex.site').replace('https://', ''));

    return {
      token,
      expiresAt,
      url: `${siteUrl}/secure-documents?id=${args.documentId}&token=${token}`,
    };
  },
});

// Internal query to validate document access token with enhanced security
export const validateAndGetDocument = internalQuery({
  args: {
    documentId: v.id("documents"),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the token
    const accessToken = await ctx.db
      .query("documentAccessTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!accessToken) {
      return { isValid: false, error: "Invalid token" };
    }

    // Check if token has expired
    if (accessToken.expiresAt < Date.now()) {
      return { isValid: false, error: "Token expired" };
    }

    // Check if token has already been used (single-use tokens for downloads)
    if (accessToken.usageCount && accessToken.usageCount > 0) {
      return { isValid: false, error: "Token already used" };
    }

    // Check if token is for the correct document
    if (accessToken.documentId !== args.documentId) {
      return { isValid: false, error: "Token not valid for this document" };
    }

    // Get the document
    const document = await ctx.db.get(args.documentId);
    if (!document || document.isDeleted) {
      return { isValid: false, error: "Document not found" };
    }

    // Mark token as used (this needs to be done in a mutation)
    // We'll return the token ID so the HTTP action can update it
    return {
      isValid: true,
      tokenId: accessToken._id,
      storageId: document.storageId,
      fileName: document.fileName,
      fileType: document.fileType,
      fileSize: document.fileSize,
      userId: accessToken.userId,
      sessionId: accessToken.sessionId,
    };
  },
});

// Internal mutation to mark token as used
export const markTokenAsUsed = internalMutation({
  args: {
    tokenId: v.id("documentAccessTokens"),
  },
  handler: async (ctx, args) => {
    const token = await ctx.db.get(args.tokenId);
    if (token) {
      await ctx.db.patch(args.tokenId, {
        usedAt: Date.now(),
        usageCount: (token.usageCount || 0) + 1,
      });
    }
  },
});

// Internal mutation to log document access
export const logDocumentAccess = internalMutation({
  args: {
    documentId: v.id("documents"),
    userId: v.id("users"),
    accessType: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("documentAccessLogs", {
      documentId: args.documentId,
      userId: args.userId,
      accessType: args.accessType,
      accessedAt: Date.now(),
    });
  },
});
