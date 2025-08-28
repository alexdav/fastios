# Fastios MVP Migration Guide

This guide provides step-by-step instructions to build a rough MVP real estate agent platform using Convex, based on the budget project architecture.

## Phase 1: Core Setup (Day 1)

### Step 1: Install Essential Dependencies

```bash
# Authentication
npm install @clerk/nextjs @clerk/themes

# UI Components
npx shadcn@latest init
npx shadcn@latest add button card form input label select dialog toast table tabs badge

# Utilities
npm install zod react-hook-form @hookform/resolvers date-fns lucide-react
```

### Step 2: Setup Clerk Authentication

1. Create account at [clerk.com](https://clerk.com)
2. Create new application
3. Add to `.env.local`:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/signin
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
```

### Step 3: Create Convex Schema

Create `convex/schema.ts`:
```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  agents: defineTable({
    clerkUserId: v.string(),
    email: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    licenseNumber: v.optional(v.string()),
    subscriptionStatus: v.string(), // 'trial' | 'active' | 'canceled'
    subscriptionEndsAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_clerk", ["clerkUserId"])
    .index("by_email", ["email"]),

  clients: defineTable({
    agentId: v.id("agents"),
    clerkUserId: v.optional(v.string()),
    email: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    status: v.string(), // 'invited' | 'active'
    invitedAt: v.number(),
    acceptedAt: v.optional(v.number()),
  })
    .index("by_agent", ["agentId"])
    .index("by_clerk", ["clerkUserId"])
    .index("by_email", ["email"]),

  deals: defineTable({
    agentId: v.id("agents"),
    title: v.string(),
    description: v.optional(v.string()),
    propertyAddress: v.optional(v.string()),
    propertyType: v.optional(v.string()),
    listPrice: v.optional(v.string()),
    offerPrice: v.optional(v.string()),
    status: v.string(), // 'draft' | 'active' | 'closed'
    stage: v.string(), // 'initial_contact' | 'showing' | 'offer' | 'negotiation' | 'contract' | 'closing'
    targetCloseDate: v.optional(v.number()),
    actualCloseDate: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_agent", ["agentId"])
    .index("by_status", ["status"]),

  dealClients: defineTable({
    dealId: v.id("deals"),
    clientId: v.id("clients"),
    role: v.string(), // 'primary' | 'co_buyer' | 'spouse'
    addedAt: v.number(),
  })
    .index("by_deal", ["dealId"])
    .index("by_client", ["clientId"])
    .index("by_both", ["dealId", "clientId"]),

  documents: defineTable({
    dealId: v.id("deals"),
    storageId: v.id("_storage"),
    name: v.string(),
    type: v.string(),
    size: v.number(),
    uploadedBy: v.id("agents"),
    uploadedAt: v.number(),
  })
    .index("by_deal", ["dealId"]),
});
```

### Step 4: Configure Clerk + Convex Integration

Create `convex/auth.config.js`:
```javascript
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};
```

Create `convex/http.ts`:
```typescript
import { httpRouter } from "convex/server";
import { auth } from "./auth";

const http = httpRouter();
auth.addHttpRoutes(http);

export default http;
```

### Step 5: Setup Middleware

Create `src/middleware.ts`:
```typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/agent(.*)',
  '/client(.*)',
]);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) auth().protect();
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

## Phase 2: Core Functions (Day 2)

### Step 6: Authentication Functions

Create `convex/agents.ts`:
```typescript
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Get or create agent on signin
export const getOrCreateAgent = mutation({
  args: {
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, { email, name }) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthenticated");

    const existing = await ctx.db
      .query("agents")
      .withIndex("by_clerk", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert("agents", {
      clerkUserId: identity.subject,
      email,
      name,
      subscriptionStatus: "trial",
      createdAt: Date.now(),
    });
  },
});

// Get current agent
export const getCurrentAgent = query({
  handler: async (ctx) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) return null;

    return await ctx.db
      .query("agents")
      .withIndex("by_clerk", (q) => q.eq("clerkUserId", identity.subject))
      .first();
  },
});
```

### Step 7: Deal Management Functions

