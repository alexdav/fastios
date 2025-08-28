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
          isDemo: client.isDemo || false,
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

    // PRIVACY: Always create a placeholder to avoid revealing existing users
    // Never reveal whether an email exists in the system
    
    // Check if user with this email already exists (for internal use only)
    const userWithEmail = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();
    
    // Check if it's a real user (not a placeholder)
    const existingRealUser = userWithEmail && 
                            !userWithEmail.clerkId.startsWith("pending_") && 
                            !userWithEmail.clerkId.startsWith("demo_") 
                            ? userWithEmail 
                            : null;

    // Always create a placeholder user with the agent-provided name
    // This prevents revealing real user information
    const placeholderUserId = await ctx.db.insert("users", {
      clerkId: `pending_${args.email}_${Date.now()}`,
      email: args.email,
      name: args.name, // Always use the name provided by the agent
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const placeholderUser = await ctx.db.get(placeholderUserId);
    if (!placeholderUser) {
      throw new Error("Failed to create client user");
    }

    // Check if this agent already has this email as a client
    const existingClients = await ctx.db
      .query("clients")
      .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
      .collect();

    // Check all clients for this email
    for (const client of existingClients) {
      const clientUser = await ctx.db.get(client.userId);
      if (clientUser?.email === args.email) {
        // Clean up the placeholder we just created
        await ctx.db.delete(placeholderUserId);
        throw new Error("Client with this email already exists for this agent");
      }
    }

    // Generate invitation token
    const token = generateInvitationToken();
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    // Create the client relationship with placeholder user
    const clientId = await ctx.db.insert("clients", {
      userId: placeholderUserId,
      agentId: agent._id,
      phone: args.phone && args.phone.trim() !== "" ? args.phone : undefined,
      status: "invited",
      invitedAt: Date.now(),
      invitationToken: token,
      invitationExpiresAt: expiresAt,
      requiresConsent: !!existingRealUser, // Internal flag for consent requirement
    });

    // Create invitation record
    await ctx.db.insert("invitations", {
      agentId: agent._id,
      clientId,
      email: args.email,
      token,
      status: "pending",
      expiresAt,
      createdAt: Date.now(),
      metadata: JSON.stringify({
        isExistingUser: !!existingRealUser,
        targetUserId: existingRealUser?._id, // Store real user ID for later linking
      }),
    });

    return clientId;
  },
});

// Update client information (agent-managed fields only)
export const updateClient = mutation({
  args: {
    clientId: v.id("clients"),
    displayName: v.optional(v.string()),
    phone: v.optional(v.string()),
    notes: v.optional(v.string()),
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

    // Build update object with only provided fields
    const updates: Record<string, any> = {};
    
    if (args.displayName !== undefined) {
      updates.displayName = args.displayName.trim() || undefined;
    }
    
    if (args.phone !== undefined) {
      updates.phone = args.phone.trim() || undefined;
    }
    
    if (args.notes !== undefined) {
      updates.notes = args.notes.trim() || undefined;
    }

    // Update only the client record with agent-managed fields
    await ctx.db.patch(args.clientId, updates);

    return { success: true };
  },
});

