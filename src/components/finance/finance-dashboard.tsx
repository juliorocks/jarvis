"use client";

import { useFinance } from "@/hooks/use-finance";
import { CreditCardList } from "./credit-card-list";
import { WalletList } from "./wallet-list";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Wallet, ArrowUpCircle, ArrowDownCircle, Users, CreditCard, QrCode, Banknote, ArrowDownNarrowWide, ArrowUpNarrowWide, Sparkles, TrendingUp } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, eachDayOfInterval, eachMonthOfInterval, isSameMonth, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useMemo, useEffect } from "react";
import { TransactionForm } from "./transaction-form";
import { FamilySettings } from "./family-settings";
import { MoreHorizontal, Edit, Trash2, ChevronDown, Eye, EyeOff, Coins, CalendarDays, CalendarClock, CalendarRange, Calendar } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { generateFinanceInsights } from "@/app/actions/finance-ai";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Transaction } from "@/hooks/use-finance";

export function FinanceDashboard() {
    const { wallets, transactions, categories, creditCards, loading, deleteTransaction } = useFinance();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isFamilyOpen, setIsFamilyOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [showBalance, setShowBalance] = useState(true); // New state for visibility

    // New Features State
    // Filters State
    const [periodFilter, setPeriodFilter] = useState<'day' | 'week' | 'month' | 'year'>('month');
    const [aiInsights, setAiInsights] = useState<any>(null);

    // Category/Source Filters
    const [incomeCategoryId, setIncomeCategoryId] = useState<string>('all');
    const [incomeWalletId, setIncomeWalletId] = useState<string>('all');
    const [expenseCategoryId, setExpenseCategoryId] = useState<string>('all');
    const [expenseSourceId, setExpenseSourceId] = useState<string>('all');

    // Filtered Transactions Calculation
    const filteredTransactions = useMemo(() => {
        const now = new Date();
        const startDay = startOfDay(now);
        const endDay = endOfDay(now);
        const startWk = startOfWeek(now);
        const endWk = endOfWeek(now);
        const startMth = startOfMonth(now);
        const endMth = endOfMonth(now);
        const startYr = startOfYear(now);
        const endYr = endOfYear(now);

        return transactions.filter(t => {
            const tDate = new Date(t.date);
            const tTime = tDate.getTime();

            // 1. Date Filter
            let dateMatch = false;
            if (periodFilter === 'day') {
                // Check if same day (ignoring time mostly, but t.date string usually yyyy-mm-dd or iso)
                // Assuming t.date is YYYY-MM-DD string as per logic below, simple check:
                const tDateStr = format(tDate, 'yyyy-MM-dd');
                const nowDateStr = format(now, 'yyyy-MM-dd');
                dateMatch = tDateStr === nowDateStr;
            } else if (periodFilter === 'week') {
                dateMatch = tTime >= startWk.getTime() && tTime <= endWk.getTime();
            } else if (periodFilter === 'month') {
                dateMatch = tTime >= startMth.getTime() && tTime <= endMth.getTime();
            } else if (periodFilter === 'year') {
                dateMatch = tTime >= startYr.getTime() && tTime <= endYr.getTime();
            }

            if (!dateMatch) return false;

            // 2. Category/Source Filters
            if (t.type === 'income') {
                if (incomeCategoryId !== 'all' && t.category_id !== incomeCategoryId) return false;
                if (incomeWalletId !== 'all' && t.wallet_id !== incomeWalletId) return false;
                return true;
            } else if (t.type === 'expense') {
                if (expenseCategoryId !== 'all' && t.category_id !== expenseCategoryId) return false;

                if (expenseSourceId !== 'all') {
                    const [sourceType, sourceId] = expenseSourceId.split(':');
                    if (sourceType === 'card') {
                        if (t.credit_card_id !== sourceId) return false;
                    } else if (sourceType === 'wallet') {
                        if (t.wallet_id !== sourceId) return false;
                    }
                }
                return true;
            }
            return true;
        });
    }, [transactions, periodFilter, incomeCategoryId, incomeWalletId, expenseCategoryId, expenseSourceId]);

    const totalBalance = wallets.reduce((acc, w) => acc + w.balance, 0);

    // Calculate totals for selected period
    const incomeTotal = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((acc, t) => acc + t.amount, 0);
    const expenseTotal = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => acc + t.amount, 0);

    const sortedTransactions = [...filteredTransactions].sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    // Chart Logic (Area Chart - Evolution)
    const chartData = useMemo(() => {
        const now = new Date();
        // If Period is Year -> Show Months
        // If Period is Month -> Show Days of Month
        // If Period is Week -> Show Days of Week
        // If Period is Day -> Kind of redundant but show Hourly if possible or just single bar? Let's show Week view for context but highlight day? 
        // Or actually, just rely on the 'periodFilter' logic requested. Usually charts follow the period.

        // Simplification: 
        // If 'year' -> months x-axis.
        // If 'month' -> days x-axis.
        // If 'week' -> days x-axis.
        // If 'day' -> maybe just show that day? Or show the week for context?

        let interval: { start: Date, end: Date } = { start: startOfMonth(now), end: endOfMonth(now) };
        let resolution: 'day' | 'month' = 'day';

        if (periodFilter === 'year') {
            interval = { start: startOfYear(now), end: endOfYear(now) };
            resolution = 'month';
        } else if (periodFilter === 'week') {
            interval = { start: startOfWeek(now), end: endOfWeek(now) };
            resolution = 'day';
        } else if (periodFilter === 'day') {
            // For Day, showing just one point in Area chart is weird. Let's show the Week but maybe we only filter the list for the day?
            // Actually user asked for "First filter". If I filter the LIST by day, the CHART should probably reflect that scope or context.
            // If I show only 1 day on chart, it's a dot. 
            // Let's stick to: Chart mimics the filter scope fully.
            interval = { start: startOfDay(now), end: endOfDay(now) };
            resolution = 'day'; // Only 1 point
        }

        if (resolution === 'month') {
            const months = eachMonthOfInterval(interval);
            return months.map(month => {
                // Note: We need to use ALL transactions for this historical view, filtering only by TYPE, not the specific filters of categories?
                // The user usually expects the chart to show "Trend of Expenses", filtered by "Food" over the year.
                // So I MUST use 'transactions' but filter them by the category filters manually here?
                // OR re-use logic.
                // Re-using logic is expensive inside map.
                // Let's optimize: Filter 'transactions' by CAT/SOURCE first (static filters), then bucket by date.

                // 1. Apply Cat/Source Filters to ALL transactions
                const relevantTrans = transactions.filter(t => {
                    // logic copied from above effectively
                    if (t.type === 'income') {
                        if (incomeCategoryId !== 'all' && t.category_id !== incomeCategoryId) return false;
                        if (incomeWalletId !== 'all' && t.wallet_id !== incomeWalletId) return false;
                    } else if (t.type === 'expense') {
                        if (expenseCategoryId !== 'all' && t.category_id !== expenseCategoryId) return false;
                        if (expenseSourceId !== 'all') {
                            const [sourceType, sourceId] = expenseSourceId.split(':');
                            if (sourceType === 'card' && t.credit_card_id !== sourceId) return false;
                            if (sourceType === 'wallet' && t.wallet_id !== sourceId) return false;
                        }
                    }
                    return true;
                });

                const monthTrans = relevantTrans.filter(t => isSameMonth(new Date(t.date), month));
                const receita = monthTrans.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
                const despesa = monthTrans.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
                return { name: format(month, 'MMM', { locale: ptBR }), receita, despesa };
            });
        } else {
            // Day resolution
            const days = eachDayOfInterval(interval);
            // 1. Apply Cat/Source Filters (same as above)
            const relevantTrans = transactions.filter(t => {
                if (t.type === 'income') {
                    if (incomeCategoryId !== 'all' && t.category_id !== incomeCategoryId) return false;
                    if (incomeWalletId !== 'all' && t.wallet_id !== incomeWalletId) return false;
                } else if (t.type === 'expense') {
                    if (expenseCategoryId !== 'all' && t.category_id !== expenseCategoryId) return false;
                    if (expenseSourceId !== 'all') {
                        const [sourceType, sourceId] = expenseSourceId.split(':');
                        if (sourceType === 'card' && t.credit_card_id !== sourceId) return false;
                        if (sourceType === 'wallet' && t.wallet_id !== sourceId) return false;
                    }
                }
                return true;
            });

            return days.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const dayTrans = relevantTrans.filter(t => t.date === dateStr);
                const receita = dayTrans.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
                const despesa = dayTrans.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
                return { name: format(day, 'dd'), fullDate: format(day, 'dd/MM'), receita, despesa };
            });
        }
    }, [transactions, periodFilter, incomeCategoryId, incomeWalletId, expenseCategoryId, expenseSourceId]);

    // Category Pie Chart Logic (Uses filteredTransactions to match the view)
    const categoryData = useMemo(() => {
        // Use filteredTransactions directly so it matches the list and totals!
        const expenses = filteredTransactions.filter(t => t.type === 'expense');

        const categoryMap: Record<string, number> = {};
        expenses.forEach(t => {
            const catName = t.category?.name || 'Outros';
            categoryMap[catName] = (categoryMap[catName] || 0) + t.amount;
        });

        const COLORS = ['#8884d8', '#00C49F', '#FFBB28', '#FF8042', '#a05195', '#d45087'];
        return Object.entries(categoryMap)
            .sort(([, a], [, b]) => b - a)
            .map(([name, value], index) => ({ name, value, color: COLORS[index % COLORS.length] }));
    }, [filteredTransactions]);

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
                incomeMonth: incomeTotal,
                expenseMonth: expenseTotal,
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

            {/* Filters */}


            {/* MAIN SUMMARY CARD */}
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-card">
                <div className="p-8 pb-4">
                    {/* Balance */}
                    <div className="text-center mb-8 pt-4">
                        {/* Period Filter */}
                        <div className="flex justify-center mb-6">
                            <Tabs value={periodFilter} onValueChange={(v) => setPeriodFilter(v as any)} className="w-[300px]">
                                <TabsList className="grid w-full grid-cols-4 rounded-full bg-gray-100 dark:bg-zinc-800 p-1">
                                    <TabsTrigger value="day" className="rounded-full text-xs py-1 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:shadow-sm">Dia</TabsTrigger>
                                    <TabsTrigger value="week" className="rounded-full text-xs py-1 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:shadow-sm">Sem</TabsTrigger>
                                    <TabsTrigger value="month" className="rounded-full text-xs py-1 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:shadow-sm">Mês</TabsTrigger>
                                    <TabsTrigger value="year" className="rounded-full text-xs py-1 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:shadow-sm">Ano</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>

                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 font-medium">Saldo em contas</p>
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                            {showBalance
                                ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalBalance)
                                : "R$ •••••••"
                            }
                        </h1>
                        <button onClick={() => setShowBalance(!showBalance)} className="mt-2 text-blue-500/50 hover:text-blue-600 transition-colors">
                            {showBalance ? <Eye className="h-6 w-6 mx-auto" /> : <EyeOff className="h-6 w-6 mx-auto" />}
                        </button>
                    </div>

                    {/* Income / Expsense Row */}
                    {/* Income / Expsense Row */}
                    <div className="flex flex-col md:flex-row gap-6 justify-between px-2 md:px-4 pb-2 w-full">

                        {/* Receitas - Aligned Left */}
                        <div className="flex-1 flex flex-col gap-3 min-w-[280px]">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 min-w-[2.5rem] rounded-full bg-green-100 flex items-center justify-center">
                                    <ArrowUpCircle className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium">Receitas</p>
                                    <p className="text-green-600 font-bold text-lg">
                                        {showBalance ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(incomeTotal) : "••••"}
                                    </p>
                                </div>
                            </div>

                            {/* Income Filters */}
                            <div className="grid grid-cols-2 gap-2 mt-1">
                                <Select value={incomeCategoryId} onValueChange={setIncomeCategoryId}>
                                    <SelectTrigger className="h-8 text-xs bg-gray-50 dark:bg-zinc-800 border-none rounded-lg">
                                        <SelectValue placeholder="Categoria" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas as Categorias</SelectItem>
                                        {categories.filter(c => c.type === 'income').map(cat => (
                                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={incomeWalletId} onValueChange={setIncomeWalletId}>
                                    <SelectTrigger className="h-8 text-xs bg-gray-50 dark:bg-zinc-800 border-none rounded-lg">
                                        <SelectValue placeholder="Banco" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos os Bancos</SelectItem>
                                        {wallets.map(wallet => (
                                            <SelectItem key={wallet.id} value={wallet.id}>{wallet.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="hidden md:block w-px bg-gray-200 dark:bg-zinc-800 mx-2 self-stretch" />

                        {/* Despesas - Aligned Right (visually, but content is left-aligned in column) */}
                        <div className="flex-1 flex flex-col gap-3 min-w-[280px]">
                            <div className="flex items-center justify-end gap-3 text-right flex-row-reverse">
                                <div className="h-10 w-10 min-w-[2.5rem] rounded-full bg-red-100 flex items-center justify-center">
                                    <ArrowDownCircle className="h-6 w-6 text-red-500" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium">Despesas</p>
                                    <p className="text-red-500 font-bold text-lg">
                                        {showBalance ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expenseTotal) : "••••"}
                                    </p>
                                </div>
                            </div>

                            {/* Expense Filters */}
                            <div className="grid grid-cols-2 gap-2 mt-1">
                                <Select value={expenseCategoryId} onValueChange={setExpenseCategoryId}>
                                    <SelectTrigger className="h-8 text-xs bg-gray-50 dark:bg-zinc-800 border-none rounded-lg">
                                        <SelectValue placeholder="Categoria" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas as Categorias</SelectItem>
                                        {categories.filter(c => c.type === 'expense').map(cat => (
                                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={expenseSourceId} onValueChange={setExpenseSourceId}>
                                    <SelectTrigger className="h-8 text-xs bg-gray-50 dark:bg-zinc-800 border-none rounded-lg">
                                        <SelectValue placeholder="Origem" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas as Origens</SelectItem>
                                        <SelectGroup>
                                            <SelectLabel>Cartões de Crédito</SelectLabel>
                                            {creditCards.map(card => (
                                                <SelectItem key={card.id} value={`card:${card.id}`}>{card.name}</SelectItem>
                                            ))}
                                        </SelectGroup>
                                        <SelectGroup>
                                            <SelectLabel>Contas / Dinheiro</SelectLabel>
                                            {wallets.map(wallet => (
                                                <SelectItem key={wallet.id} value={`wallet:${wallet.id}`}>{wallet.name}</SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Chart Section */}
            {/* Expenses chart */}
            <div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 px-2">Despesas por categoria</h3>
                <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-card p-6">
                    <div className="h-[300px] w-full flex flex-col md:flex-row items-center justify-center">
                        {categoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend
                                        layout="horizontal"
                                        verticalAlign="bottom"
                                        align="center"
                                        wrapperStyle={{ paddingTop: '20px' }}
                                        formatter={(value, entry: any) => (
                                            <span className="text-xs font-medium ml-1 text-gray-600 dark:text-gray-300">
                                                {value}
                                            </span>
                                        )}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                <div className="h-24 w-24 rounded-full border-4 border-muted flex items-center justify-center mb-2">
                                    <span className="text-3xl">🤷‍♂️</span>
                                </div>
                                <p>Sem despesas este mês</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

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
            {
                aiInsights && (
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
                )
            }
        </div >
    )
}
