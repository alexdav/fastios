import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/signin(.*)',
  '/signup(.*)',
  '/about(.*)',
  '/pricing(.*)',
  '/features(.*)',
  '/contact(.*)',
  '/privacy(.*)',
  '/terms(.*)',
  '/convex(.*)' // Only allow in development
])

export default clerkMiddleware(async (auth, req) => {
  // Block /convex route in production
  if (req.nextUrl.pathname.startsWith('/convex') && process.env.NODE_ENV === 'production') {
    return NextResponse.redirect(new URL('/', req.url))
  }
  
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};