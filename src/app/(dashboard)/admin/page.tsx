"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getAdminStats } from "@/app/actions/admin";
import { Users, UserCheck, UserX, Clock, ShieldAlert, TrendingUp, CreditCard, Package } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

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

    if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Carregando painel administrativo...</div>;
    if (error) return <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg mx-8 mt-8">{error}</div>;

    // Data for Pie Chart
    const pieData = [
        { name: 'Trial', value: stats.trialUsers, color: '#3b82f6' }, // Blue
        { name: 'Individual', value: stats.activeUsers - stats.trialUsers, color: '#22c55e' }, // Green (Approx)
        { name: 'Suspensos', value: stats.suspendedUsers, color: '#ef4444' }, // Red
    ].filter(d => d.value > 0);

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Painel Administrativo</h1>
                    <p className="text-muted-foreground mt-1">Visão geral do sistema, métricas e crescimento.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button asChild className="rounded-full shadow-sm">
                        <Link href="/admin/users">
                            <Users className="mr-2 h-4 w-4" />
                            Gerenciar Usuários
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-card hover:shadow-md transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total de Usuários</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                            <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalUsers}</div>
                        <p className="text-xs text-muted-foreground mt-1">Cadastrados no sistema</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-card hover:shadow-md transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Assinaturas Ativas</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.activeUsers}</div>
                        <p className="text-xs text-muted-foreground mt-1">Planos em dia</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-card hover:shadow-md transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Em Período Trial</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.trialUsers}</div>
                        <p className="text-xs text-muted-foreground mt-1">Testando a plataforma</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-card hover:shadow-md transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Suspensos</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.suspendedUsers}</div>
                        <p className="text-xs text-muted-foreground mt-1">Ação requerida</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid gap-6 md:grid-cols-7">
                {/* Growth Chart */}
                <Card className="col-span-4 border-none shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-card p-2">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-green-500" />
                            Crescimento de Usuários
                        </CardTitle>
                        <CardDescription>Novos cadastros nos últimos 6 meses</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-0">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: '#6B7280' }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: '#6B7280' }}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="total"
                                        stroke="#6366f1"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorTotal)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Plan Distribution Chart */}
                <Card className="col-span-3 border-none shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-card p-2">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Package className="h-5 w-5 text-blue-500" />
                            Distribuição de Planos
                        </CardTitle>
                        <CardDescription>Status atual da base</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full flex items-center justify-center">
                            {pieData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-muted-foreground text-sm">Sem dados suficientes</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Users List */}
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-card">
                <CardHeader>
                    <CardTitle>Novos Usuários</CardTitle>
                    <CardDescription>
                        Usuários que entraram recentemente na plataforma.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {stats.newUsers.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">Nenhum usuário recente.</p>
                        ) : (
                            stats.newUsers.map((user: any) => (
                                <div key={user.id} className="flex items-center justify-between group hover:bg-gray-50 dark:hover:bg-zinc-800/50 p-2 rounded-xl transition-colors -mx-2">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-10 w-10 border border-gray-100">
                                            <AvatarImage src={user.avatar_url} alt="Avatar" />
                                            <AvatarFallback>{user.full_name?.[0] || "U"}</AvatarFallback>
                                        </Avatar>
                                        <div className="space-y-1">
                                            <p className="text-sm font-semibold leading-none text-gray-900 dark:text-gray-100">{user.full_name || "Sem Nome"}</p>
                                            <p className="text-xs text-muted-foreground">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-1">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${user.plan_status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                user.plan_status === 'suspended' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                    'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                            }`}>
                                            {user.plan_type}
                                        </span>
                                        {user.created_at || user.updated_at ? (
                                            <span className="text-[10px] text-muted-foreground">
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
        </div>
    );
}
