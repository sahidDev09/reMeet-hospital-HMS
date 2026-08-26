import { clerkMiddleware } from '@clerk/nextjs/server'

/**
 * Next 16 renamed `middleware.ts` to `proxy.ts`.
 *
 * `clerkMiddleware()` runs unconditionally because Clerk needs it in the request
 * path to attach auth context — but it deliberately does no route gating here.
 * Clerk has deprecated `createRouteMatcher`, and matching route patterns in one
 * file is how a protected page quietly becomes public when someone adds a route
 * and forgets to update the list. Each protected resource calls
 * `await auth.protect()` itself, so protection lives with the thing it protects.
 */
export default clerkMiddleware()

export const config = {
  matcher: [
    // Everything except Next internals and static assets.
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
