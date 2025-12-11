import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const cookieStore = cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch {
                            // The `setAll` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing
                            // user sessions.
                        }
                    },
                },
            }
        )
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            const forwardedHost = request.headers.get('x-forwarded-host')
            // Store provider token in a cookie that client can read (not httpOnly)
            // so we can access it for Google Calendar API calls
            if (data.session?.provider_token) {
                cookies().set('google_provider_token', data.session.provider_token, {
                    path: '/',
                    maxAge: 3600, // 1 hour
                    sameSite: 'lax',
                    secure: process.env.NODE_ENV === 'production',
                    httpOnly: false
                })
            }

            const isLocalEnv = process.env.NODE_ENV === 'development'

            let redirectUrl = next;
            if (!next.startsWith('http')) {
                // If relative, prepend origin (or forwarded host logic if needed)
                if (isLocalEnv) {
                    redirectUrl = `${origin}${next}`;
                } else if (forwardedHost) {
                    redirectUrl = `https://${forwardedHost}${next}`;
                } else {
                    redirectUrl = `${origin}${next}`;
                }
            }

            return NextResponse.redirect(redirectUrl);
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
