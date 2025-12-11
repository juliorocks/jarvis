"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowDownLeft, ArrowUpRight, CalendarOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { Transaction } from "@/types/finance";
import { cn } from "@/lib/utils";

export function TransactionList() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function loadTransactions() {
            // NOTE: In production, filter by user_id via RLS, so just select *
            const { data, error } = await supabase
                .from("transactions")
                .select("*")
                .order("date", { ascending: false });

            if (data) {
                setTransactions(data);
            }
            setLoading(false);
        }

        loadTransactions();
    }, []);

    if (loading) {
        return <div className="text-center p-4 text-muted-foreground">Carregando finanças...</div>;
    }

    if (transactions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground space-y-2">
                <CalendarOff className="h-10 w-10 text-muted-foreground/50" />
                <p>Nenhuma transação encontrada.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {transactions.map((t) => (
                <Card key={t.id} className="overflow-hidden transition-all hover:shadow-md">
                    <CardContent className="p-0 flex items-center justify-between">
                        <div className="flex items-center gap-4 p-4">
                            <div className={cn(
                                "h-10 w-10 rounded-full flex items-center justify-center",
                                t.type === 'income' ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                            )}>
                                {t.type === 'income' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownLeft className="h-5 w-5" />}
                            </div>
                            <div>
                                <p className="font-medium">{t.description}</p>
                                <p className="text-xs text-muted-foreground capitalize">
                                    {t.category?.name || "Geral"} • {format(new Date(t.date), "dd MMM", { locale: ptBR })}
                                </p>
                            </div>
                        </div>
                        <div className={cn(
                            "pr-4 font-semibold",
                            t.type === 'income' ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                        )}>
                            {t.type === 'income' ? '+' : '-'}
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(t.amount))}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
