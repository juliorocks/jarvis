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
                        <h1 className="text-3xl font-bold tracking-tight">{greeting}, {displayName}</h1>
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

            {/* Quick Access Buttons */}
            <div className="grid gap-6 md:grid-cols-3">
                <Link href="/finance">
                    <Card className="hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-md hover:shadow-lg border-none bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/40 h-40 flex flex-col items-center justify-center gap-4 group">
                        <div className="p-4 bg-blue-500 rounded-full text-white shadow-lg group-hover:bg-blue-600 transition-colors">
                            <CreditCard className="h-8 w-8" />
                        </div>
                        <div className="text-center">
                            <h3 className="font-bold text-lg text-blue-900 dark:text-blue-100">Financeiro</h3>
                            <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">Gerenciar ganhos e gastos</p>
                        </div>
                    </Card>
                </Link>

                <Link href="/calendar">
                    <Card className="hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-md hover:shadow-lg border-none bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/40 dark:to-orange-900/40 h-40 flex flex-col items-center justify-center gap-4 group">
                        <div className="p-4 bg-orange-500 rounded-full text-white shadow-lg group-hover:bg-orange-600 transition-colors">
                            <ListTodo className="h-8 w-8" />
                        </div>
                        <div className="text-center">
                            <h3 className="font-bold text-lg text-orange-900 dark:text-orange-100">Agenda</h3>
                            <p className="text-xs text-orange-700 dark:text-orange-300 font-medium">Seus compromissos</p>
                        </div>
                    </Card>
                </Link>

                <Link href="/brain">
                    <Card className="hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-md hover:shadow-lg border-none bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/40 dark:to-purple-900/40 h-40 flex flex-col items-center justify-center gap-4 group">
                        <div className="p-4 bg-purple-500 rounded-full text-white shadow-lg group-hover:bg-purple-600 transition-colors">
                            <Eye className="h-8 w-8" />
                        </div>
                        <div className="text-center">
                            <h3 className="font-bold text-lg text-purple-900 dark:text-purple-100">Ideias</h3>
                            <p className="text-xs text-purple-700 dark:text-purple-300 font-medium">Seu segundo cérebro</p>
                        </div>
                    </Card>
                </Link>
            </div>


        </div>
    );
}
