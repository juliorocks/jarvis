"use client";

import { useFinance } from "@/hooks/use-finance";
import { CreditCardList } from "./credit-card-list";
import { WalletList } from "./wallet-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Wallet, ArrowUpCircle, ArrowDownCircle, Users, CreditCard, QrCode, Banknote } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { TransactionForm } from "./transaction-form";
import { FamilySettings } from "./family-settings";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
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
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalBalance)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Receitas (Mês)</CardTitle>
                        <ArrowUpCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(incomeMonth)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Despesas (Mês)</CardTitle>
                        <ArrowDownCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expenseMonth)}
                        </div>
                    </CardContent>
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

            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Transações Recentes</h2>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setIsFamilyOpen(true)}>
                        <Users className="mr-2 h-4 w-4" /> Família
                    </Button>
                    <Button onClick={() => setIsFormOpen(true)}>
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
                    ) : transactions.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">Nenhuma transação encontrada.</div>
                    ) : (
                        <div className="divide-y">
                            {transactions.map((t) => (
                                <div key={t.id} className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
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
                                                {format(new Date(t.date), "d 'de' MMMM", { locale: ptBR })}
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
                                        <div className={`font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                            {t.type === 'income' ? '+' : '-'}
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                                        </div>
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
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
