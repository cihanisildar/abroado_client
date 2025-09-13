import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define routes that are completely public (no auth needed for viewing)
const publicRoutes = ['/', '/cities', '/posts', '/rooms'];
// Define routes that require full authentication  
const protectedRoutes = ['/profile', '/settings'];
// Define auth routes
const authRoutes = ['/auth/login', '/auth/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if user has auth tokens
  const accessToken = request.cookies.get('gb_accessToken')?.value;
  const refreshToken = request.cookies.get('gb_refreshToken')?.value;
  
  // A user is considered authenticated if they have a refresh token.
  // The client will handle refreshing the access token.
  const isAuthenticated = Boolean(refreshToken);
  
  // Check route types
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
  
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
  
  const isAuthRoute = authRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
  
  // Check for creation/editing routes that require authentication
  const isActionRoute = pathname.includes('/create') || 
                        pathname.includes('/edit') || 
                        pathname.endsWith('/edit');
  
  // Individual room pages are public for viewing but require auth for interactions
  // Authentication for room interactions is handled at the component level
  const isRoomDetailPage = pathname.match(/^\/rooms\/[^\/]+$/);
  
  // Determine if this is a route that requires authentication
  // Only protected routes and action routes need auth at middleware level
  // Room detail pages allow public viewing but require auth for interactions
  const requiresAuth = isProtectedRoute || isActionRoute;
  
  // Redirect to login for routes that require authentication
  if (requiresAuth && !isAuthenticated) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }
  
  // Redirect authenticated users from auth pages to home
  if (isAuthRoute && isAuthenticated) {
    const redirectTo = request.nextUrl.searchParams.get('redirectTo') || '/';
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg$|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.webp$).*)',
  ],
}; 