"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getAdminStats } from "@/app/actions/admin";
import { Users, UserCheck, UserX, Clock, ShieldAlert, ArrowUpRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function load() {
            try {
                const data = await getAdminStats();
                setStats(data);
            } catch (e) {
                console.error(e);
                setError("Acesso negado ou erro ao carregar dados.");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    if (loading) return <div className="p-8 text-center">Carregando painel administrativo...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Painel Administrativo</h1>
                    <p className="text-muted-foreground">Visão geral do sistema e métricas.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button asChild>
                        <Link href="/admin/users">Gerenciar Usuários</Link>
                    </Button>
                </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalUsers}</div>
                        <p className="text-xs text-muted-foreground">Cadastrados no sistema</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ativos</CardTitle>
                        <UserCheck className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeUsers}</div>
                        <p className="text-xs text-muted-foreground">Assinaturas e Trial ativos</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Em Trial</CardTitle>
                        <Clock className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.trialUsers}</div>
                        <p className="text-xs text-muted-foreground">Período de teste de 7 dias</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Suspensos</CardTitle>
                        <ShieldAlert className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.suspendedUsers}</div>
                        <p className="text-xs text-muted-foreground">Sem pagamento ou bloqueados</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Users List */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Novos Usuários</CardTitle>
                        <CardDescription>
                            Usuários que entraram recentemente na plataforma.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {stats.newUsers.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Nenhum usuário recente.</p>
                            ) : (
                                stats.newUsers.map((user: any) => (
                                    <div key={user.id} className="flex items-center">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={user.avatar_url} alt="Avatar" />
                                            <AvatarFallback>{user.full_name?.[0] || "U"}</AvatarFallback>
                                        </Avatar>
                                        <div className="ml-4 space-y-1">
                                            <p className="text-sm font-medium leading-none">{user.full_name || "Sem Nome"}</p>
                                            <p className="text-sm text-muted-foreground">{user.email}</p>
                                        </div>
                                        <div className="ml-auto font-medium text-sm flex flex-col items-end">
                                            <span className={`px-2 py-0.5 rounded-full text-xs ${user.plan_status === 'active' ? 'bg-green-100 text-green-700' :
                                                    user.plan_status === 'suspended' ? 'bg-red-100 text-red-700' : 'bg-gray-100'
                                                }`}>
                                                {user.plan_type}
                                            </span>
                                            {user.created_at || user.updated_at ? (
                                                <span className="text-xs text-muted-foreground mt-1">
                                                    {formatDistanceToNow(new Date(user.created_at || user.updated_at), { addSuffix: true, locale: ptBR })}
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Future Chart or Quick Actions */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Ações Rápidas</CardTitle>
                        <CardDescription>Gerenciamento do sistema</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-2">
                        <Button variant="outline" className="justify-start">
                            <ArrowUpRight className="mr-2 h-4 w-4" />
                            Gerar Link de Pagamento
                        </Button>
                        <Button variant="outline" className="justify-start">
                            <ShieldAlert className="mr-2 h-4 w-4" />
                            Revisar Suspensões
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
