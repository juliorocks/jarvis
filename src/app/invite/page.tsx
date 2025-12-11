"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

function InviteContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");
    const supabase = createClient();

    const [loading, setLoading] = useState(true);
    const [invite, setInvite] = useState<any>(null);
    const [ownerName, setOwnerName] = useState<string>("");
    const [currentUserName, setCurrentUserName] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<'valid' | 'accepting' | 'success' | 'error'>('valid');

    useEffect(() => {
        const checkInvite = async () => {
            if (!token) {
                setError("Token de convite inválido ou ausente.");
                setLoading(false);
                return;
            }

            // 1. Fetch Invite + Family Info via RPC (Public)
            const { data: rawData, error: inviteError } = await supabase
                .rpc('get_invite_details', { lookup_token: token })
                .single();

            const inviteData = rawData as any;

            console.log("Invite Data:", inviteData);
            console.log("Invite Error:", inviteError);

            if (inviteError || !inviteData) {
                console.error(inviteError);
                if (inviteError?.message?.includes("function") || inviteError?.message?.includes("rpc")) {
                    setError("Erro de configuração: Função de convite não encontrada no banco de dados.");
                } else {
                    setError("Convite não encontrado ou expirado.");
                }
                setLoading(false);
                return;
            }

            if (inviteData.status !== 'pending') {
                setError("Este convite já foi aceito ou expirou.");
                setLoading(false);
                return;
            }

            setInvite(inviteData);

            // 2. Set Owner Name (Coming from RPC)
            if (inviteData.owner_name) {
                setOwnerName(inviteData.owner_name);
            }

            // 3. Fetch Current User (if logged in)
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                // Check if they have a profile name
                const { data: userData } = await supabase
                    .from("profiles")
                    .select("full_name")
                    .eq("id", session.user.id)
                    .single();

                setCurrentUserName(userData?.full_name || session.user.email?.split('@')[0] || "");
            }

            setLoading(false);
        };

        checkInvite();
    }, [token, supabase]);

    const handleAccept = async () => {
        if (!invite) return;
        setStatus('accepting');

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            // Store return URL/token
            const returnUrl = encodeURIComponent(window.location.href);
            router.push(`/login?returnUrl=${returnUrl}`);
            return;
        }

        // 1. Add to members
        const { error: memberError } = await supabase
            .from("family_members")
            .insert([{
                family_id: invite.family_id,
                user_id: session.user.id,
                role: 'member'
            }]);

        if (memberError) {
            // Normalize error code (Supabase returns code as string)
            const isDuplicate = memberError.code === '23505' || memberError.message?.includes('duplicate key');

            if (!isDuplicate) {
                console.error(memberError);
                setError("Erro ao entrar na família. " + memberError.message);
                setStatus('error');
                return;
            }
            // If duplicate (already member), proceed to update status
        }

        // 2. Update invite status
        await supabase
            .from("invitations")
            .update({ status: 'accepted' })
            .eq("id", invite.id);

        setStatus('success');
        setTimeout(() => {
            router.push("/finance");
        }, 2000);
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center space-y-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground animate-pulse">Verificando convite...</p>
                </div>
            </div>
        );
    }

    if (error || !invite) {
        return (
            <div className="h-screen flex items-center justify-center p-4 bg-gray-50">
                <Card className="w-full max-w-md border-destructive shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <XCircle /> Convite Inválido
                        </CardTitle>
                        <CardDescription className="text-base">{error}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" className="w-full" onClick={() => router.push("/")}>Voltar ao Início</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="h-screen flex items-center justify-center p-4 bg-gray-50">
                <Card className="w-full max-w-md border-green-500 shadow-lg animate-in fade-in zoom-in-95 duration-300">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="h-6 w-6" /> Bem-vindo!
                        </CardTitle>
                        <CardDescription className="text-base">
                            Você agora faz parte da família <strong>{invite.family_name}</strong>.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500 mb-4 flex items-center gap-2">
                            <Loader2 className="h-3 w-3 animate-spin" /> Acessando o painel...
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="h-screen flex items-center justify-center p-4 bg-gray-50">
            <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">
                        {currentUserName ? `Olá, ${currentUserName}!` : "Olá!"}
                    </CardTitle>
                    <CardDescription className="text-base pt-2">
                        <span className="font-semibold text-foreground">{ownerName || "Alguém"}</span> da família <span className="font-semibold text-foreground">{invite.family_name}</span> convidou você para fazer parte dela no Jarvis.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    <div className="p-4 bg-muted/50 rounded-lg text-sm border space-y-1">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Família:</span>
                            <span className="font-medium">{invite.family_name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Convite para:</span>
                            <span className="font-medium">{invite.email}</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Button className="w-full text-base py-6" onClick={handleAccept} disabled={status === 'accepting'}>
                            {status === 'accepting' ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Aceitar e Entrar"}
                        </Button>
                        {!currentUserName && (
                            <p className="text-xs text-center text-muted-foreground">
                                Você precisará fazer login ou criar conta.
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function InvitePage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <InviteContent />
        </Suspense>
    )
}
