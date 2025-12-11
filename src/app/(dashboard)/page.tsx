"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreditCard, ListTodo, Eye, EyeOff } from "lucide-react";
import { useUserProfile } from "@/hooks/use-user-profile";
import Link from "next/link";
import { useFinance, Transaction } from "@/hooks/use-finance";
import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { format, subDays, isSameDay, startOfDay, startOfMonth, startOfYear, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { JarvisAssistant } from "@/components/jarvis/assistant-button";
import { FinanceDashboard } from "@/components/finance/finance-dashboard";

export default function DashboardPage() {
    const time = new Date().getHours();
    const greeting = time < 12 ? "Bom dia" : time < 18 ? "Boa tarde" : "Boa noite";
    const { profile, loading } = useUserProfile();
    const { familyName, wallets, getAnalytics } = useFinance();

    // Privacy State (Default: True as requested)
    const [privacyMode, setPrivacyMode] = useState(true);

    // Analytics State
    const [range, setRange] = useState<'week' | 'month' | 'year'>('week');
    const [analytics, setAnalytics] = useState<{ chartData: any[], expensePie: any[], incomePie: any[] }>({ chartData: [], expensePie: [], incomePie: [] });

    const displayName = loading ? "..." : (profile?.display_name?.split(' ')[0] || "User");

    // Load Analytics
    useMemo(() => {
        let mounted = true;
        async function load() {
            const data = await getAnalytics(range);
            if (mounted) setAnalytics(data);
        }
        load();
        return () => { mounted = false };
    }, [range, getAnalytics]); // Using useMemo as useEffect for async data fetching is tricky with potential infinite loops if dep array is unstable, but getAnalytics is stable. Actually useEffect is better for side effects.

    const totalBalance = wallets.reduce((acc, w) => acc + w.balance, 0);

    const formatCurrency = (value: number) => {
        if (privacyMode) return "R$ •••••";
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

    return (
        <div className="space-y-6 pb-20 md:pb-0">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {profile?.avatar_url && (
                        <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                            <AvatarImage src={profile.avatar_url} alt={displayName} />
                            <AvatarFallback>{displayName[0]}</AvatarFallback>
                        </Avatar>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{greeting}, {displayName}</h1>
                        <p className="text-sm text-muted-foreground">
                            Você faz parte da <span className="font-semibold text-primary">{familyName}</span>
                        </p>
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={() => setPrivacyMode(!privacyMode)}
                    title={privacyMode ? "Mostrar valores" : "Ocultar valores"}
                >
                    {privacyMode ? <EyeOff className="h-5 w-5 text-muted-foreground" /> : <Eye className="h-5 w-5 text-primary" />}
                </Button>
            </div>

            {/* Daily Briefing Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Link href="/finance">
                    <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Financeiro</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
                            <p className="text-xs text-muted-foreground">
                                Saldo total atual
                            </p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/calendar">
                    <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Agenda</CardTitle>
                            <ListTodo className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Ver Agenda</div>
                            <p className="text-xs text-muted-foreground">
                                Gerenciar compromissos
                            </p>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* CHARTS */}
            <div className="space-y-6">
                {/* Bar Chart Row */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-base font-medium">
                            Gastos ({range === 'week' ? 'Semana' : range === 'month' ? 'Mês' : 'Ano'})
                        </CardTitle>
                        <div className="flex bg-muted rounded-md p-0.5">
                            <button onClick={() => setRange('week')} className={`text-xs px-3 py-1.5 rounded-sm transition-all font-medium ${range === 'week' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Semana</button>
                            <button onClick={() => setRange('month')} className={`text-xs px-3 py-1.5 rounded-sm transition-all font-medium ${range === 'month' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Mês</button>
                            <button onClick={() => setRange('year')} className={`text-xs px-3 py-1.5 rounded-sm transition-all font-medium ${range === 'year' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Ano</button>
                        </div>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analytics.chartData}>
                                    <XAxis
                                        dataKey="date_key"
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => {
                                            if (!value) return '';
                                            const date = new Date(value + 'T12:00:00');
                                            if (range === 'year') return format(date, 'MMM', { locale: ptBR });
                                            return format(date, range === 'week' ? 'EEE' : 'dd', { locale: ptBR });
                                        }}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => privacyMode ? "•" : `R$${value}`}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        formatter={(value: number) => [formatCurrency(value), 'Valor']}
                                        labelFormatter={(label) => {
                                            if (!label) return '';
                                            const date = new Date(label + 'T12:00:00');
                                            return format(date, range === 'year' ? 'MMMM yyyy' : "dd 'de' MMM", { locale: ptBR });
                                        }}
                                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                    />
                                    <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                                        {analytics.chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={privacyMode ? "#e5e7eb" : "currentColor"} className="fill-primary" />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Pie Charts Row */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Expense Pie */}
                    <Card className="flex flex-col">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-medium">Despesas por Categoria</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 pb-4">
                            <div className="h-[250px] w-full relative">
                                {analytics.expensePie.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={analytics.expensePie}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {analytics.expensePie.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} strokeWidth={1} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value: number) => privacyMode ? '•••••' : formatCurrency(value)} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-muted-foreground text-sm">Sem dados</div>
                                )}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="text-center">
                                        <span className="text-2xl font-bold">
                                            {privacyMode ? '•' : analytics.expensePie.length}
                                        </span>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Categorias</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 justify-center px-4">
                                {analytics.expensePie.slice(0, 6).map((entry, i) => (
                                    <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || COLORS[i % COLORS.length] }} />
                                        <span>{entry.name}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Income Pie */}
                    <Card className="flex flex-col">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-medium">Receitas por Categoria</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 pb-4">
                            <div className="h-[250px] w-full relative">
                                {analytics.incomePie.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={analytics.incomePie}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {analytics.incomePie.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} strokeWidth={1} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value: number) => privacyMode ? '•••••' : formatCurrency(value)} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-muted-foreground text-sm">Sem dados</div>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 justify-center px-4">
                                {analytics.incomePie.slice(0, 6).map((entry, i) => (
                                    <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || COLORS[i % COLORS.length] }} />
                                        <span>{entry.name}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>


        </div>
    );
}
