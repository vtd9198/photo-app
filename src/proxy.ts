import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
    "/feed(.*)",
    "/profile(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
    if (isProtectedRoute(req)) {
        // Lock the feed until March 20, 2026, 6 PM Poland time (CET/CEST)
        // TO RELOCK: Set year back to 2026
        const eventDate = new Date("2024-03-20T18:00:00+01:00").getTime();
        const now = Date.now();

        if (now < eventDate) {
            return Response.redirect(new URL("/", req.url));
        }

        const authObj = await auth();
        if (!authObj.userId) {
            return Response.redirect(new URL("/", req.url));
        }
    }
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};

