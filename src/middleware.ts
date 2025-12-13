import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // Basic Supabase Client setup for Middleware
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Protect Dashboard Routes
    if (!user && !request.nextUrl.pathname.startsWith('/login') && !request.nextUrl.pathname.startsWith('/auth') && !request.nextUrl.pathname.startsWith('/invite')) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Redirect Logged-In users away from Login page
    if (user && request.nextUrl.pathname.startsWith('/login')) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    // -------------------------------------------------------------------------
    // SaaS Enforcement (SaaS Logic)
    // -------------------------------------------------------------------------
    if (user) {
        // Fetch Profile for Role and Plan Status
        // Note: We use the single() query to get the profile.
        // Optimization: In a high-scale app, consider Claim-based auth (Custom Claims) to avoid DB hit here.
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, plan_status, plan_type, trial_ends_at')
            .eq('id', user.id)
            .single()

        // 1. Admin Route Protection
        if (request.nextUrl.pathname.startsWith('/admin')) {
            if (profile?.role !== 'admin') {
                // Not authorized
                return NextResponse.redirect(new URL('/', request.url))
            }
        }

        // 2. Plan Status Enforcement (Block access if expired/suspended)
        // Exclude /subscription/expired and /account (maybe?) and /admin (if admin is suspended? unlikely)
        if (!request.nextUrl.pathname.startsWith('/subscription/expired') && !request.nextUrl.pathname.startsWith('/auth')) {

            // Check manual suspension
            if (profile?.plan_status === 'suspended' || profile?.plan_status === 'expired') {
                return NextResponse.redirect(new URL('/subscription/expired', request.url))
            }

            // Check Trial Expiration
            if (profile?.plan_type === 'trial' && profile?.trial_ends_at) {
                const trialEnd = new Date(profile.trial_ends_at).getTime();
                const now = Date.now();
                if (now > trialEnd) {
                    // Trial Expired
                    // Ideally we should update the DB here, but Middleware shouldn't do writes strictly.
                    // We just block access. The UI/Admin will see it as expired effectively by date.
                    return NextResponse.redirect(new URL('/subscription/expired', request.url))
                }
            }

            // Explicit trial_expired status
            if (profile?.plan_status === 'trial_expired') {
                return NextResponse.redirect(new URL('/subscription/expired', request.url))
            }
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - manifest.ts (PWA manifest)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|manifest.ts).*)',
    ],
}
