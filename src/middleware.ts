import { authMiddleware } from "@clerk/nextjs";

// Clerk is present but unused for V0-V2.
// All routes are public - no authentication required.
export default authMiddleware({
  publicRoutes: ['/(.*)']
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)", '/__clerk/:path*'],
};
