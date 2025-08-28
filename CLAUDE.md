# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run types` - Run TypeScript type checking
- `npm run format:write` - Format code with Prettier
- `npm run clean` - Run both lint:fix and format:write

### Convex Backend
- `npx convex dev` - Start Convex development server
- `npx convex deploy` - Deploy to production
- `npx convex dashboard` - Open Convex dashboard

Convex rules: @docs/convex_rules.txt

### Testing
- `npm run test` - Run all tests (unit + e2e)
- `npm run test:unit` - Run Jest unit tests
- `npm run test:e2e` - Run Playwright e2e tests

### Shadcn UI Components
- `npx shadcn@latest add [component-name]` - Install new Shadcn UI components

### Stripe Webhook Testing (Local Development)
To test Stripe webhooks locally, you need to run the Stripe CLI to forward webhooks to your local server:

1. **Start the webhook forwarding** (in a separate terminal):
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhooks
   ```

2. **Copy the webhook signing secret** that appears (starts with `whsec_`) and update `.env.local`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

3. **Trigger test events** (in another terminal):
   ```bash
   stripe trigger payment_intent.succeeded
   stripe trigger customer.subscription.created
   stripe trigger customer.subscription.updated
   ```

**Important**: The webhook signing secret changes each time you run `stripe listen`, so you need to update `.env.local` each time you restart the webhook forwarding.

## Architecture

This is a Next.js 15 application using Convex as the backend database and real-time sync platform, with Clerk for authentication.

### Route Structure
- `/app/(authenticated)` - Protected routes requiring Clerk auth
  - `dashboard` - Main dashboard page
  - `layout.tsx` - Authenticated layout with navigation
- `/app/(debug)` - Debug routes
  - `convex` - Convex dashboard debugging page
- `/app/api` - API routes including Stripe webhook handler

### Key Patterns
- **Convex Functions** in `/convex` for all backend logic (queries, mutations, actions)
- **Database Schema** in `/convex/schema.ts` using Convex's type-safe schema definition
- **UI Components** in `/components/ui` from Shadcn UI library  
- **Authentication** handled by Clerk with Convex integration for user management
- **Real-time Updates** via Convex's reactive queries with automatic UI updates
- **Payments** integrated via Stripe with webhook handling

### Data Flow
1. Authentication state managed by Clerk (`@clerk/nextjs`)
2. User data synced to Convex via webhook integration
3. All data stored in Convex's transactional database
4. Real-time subscriptions push updates to clients automatically
5. Convex functions handle all data mutations with built-in auth checks

### Environment Variables Required
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key
- `CLERK_SECRET_KEY` - Clerk secret key
- `NEXT_PUBLIC_CONVEX_URL` - Convex deployment URL
- `CONVEX_DEPLOY_KEY` - Convex deployment key
- `STRIPE_SECRET_KEY` - Stripe secret key (if using payments)