Create `convex/deals.ts`:
```typescript
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// List agent's deals
export const list = query({
  handler: async (ctx) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) return [];

    const agent = await ctx.db
      .query("agents")
      .withIndex("by_clerk", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    if (!agent) return [];

    const deals = await ctx.db
      .query("deals")
      .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
      .order("desc")
      .collect();

    // Get client associations
    const dealsWithClients = await Promise.all(
      deals.map(async (deal) => {
        const dealClients = await ctx.db
          .query("dealClients")
          .withIndex("by_deal", (q) => q.eq("dealId", deal._id))
          .collect();

        const clients = await Promise.all(
          dealClients.map(async (dc) => {
            const client = await ctx.db.get(dc.clientId);
            return client ? { ...client, role: dc.role } : null;
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

// Create new deal
export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    propertyAddress: v.optional(v.string()),
    propertyType: v.optional(v.string()),
    listPrice: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthenticated");

    const agent = await ctx.db
      .query("agents")
      .withIndex("by_clerk", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    if (!agent) throw new Error("Agent not found");

    return await ctx.db.insert("deals", {
      ...args,
      agentId: agent._id,
      status: args.status || "draft",
      stage: "initial_contact",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Update deal
export const update = mutation({
  args: {
    id: v.id("deals"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    propertyAddress: v.optional(v.string()),
    propertyType: v.optional(v.string()),
    listPrice: v.optional(v.string()),
    offerPrice: v.optional(v.string()),
    status: v.optional(v.string()),
    stage: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...updates }) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthenticated");

    const deal = await ctx.db.get(id);
    if (!deal) throw new Error("Deal not found");

    // Verify ownership
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_clerk", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    if (!agent || deal.agentId !== agent._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return id;
  },
});

// Delete deal
export const remove = mutation({
  args: { id: v.id("deals") },
  handler: async (ctx, { id }) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthenticated");

    const deal = await ctx.db.get(id);
    if (!deal) throw new Error("Deal not found");

    // Verify ownership
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_clerk", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    if (!agent || deal.agentId !== agent._id) {
      throw new Error("Unauthorized");
    }

    // Delete associated records
    const dealClients = await ctx.db
      .query("dealClients")
      .withIndex("by_deal", (q) => q.eq("dealId", id))
      .collect();

    for (const dc of dealClients) {
      await ctx.db.delete(dc._id);
    }

    await ctx.db.delete(id);
  },
});
```

## Phase 3: UI Components (Day 3)

### Step 8: App Layout Structure

Create `src/app/(auth)/layout.tsx`:
```typescript
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      {children}
    </div>
  );
}
```

Create `src/app/(authenticated)/layout.tsx`:
```typescript
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <nav className="flex space-x-8">
              <Link href="/dashboard" className="text-gray-900 hover:text-gray-700">
                Dashboard
              </Link>
              <Link href="/deals" className="text-gray-900 hover:text-gray-700">
                Deals
              </Link>
              <Link href="/clients" className="text-gray-900 hover:text-gray-700">
                Clients
              </Link>
            </nav>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
```

### Step 9: Convex Provider Setup

Create `src/components/providers/convex-provider.tsx`:
```typescript
"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithAuth } from "convex/react-auth0";
import { ReactNode } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <ConvexProviderWithAuth client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithAuth>
    </ClerkProvider>
  );
}
```

Update `src/app/layout.tsx`:
```typescript
import { ConvexClientProvider } from "@/components/providers/convex-provider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
```

### Step 10: Deal List Page

Create `src/app/(authenticated)/deals/page.tsx`:
```typescript
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useState } from "react";
import { CreateDealDialog } from "./_components/create-deal-dialog";

export default function DealsPage() {
  const deals = useQuery(api.deals.list);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Deals</h1>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Deal
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {deals?.map((deal) => (
          <Card key={deal._id} className="p-6">
            <h3 className="font-semibold text-lg mb-2">{deal.title}</h3>
            <p className="text-gray-600 text-sm mb-4">{deal.propertyAddress}</p>
            <div className="flex justify-between items-center">
              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {deal.stage}
              </span>
              <span className="text-sm text-gray-500">
                {deal.clients?.length || 0} clients
              </span>
            </div>
          </Card>
        ))}
      </div>

      <CreateDealDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
```

## Phase 4: Client Management (Day 4)

### Step 11: Client Functions