// Update email for invited (not yet accepted) clients
export const updateInvitedClientEmail = mutation({
  args: {
    clientId: v.id("clients"),
    email: v.string(),
  },
  returns: v.object({ 
    success: v.boolean(),
    message: v.optional(v.string()),
  }),
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

    // Check if client is still in invited status
    if (client.status !== 'invited') {
      return { 
        success: false, 
        message: "Cannot change email after invitation has been accepted" 
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(args.email)) {
      throw new Error("Invalid email format");
    }

    // Update the user record's email
    const clientUser = await ctx.db.get(client.userId);
    if (!clientUser) {
      throw new Error("Client user not found");
    }

    await ctx.db.patch(client.userId, {
      email: args.email,
      updatedAt: Date.now(),
    });

    // Also update any pending invitations with the new email
    const invitations = await ctx.db
      .query("invitations")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    for (const invitation of invitations) {
      await ctx.db.patch(invitation._id, {
        email: args.email,
      });
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

    // Delete any pending invitations for this client
    const invitations = await ctx.db
      .query("invitations")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    for (const invitation of invitations) {
      await ctx.db.delete(invitation._id);
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

    // Delete any pending invitations for this client
    const invitations = await ctx.db
      .query("invitations")
      .withIndex("by_client", (q) => q.eq("clientId", client._id))
      .collect();

    for (const invitation of invitations) {
      await ctx.db.delete(invitation._id);
    }

    // Delete client profile
    await ctx.db.delete(client._id);

    return { success: true };
  },
});

// Add a demo client (for trial/demo agents)
export const addDemoClient = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    demoData: v.optional(v.string()), // Additional demo-specific data
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

    // Create a demo user (not linked to real Clerk account)
    const demoEmail = args.email || `demo_${Date.now()}@example.com`;
    const userId = await ctx.db.insert("users", {
      clerkId: `demo_${demoEmail}_${Date.now()}`,
      email: demoEmail,
      name: args.name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create demo client profile
    const clientId = await ctx.db.insert("clients", {
      userId,
      agentId: agent._id,
      phone: args.phone,
      status: "active", // Demo clients are immediately active
      invitedAt: Date.now(),
      acceptedAt: Date.now(),
      isDemo: true,
      demoData: args.demoData,
    });

    return clientId;
  },
});

// Convert demo clients to real clients
export const convertDemoClients = mutation({
  args: {
    clientIds: v.array(v.id("clients")),
    sendInvitations: v.optional(v.boolean()),
  },
  returns: v.object({
    converted: v.number(),
    invitationsSent: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get the agent
    const agentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!agentUser) {
      throw new Error("Agent user not found");
    }

    const agent = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", agentUser._id))
      .first();

    if (!agent) {
      throw new Error("Agent profile not found");
    }

    let converted = 0;
    let invitationsSent = 0;
    const errors: string[] = [];

    for (const clientId of args.clientIds) {
      try {
        const client = await ctx.db.get(clientId);
        if (!client) {
          errors.push(`Client ${clientId} not found`);
          continue;
        }

        // Verify ownership
        if (client.agentId !== agent._id) {
          errors.push(`Client ${clientId} does not belong to this agent`);
          continue;
        }

        // Skip if not a demo client
        if (!client.isDemo) {
          errors.push(`Client ${clientId} is not a demo client`);
          continue;
        }

        // Update client to non-demo
        await ctx.db.patch(clientId, {
          isDemo: false,
          status: "invited",
        });

        // Generate invitation if requested
        if (args.sendInvitations) {
          const user = await ctx.db.get(client.userId);
          if (user?.email && !user.email.includes("@example.com")) {
            // Generate invitation token
            const token = generateInvitationToken();
            const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

            await ctx.db.patch(clientId, {
              invitationToken: token,
              invitationExpiresAt: expiresAt,
            });

            // Create invitation record
            await ctx.db.insert("invitations", {
              agentId: agent._id,
              clientId,
              email: user.email,
              token,
              status: "pending",
              expiresAt,
              createdAt: Date.now(),
            });

            invitationsSent++;
          }
        }

        converted++;
      } catch (error) {
        errors.push(`Error converting client ${clientId}: ${error}`);
      }
    }

    return { converted, invitationsSent, errors };
  },
});

// Generate invitation link for a client
export const generateInvitationLink = mutation({
  args: {
    clientId: v.id("clients"),
  },
  returns: v.object({
    token: v.string(),
    url: v.string(),
    expiresAt: v.number(),
  }),
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get the agent
    const agentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!agentUser) {
      throw new Error("Agent user not found");
    }

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

    // Verify ownership
    if (client.agentId !== agent._id) {
      throw new Error("Unauthorized: Client does not belong to this agent");
    }

    // Get client user for email
    const clientUser = await ctx.db.get(client.userId);
    if (!clientUser?.email) {
      throw new Error("Client email not found");
    }

    // Generate new token
    const token = generateInvitationToken();
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    // Update client with invitation details
    await ctx.db.patch(args.clientId, {
      invitationToken: token,
      invitationExpiresAt: expiresAt,
      status: "invited",
    });

    // Create invitation record
    await ctx.db.insert("invitations", {
      agentId: agent._id,
      clientId: args.clientId,
      email: clientUser.email,
      token,
      status: "sent",
      sentAt: Date.now(),
      expiresAt,
      createdAt: Date.now(),
    });

    // Generate invitation URL
    // In production, this should use your actual domain
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   process.env.NEXT_PUBLIC_CONVEX_URL?.includes('convex.cloud') 
                     ? "https://fastios.vercel.app" // Replace with your production URL
                     : "http://localhost:3000";
    const url = `${baseUrl}/invite/${token}`;

    return { token, url, expiresAt };
  },
});

