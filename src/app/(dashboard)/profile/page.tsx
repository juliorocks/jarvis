"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Shield, Bell, Save } from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [fullName, setFullName] = useState("");
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setFullName(user?.user_metadata?.full_name || "");
            setLoading(false);
        }
        getUser();
    }, [supabase]);

    const handleUpdateProfile = async () => {
        try {
            const { error } = await supabase.auth.updateUser({
                data: { full_name: fullName }
            });

            if (error) throw error;
            toast.success("Perfil atualizado com sucesso!");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao atualizar perfil.");
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Carregando perfil...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Meu Perfil</h2>
                <p className="text-muted-foreground">Gerencie suas informações pessoais e configurações da conta.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Informações Pessoais</CardTitle>
                        <CardDescription>Seus dados de identificação no Jarvis.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex flex-col items-center sm:flex-row gap-6">
                            <Avatar className="h-24 w-24">
                                <AvatarImage src={user?.user_metadata?.avatar_url} />
                                <AvatarFallback className="text-2xl"><User /></AvatarFallback>
                            </Avatar>
                            <div className="space-y-1 text-center sm:text-left">
                                <h3 className="font-medium text-lg">{user?.user_metadata?.full_name || "Usuário"}</h3>
                                <p className="text-sm text-muted-foreground">{user?.email}</p>
                                <Button variant="outline" size="sm" className="mt-2">Alterar Foto</Button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nome Completo</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="name"
                                        className="pl-9"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input id="email" className="pl-9" value={user?.email} disabled />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button onClick={handleUpdateProfile}>
                                <Save className="mr-2 h-4 w-4" /> Salvar Alterações
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Preferências do Sistema</CardTitle>
                            <CardDescription>Configure como o Jarvis interage com você.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-2 border rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                        <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">Notificações</p>
                                        <p className="text-xs text-muted-foreground">Receber alertas de analises semanais</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm">Configurar</Button>
                            </div>

                            <div className="flex items-center justify-between p-2 border rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                        <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">Privacidade</p>
                                        <p className="text-xs text-muted-foreground">Gerenciar uso de dados para IA</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm">Revisar</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