Create `convex/clients.ts`:
```typescript
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

export const list = query({
  handler: async (ctx) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) return [];

    const agent = await ctx.db
      .query("agents")
      .withIndex("by_clerk", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    if (!agent) return [];

    return await ctx.db
      .query("clients")
      .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
      .order("desc")
      .collect();
  },
});

export const invite = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthenticated");

    const agent = await ctx.db
      .query("agents")
      .withIndex("by_clerk", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    if (!agent) throw new Error("Agent not found");

    // Check if client already exists
    const existing = await ctx.db
      .query("clients")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing && existing.agentId === agent._id) {
      throw new Error("Client already exists");
    }

    const clientId = await ctx.db.insert("clients", {
      ...args,
      agentId: agent._id,
      status: "invited",
      invitedAt: Date.now(),
    });

    // TODO: Send invitation email via Resend/SendGrid

    return clientId;
  },
});
```

### Step 12: Deal-Client Association

Add to `convex/deals.ts`:
```typescript
export const addClient = mutation({
  args: {
    dealId: v.id("deals"),
    clientId: v.id("clients"),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthenticated");

    // Verify ownership of both deal and client
    const deal = await ctx.db.get(args.dealId);
    const client = await ctx.db.get(args.clientId);
    
    if (!deal || !client) throw new Error("Deal or client not found");

    const agent = await ctx.db
      .query("agents")
      .withIndex("by_clerk", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    if (!agent || deal.agentId !== agent._id || client.agentId !== agent._id) {
      throw new Error("Unauthorized");
    }

    // Check if already associated
    const existing = await ctx.db
      .query("dealClients")
      .withIndex("by_both", (q) =>
        q.eq("dealId", args.dealId).eq("clientId", args.clientId)
      )
      .first();

    if (existing) throw new Error("Client already associated with deal");

    return await ctx.db.insert("dealClients", {
      dealId: args.dealId,
      clientId: args.clientId,
      role: args.role,
      addedAt: Date.now(),
    });
  },
});

export const removeClient = mutation({
  args: {
    dealId: v.id("deals"),
    clientId: v.id("clients"),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthenticated");

    const association = await ctx.db
      .query("dealClients")
      .withIndex("by_both", (q) =>
        q.eq("dealId", args.dealId).eq("clientId", args.clientId)
      )
      .first();

    if (!association) throw new Error("Association not found");

    // Verify ownership
    const deal = await ctx.db.get(args.dealId);
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_clerk", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    if (!agent || !deal || deal.agentId !== agent._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(association._id);
  },
});
```

## Phase 5: File Storage (Day 5)

### Step 13: Document Upload Functions

Create `convex/documents.ts`:
```typescript
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthenticated");

    return await ctx.storage.generateUploadUrl();
  },
});

export const saveDocument = mutation({
  args: {
    dealId: v.id("deals"),
    storageId: v.id("_storage"),
    name: v.string(),
    type: v.string(),
    size: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) throw new Error("Unauthenticated");

    const agent = await ctx.db
      .query("agents")
      .withIndex("by_clerk", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    if (!agent) throw new Error("Agent not found");

    // Verify deal ownership
    const deal = await ctx.db.get(args.dealId);
    if (!deal || deal.agentId !== agent._id) {
      throw new Error("Unauthorized");
    }

    return await ctx.db.insert("documents", {
      dealId: args.dealId,
      storageId: args.storageId,
      name: args.name,
      type: args.type,
      size: args.size,
      uploadedBy: agent._id,
      uploadedAt: Date.now(),
    });
  },
});

export const getUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    return await ctx.storage.getUrl(storageId);
  },
});

export const listByDeal = query({
  args: { dealId: v.id("deals") },
  handler: async (ctx, { dealId }) => {
    const identity = await auth.getUserIdentity(ctx);
    if (!identity) return [];

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_deal", (q) => q.eq("dealId", dealId))
      .collect();

    // Get URLs for each document
    return await Promise.all(
      documents.map(async (doc) => ({
        ...doc,
        url: await ctx.storage.getUrl(doc.storageId),
      }))
    );
  },
});
```

### Step 14: File Upload Component

