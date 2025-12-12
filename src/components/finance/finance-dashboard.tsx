"use client";

import { useFinance } from "@/hooks/use-finance";
import { CreditCardList } from "./credit-card-list";
import { WalletList } from "./wallet-list";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Wallet, ArrowUpCircle, ArrowDownCircle, Users, CreditCard, QrCode, Banknote, ArrowDownNarrowWide, ArrowUpNarrowWide, Sparkles, TrendingUp } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, eachDayOfInterval, eachMonthOfInterval, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useMemo, useEffect } from "react";
import { TransactionForm } from "./transaction-form";
import { FamilySettings } from "./family-settings";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { generateFinanceInsights } from "@/app/actions/finance-ai";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Transaction } from "@/hooks/use-finance";

export function FinanceDashboard() {
    const { wallets, transactions, loading, deleteTransaction } = useFinance();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isFamilyOpen, setIsFamilyOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // New Features State
    const [chartFilter, setChartFilter] = useState<'week' | 'month' | 'year'>('month');
    const [aiInsights, setAiInsights] = useState<any>(null);

    const handleEdit = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setIsFormOpen(true);
    };

    const handleDelete = async () => {
        if (deletingId) {
            await deleteTransaction(deletingId);
            setDeletingId(null);
        }
    };

    const totalBalance = wallets.reduce((acc, w) => acc + w.balance, 0);

    // Calculate totals for month
    const currentMonth = new Date().getMonth();
    const incomeMonth = transactions
        .filter(t => t.type === 'income' && new Date(t.date).getMonth() === currentMonth)
        .reduce((acc, t) => acc + t.amount, 0);
    const expenseMonth = transactions
        .filter(t => t.type === 'expense' && new Date(t.date).getMonth() === currentMonth)
        .reduce((acc, t) => acc + t.amount, 0);

    const sortedTransactions = [...transactions].sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    // Chart Logic
    const chartData = useMemo(() => {
        const now = new Date();
        if (chartFilter === 'year') {
            const months = eachMonthOfInterval({ start: startOfYear(now), end: endOfYear(now) });
            return months.map(month => {
                const monthTrans = transactions.filter(t => isSameMonth(new Date(t.date), month));
                const receita = monthTrans.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
                const despesa = monthTrans.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
                return {
                    name: format(month, 'MMM', { locale: ptBR }),
                    receita,
                    despesa
                };
            });
        } else {
            let start = startOfMonth(now);
            let end = endOfMonth(now);
            if (chartFilter === 'week') {
                start = startOfWeek(now);
                end = endOfWeek(now);
            }
            const days = eachDayOfInterval({ start, end });
            return days.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const dayTrans = transactions.filter(t => t.date === dateStr);
                const receita = dayTrans.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
                const despesa = dayTrans.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
                return {
                    name: format(day, 'dd'),
                    fullDate: format(day, 'dd/MM'),
                    receita,
                    despesa
                };
            });
        }
    }, [transactions, chartFilter]);

    // AI Insight Trigger
    // AI Insight Trigger
    useEffect(() => {
        const checkAndRunAnalysis = async () => {
            if (transactions.length === 0) return;

            const storedData = localStorage.getItem('financeAnalysisData');
            let lastAnalysis = storedData ? JSON.parse(storedData) : null;
            const now = Date.now();
            const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

            // Check for large movement (e.g., > R$ 1000 difference)
            // Note: This is a simple heuristic.
            const hasLargeMovement = lastAnalysis && Math.abs(totalBalance - (lastAnalysis.lastBalance || 0)) > 1000;
            const isOld = !lastAnalysis || (now - (lastAnalysis.timestamp || 0) > ONE_WEEK);

            // If we have recent valid insights and no large movement, use cache
            if (!isOld && !hasLargeMovement && lastAnalysis?.insights) {
                if (!aiInsights) setAiInsights(lastAnalysis.insights);
                return;
            }

            // Otherwise generate new insights
            const metrics = {
                totalBalance,
                incomeMonth,
                expenseMonth,
                transactionCount: transactions.length,
                lastTransaction: transactions[0]?.description
            };

            // Avoid calling if we just called it (handled by aiInsights check if we wanted, but here we force update if condition met)
            try {
                const insights = await generateFinanceInsights(metrics);
                setAiInsights(insights);

                localStorage.setItem('financeAnalysisData', JSON.stringify({
                    timestamp: now,
                    lastBalance: totalBalance,
                    insights
                }));
            } catch (err) {
                console.error("Failed to generate insights", err);
            }
        };

        checkAndRunAnalysis();
    }, [transactions, totalBalance, incomeMonth, expenseMonth]);

    return (
        <div className="space-y-6">
            <TransactionForm
                open={isFormOpen}
                onOpenChange={(open) => {
                    setIsFormOpen(open);
                    if (!open) setEditingTransaction(null);
                }}
                initialData={editingTransaction}
            />

            <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente a transação.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Summary Cards */}
            {/* Summary Cards */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="h-8 w-32 bg-muted animate-pulse rounded-md" />
                        ) : (
                            <div className="text-2xl font-bold">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalBalance)}
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Receitas (Mês)</CardTitle>
                        <ArrowUpCircle className="h-4 w-4 text-[#5cd36b]" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="h-8 w-32 bg-muted animate-pulse rounded-md" />
                        ) : (
                            <div className="text-2xl font-bold text-[#5cd36b]">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(incomeMonth)}
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Despesas (Mês)</CardTitle>
                        <ArrowDownCircle className="h-4 w-4 text-[#e14948]" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="h-8 w-32 bg-muted animate-pulse rounded-md" />
                        ) : (
                            <div className="text-2xl font-bold text-[#e14948]">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expenseMonth)}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Chart Section */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-primary" />
                                Evolução Financeira
                            </CardTitle>
                            <CardDescription>Acompanhe suas receitas e despesas ao longo do tempo</CardDescription>
                        </div>
                        <div className="flex bg-muted rounded-md p-1 self-start md:self-center">
                            <Button
                                variant={chartFilter === 'week' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setChartFilter('week')}
                                className="h-8 text-xs"
                            >Semana</Button>
                            <Button
                                variant={chartFilter === 'month' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setChartFilter('month')}
                                className="h-8 text-xs"
                            >Mês</Button>
                            <Button
                                variant={chartFilter === 'year' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setChartFilter('year')}
                                className="h-8 text-xs"
                            >Ano</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#5cd36b" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#5cd36b" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorDespesa" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#e14948" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#e14948" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                <XAxis
                                    dataKey="name"
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 12, fill: '#888' }}
                                    dy={10}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 12, fill: '#888' }}
                                    tickFormatter={(value) => `R$ ${value}`}
                                    dx={-10}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                                />
                                <Area type="monotone" dataKey="despesa" stroke="#e14948" fillOpacity={1} fill="url(#colorDespesa)" name="Despesas" />
                                <Area type="monotone" dataKey="receita" stroke="#5cd36b" fillOpacity={1} fill="url(#colorReceita)" name="Receitas" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                    <CreditCardList />
                </div>
                <div className="space-y-4">
                    <WalletList />
                </div>
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <h2 className="text-xl font-semibold">Transações Recentes</h2>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}>
                        {sortOrder === 'desc' ? <ArrowDownNarrowWide className="h-4 w-4" /> : <ArrowUpNarrowWide className="h-4 w-4" />}
                    </Button>
                    <Button variant="outline" onClick={() => setIsFamilyOpen(true)} className="flex-1 md:flex-none">
                        <Users className="mr-2 h-4 w-4" /> Família
                    </Button>
                    <Button onClick={() => setIsFormOpen(true)} className="flex-1 md:flex-none">
                        <Plus className="mr-2 h-4 w-4" /> Nova Transação
                    </Button>
                </div>
            </div>

            <FamilySettings open={isFamilyOpen} onOpenChange={setIsFamilyOpen} />

            {/* Transactions List */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-8 text-center text-muted-foreground">Carregando...</div>
                    ) : sortedTransactions.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">Nenhuma transação encontrada.</div>
                    ) : (
                        <div className="divide-y">
                            {sortedTransactions.map((t) => {
                                let bgClass = 'bg-[#92d5b4]'; // Default / Money
                                if (t.credit_card_id || t.payment_method === 'credit') bgClass = 'bg-[#97bfcb]';
                                else if (t.payment_method === 'pix') bgClass = 'bg-[#b49aca]';

                                return (
                                    <div
                                        key={t.id}
                                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                                        onClick={() => handleEdit(t)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white ${bgClass}`}>
                                                {t.credit_card_id || t.payment_method === 'credit' ? (
                                                    <CreditCard className="h-5 w-5" />
                                                ) : t.payment_method === 'pix' ? (
                                                    <QrCode className="h-5 w-5" />
                                                ) : (
                                                    <Banknote className="h-5 w-5" />
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-medium leading-none">{t.description}</p>
                                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                    {format(new Date(t.date), "dd/MM/yy", { locale: ptBR })}
                                                    {t.profiles && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full inline-flex items-center">
                                                                {t.profiles.full_name?.split(' ')[0] || t.profiles.email?.split('@')[0] || "Desconhecido"}
                                                            </span>
                                                        </>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className={`text-sm ${t.type === 'income' ? 'text-[#5cd36b]' : 'text-[#e14948]'}`}>
                                                {t.type === 'income' ? '+' : '-'}
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                                            </div>
                                            <div className="hidden md:block" onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleEdit(t)}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-red-600" onClick={() => setDeletingId(t.id)}>
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Excluir
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
            {/* AI Analysis Section */}
            {aiInsights && (
                <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-indigo-100 dark:border-indigo-900">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                            <Sparkles className="h-5 w-5" />
                            Análise Inteligente do Jarvis
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                                <h4 className="font-semibold text-sm mb-1 text-red-600">Sobre suas Despesas</h4>
                                <p className="text-sm text-muted-foreground">{aiInsights.expensesAnalysis}</p>
                            </div>
                            <div className="p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                                <h4 className="font-semibold text-sm mb-1 text-green-600">Sobre suas Receitas</h4>
                                <p className="text-sm text-muted-foreground">{aiInsights.incomeAnalysis}</p>
                            </div>
                        </div>
                        <div className="p-3 bg-indigo-100/50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                            <h4 className="font-semibold text-sm mb-1 text-indigo-800 dark:text-indigo-200">Resumo do Mês</h4>
                            <p className="text-sm text-indigo-700 dark:text-indigo-300">{aiInsights.overallAnalysis}</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
