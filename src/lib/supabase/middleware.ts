import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Public routes that don't need auth
  const publicRoutes = ['/login', '/auth/callback', '/auth/confirm'];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // If not authenticated and not on a public route, redirect to login
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If authenticated and on login page, redirect to appropriate dashboard
  if (user && pathname === '/login') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const url = request.nextUrl.clone();
    if (profile?.role === 'candidate') {
      url.pathname = '/c/dashboard';
    } else {
      url.pathname = '/a/dashboard';
    }
    return NextResponse.redirect(url);
  }

  // If authenticated, enforce role-based access
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // Redirect root to appropriate dashboard
    if (pathname === '/') {
      const url = request.nextUrl.clone();
      if (profile?.role === 'candidate') {
        url.pathname = '/c/dashboard';
      } else {
        url.pathname = '/a/dashboard';
      }
      return NextResponse.redirect(url);
    }

    // Block candidates from admin routes
    if (pathname.startsWith('/a/') && profile?.role === 'candidate') {
      const url = request.nextUrl.clone();
      url.pathname = '/c/dashboard';
      return NextResponse.redirect(url);
    }

    // Block admins from candidate routes
    if (pathname.startsWith('/c/') && profile?.role !== 'candidate') {
      const url = request.nextUrl.clone();
      url.pathname = '/a/dashboard';
      return NextResponse.redirect(url);
    }

    // Block evaluators from super-admin-only settings
    if (pathname.startsWith('/a/settings') && profile?.role === 'evaluator') {
      const url = request.nextUrl.clone();
      url.pathname = '/a/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