Create `src/components/file-upload.tsx`:
```typescript
"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";

interface FileUploadProps {
  dealId: string;
  onSuccess?: () => void;
}

export function FileUpload({ dealId, onSuccess }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const generateUploadUrl = useMutation(api.documents.generateUploadUrl);
  const saveDocument = useMutation(api.documents.saveDocument);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Get upload URL
      const uploadUrl = await generateUploadUrl();

      // Upload file
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      const { storageId } = await result.json();

      // Save document record
      await saveDocument({
        dealId: dealId as any,
        storageId,
        name: file.name,
        type: file.type,
        size: file.size,
      });

      onSuccess?.();
      if (inputRef.current) inputRef.current.value = "";
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        onChange={handleUpload}
        disabled={uploading}
        className="hidden"
        id="file-upload"
      />
      <Button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        variant="outline"
        size="sm"
      >
        {uploading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Upload className="w-4 h-4" />
        )}
        <span className="ml-2">Upload Document</span>
      </Button>
    </div>
  );
}
```

## Deployment & Next Steps

### Local Development

1. Start Convex dev server:
```bash
npx convex dev
```

2. In another terminal, start Next.js:
```bash
npm run dev
```

### Production Deployment

1. Deploy Convex backend:
```bash
npx convex deploy
```

2. Deploy to Vercel:
```bash
vercel
```

### MVP Feature Checklist

✅ **Phase 1 Complete:**
- [ ] Clerk authentication setup
- [ ] Convex schema defined
- [ ] Basic middleware configured

✅ **Phase 2 Complete:**
- [ ] Agent CRUD operations
- [ ] Deal management functions
- [ ] Client management functions

✅ **Phase 3 Complete:**
- [ ] Dashboard layout
- [ ] Deal list/create UI
- [ ] Client list/invite UI

✅ **Phase 4 Complete:**
- [ ] Deal-client associations
- [ ] Role-based access

✅ **Phase 5 Complete:**
- [ ] Document upload
- [ ] File storage integration

### Next Features to Add

1. **Deal Stages & Pipeline**
   - Visual pipeline view
   - Drag-and-drop stage changes
   - Stage completion tracking

2. **Client Portal**
   - Separate client login
   - View assigned deals
   - Upload documents

3. **Notifications**
   - Email invitations (Resend/SendGrid)
   - In-app notifications
   - Stage change alerts

4. **Analytics Dashboard**
   - Deal conversion metrics
   - Pipeline velocity
   - Client engagement stats

5. **Subscription & Billing**
   - Stripe integration
   - Subscription management
   - Usage limits for trial

### Performance Optimizations

1. **Add Pagination**
   - Deals list pagination
   - Client list pagination
   - Document pagination

2. **Implement Search**
   - Deal search by address/title
   - Client search by name/email
   - Full-text search with Convex

3. **Add Caching**
   - Static data caching
   - Image optimization
   - API response caching

### Security Enhancements

1. **Rate Limiting**
   - API rate limits
   - Upload size limits
   - Request throttling

2. **Data Validation**
   - Zod schemas for all inputs
   - Server-side validation
   - Input sanitization

3. **Audit Logging**
   - Track all mutations
   - User action history
   - Security event logging

## Troubleshooting

### Common Issues

**Clerk + Convex Auth Issues:**
- Ensure JWT template is configured in Clerk dashboard
- Check that Convex auth config matches Clerk settings
- Verify environment variables are set correctly

**File Upload Errors:**
- Check Convex storage limits
- Verify file size limits
- Ensure proper CORS configuration

**Real-time Updates Not Working:**
- Check WebSocket connection
- Verify Convex client setup
- Check browser console for errors

### Development Tips

1. **Use Convex Dashboard:**
   - Monitor function execution
   - View database contents
   - Debug real-time subscriptions

2. **Type Safety:**
   - Always use generated types from `_generated/api`
   - Define value validators with `v`
   - Use TypeScript strict mode

3. **Testing Strategy:**
   - Test Convex functions in isolation
   - Use Convex test environment
   - Mock authentication in tests

## Resources

- [Convex Docs](https://docs.convex.dev)
- [Clerk Docs](https://clerk.com/docs)
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Shadcn UI](https://ui.shadcn.com)
- [Stripe Docs](https://stripe.com/docs)
