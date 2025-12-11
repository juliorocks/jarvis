"use client";

import { useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Chrome, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const supabase = createClient();
    const router = useRouter();
    const searchParams = useSearchParams();
    const returnUrl = searchParams.get("returnUrl") || "/finance";

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        // Construct redirect URL with the next path
        const redirectTo = new URL('/auth/callback', location.origin);
        redirectTo.searchParams.set('next', returnUrl);

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: redirectTo.toString(),
            },
        });

        if (error) {
            setMessage({ type: 'error', text: error.message });
        } else {
            setMessage({ type: 'success', text: "Link de acesso enviado para seu e-mail!" });
        }
        setLoading(false);
    };

    const handleGoogleLogin = async () => {
        const redirectTo = new URL('/auth/callback', location.origin);
        redirectTo.searchParams.set('next', returnUrl);

        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: redirectTo.toString(),
                scopes: 'https://www.googleapis.com/auth/calendar',
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        });
    };

    return (
        <Card className="w-full max-w-md shadow-xl border-none ring-1 ring-gray-200 dark:ring-gray-800">
            <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-2xl font-bold tracking-tight">Jarvis</CardTitle>
                <CardDescription>
                    Entre para acessar seu assistente pessoal
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <Button variant="outline" onClick={handleGoogleLogin} className="w-full relative h-12">
                    <Chrome className="mr-2 h-4 w-4" />
                    Entrar com Google
                </Button>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or</span>
                    </div>
                </div>

                <form onSubmit={handleLogin} className="grid gap-4">
                    <div className="grid gap-2">
                        <Input
                            id="email"
                            placeholder="nome@exemplo.com"
                            type="email"
                            autoCapitalize="none"
                            autoComplete="email"
                            autoCorrect="off"
                            disabled={loading}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="h-12"
                        />
                    </div>
                    <Button disabled={loading || !email} className="h-12">
                        {loading && <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
                        <Mail className="mr-2 h-4 w-4" /> Entrar com Email
                    </Button>
                </form>

                {message && (
                    <div className={`text-sm text-center p-2 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {message.text}
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-2 text-center text-sm text-muted-foreground">
                <p>Ao continuar, você concorda com nossos Termos de Serviço.</p>
            </CardFooter>
        </Card>
    );
}

export default function LoginPage() {
    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50 dark:bg-zinc-950">
            <Suspense fallback={<div className="text-center">Carregando...</div>}>
                <LoginForm />
            </Suspense>
        </div>
    );
}
