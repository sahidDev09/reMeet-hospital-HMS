import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Next.js request proxy / middleware.
 *
 * Route gating is performed in layout boundaries (e.g. `app/(app)/layout.tsx` via `auth.protect()`),
 * ensuring protected resources live explicitly with the layouts they guard.
 */
export default function proxy(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Everything except Next internals and static assets.
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