// Accept invitation
export const acceptInvitation = mutation({
  args: {
    token: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    clientId: v.optional(v.id("clients")),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Find client by token
    const client = await ctx.db
      .query("clients")
      .withIndex("by_token", (q) => q.eq("invitationToken", args.token))
      .first();

    if (!client) {
      return {
        success: false,
        message: "Invalid invitation token",
      };
    }

    // Check if token has expired
    if (client.invitationExpiresAt && client.invitationExpiresAt < Date.now()) {
      return {
        success: false,
        message: "Invitation has expired",
      };
    }

    // Get current authenticated user
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) {
      return {
        success: false,
        message: "Not authenticated. Please sign in to accept the invitation.",
      };
    }

    // Get the authenticated user
    const authUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!authUser) {
      return {
        success: false,
        message: "User not found",
      };
    }

    // Get the placeholder/existing user
    const placeholderUser = await ctx.db.get(client.userId);
    if (!placeholderUser) {
      return {
        success: false,
        message: "Client user not found",
      };
    }

    // Get the invitation record to check metadata
    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    // Check if already accepted by checking if placeholder has been replaced
    if (!placeholderUser.clerkId.startsWith("pending_") && 
        !placeholderUser.clerkId.startsWith("demo_")) {
      // This is a real user, invitation was already accepted
      return {
        success: false,
        message: "This invitation has already been accepted",
      };
    }

    // Allow any authenticated user to accept the invitation
    // The invitation link acts as a transferable access token
    
    // Update the client to point to the authenticated user
    await ctx.db.patch(client._id, {
      userId: authUser._id,
      status: "active",
      acceptedAt: Date.now(),
      invitationToken: undefined,
      invitationExpiresAt: undefined,
      requiresConsent: undefined,
    });

    // Delete the placeholder user (it's no longer needed)
    await ctx.db.delete(placeholderUser._id);

    // Update invitation record with actual email that accepted
    if (invitation) {
      await ctx.db.patch(invitation._id, {
        status: "accepted",
        acceptedAt: Date.now(),
        acceptedBy: authUser.email, // Track who actually accepted
      });
    }

    return {
      success: true,
      clientId: client._id,
      message: "Invitation accepted successfully",
    };
  },
});

// Get invitation details by token
export const getInvitationDetails = query({
  args: {
    token: v.string(),
  },
  returns: v.union(
    v.object({
      valid: v.literal(true),
      agentName: v.string(),
      agentCompany: v.optional(v.string()),
      clientName: v.string(),
      expiresAt: v.number(),
    }),
    v.object({
      valid: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    // Find client by token
    const client = await ctx.db
      .query("clients")
      .withIndex("by_token", (q) => q.eq("invitationToken", args.token))
      .first();

    if (!client) {
      return {
        valid: false as const,
        error: "Invalid invitation token",
      };
    }

    // Check if token has expired
    if (client.invitationExpiresAt && client.invitationExpiresAt < Date.now()) {
      return {
        valid: false as const,
        error: "This invitation has expired",
      };
    }

    // Check if already accepted
    if (client.status === "active" && client.acceptedAt) {
      return {
        valid: false as const,
        error: "This invitation has already been accepted",
      };
    }

    // Get agent details
    const agent = await ctx.db.get(client.agentId);
    if (!agent) {
      return {
        valid: false as const,
        error: "Agent not found",
      };
    }

    const agentUser = await ctx.db.get(agent.userId);
    if (!agentUser) {
      return {
        valid: false as const,
        error: "Agent user not found",
      };
    }

    // Get client user details
    const clientUser = await ctx.db.get(client.userId);
    if (!clientUser) {
      return {
        valid: false as const,
        error: "Client user not found",
      };
    }

    return {
      valid: true as const,
      agentName: agentUser.name || "Unknown Agent",
      agentCompany: agent.company,
      clientName: clientUser.name || "Unknown Client",
      expiresAt: client.invitationExpiresAt || 0,
    };
  },
});

// Get pending invitations for current user
export const getPendingInvitations = query({
  returns: v.array(v.object({
    _id: v.id("invitations"),
    agentName: v.string(),
    agentCompany: v.optional(v.string()),
    invitedAt: v.number(),
    expiresAt: v.number(),
    token: v.string(),
  })),
  handler: async (ctx) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) {
      return [];
    }

    // Get the current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || !user.email) {
      return [];
    }

    // Find pending invitations for this user's email
    const pendingInvitations = await ctx.db
      .query("invitations")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .filter((q) => 
        q.eq(q.field("status"), "pending")
      )
      .collect();

    // Get agent details for each invitation
    const invitations = await Promise.all(
      pendingInvitations.map(async (invitation) => {
        // Check if the client still exists
        const client = await ctx.db.get(invitation.clientId);
        if (!client) return null;

        const agent = await ctx.db.get(invitation.agentId);
        if (!agent) return null;

        const agentUser = await ctx.db.get(agent.userId);
        if (!agentUser) return null;

        return {
          _id: invitation._id,
          agentName: agentUser.name || "Unknown Agent",
          agentCompany: agent.company,
          invitedAt: invitation.createdAt,
          expiresAt: invitation.expiresAt,
          token: invitation.token,
        };
      })
    );

    return invitations.filter((inv): inv is NonNullable<typeof inv> => inv !== null);
  },
});

// Helper function to generate cryptographically secure invitation token
function generateInvitationToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(array[i] % chars.length);
  }
  return token;
}