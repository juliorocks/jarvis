"use client";

import { useState } from "react";
import { Plus, CreditCard as CreditCardIcon, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFinance, CreditCard } from "@/hooks/use-finance";
import { getBankLogo } from "@/lib/bank-logos";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
import { Skeleton } from "@/components/ui/skeleton";

export function CreditCardList() {
    const { creditCards, addCreditCard, updateCreditCard, deleteCreditCard, loading: isLoading } = useFinance();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [loadingAction, setLoadingAction] = useState(false);
    const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState("");
    const [limit, setLimit] = useState("");
    const [closingDay, setClosingDay] = useState("");
    const [dueDay, setDueDay] = useState("");

    const openDialog = (card?: CreditCard) => {
        if (card) {
            setEditingCard(card);
            setName(card.name);
            setLimit(card.limit_amount.toString());
            setClosingDay(card.closing_day.toString());
            setDueDay(card.due_day.toString());
        } else {
            setEditingCard(null);
            setName("");
            setLimit("");
            setClosingDay("");
            setDueDay("");
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async () => {
        if (!name || !limit || !closingDay || !dueDay) return;
        setLoadingAction(true);

        const payload = {
            name,
            limit_amount: parseFloat(limit),
            closing_day: parseInt(closingDay),
            due_day: parseInt(dueDay)
        };

        let result;
        if (editingCard) {
            result = await updateCreditCard({
                ...editingCard,
                ...payload
            });
        } else {
            result = await addCreditCard(payload);
        }

        setLoadingAction(false);

        if (result.error) {
            alert("Erro ao salvar cartão de crédito.");
            console.error(result.error);
            return;
        }

        setIsDialogOpen(false);
    };

    const handleDelete = async () => {
        if (deletingId) {
            await deleteCreditCard(deletingId);
            setDeletingId(null);
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pt-6">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <CreditCardIcon className="h-5 w-5" />
                    Cartões de Crédito
                </CardTitle>
                <Button size="sm" variant="outline" onClick={() => openDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Cartão
                </Button>
            </CardHeader>
            <CardContent className="pb-6">
                {isLoading ? (
                    // Skeleton Loading State
                    <div className="space-y-4">
                        {[1, 2].map((i) => (
                            <div key={i} className="flex items-center justify-between pt-2">
                                <div className="flex items-center gap-4">
                                    <Skeleton className="h-12 w-12 rounded-full" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                </div>
                                <div className="space-y-2 flex flex-col items-end">
                                    <Skeleton className="h-3 w-16" />
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : creditCards.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                        Nenhum cartão cadastrado.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {creditCards.map((card) => {
                            const logo = getBankLogo(card.name);
                            return (
                                <div key={card.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0 pt-2">
                                    <div className="flex items-center gap-4">
                                        {logo ? (
                                            <div className="h-12 w-12 min-w-[3rem] rounded-full overflow-hidden bg-white shadow-sm border border-zinc-100 flex items-center justify-center p-0.5">
                                                <img src={logo} alt={card.name} className="h-full w-full object-contain rounded-full" />
                                            </div>
                                        ) : (
                                            <div className="h-12 w-12 min-w-[3rem] rounded-full bg-zinc-100 flex items-center justify-center">
                                                <CreditCardIcon className="h-6 w-6 text-zinc-400" />
                                            </div>
                                        )}
                                        <div className="space-y-1">
                                            <p className="font-semibold text-zinc-900 dark:text-zinc-100">{card.name}</p>
                                            <div className="flex flex-col text-xs text-zinc-500 dark:text-zinc-400">
                                                <span>Fecha dia {card.closing_day}</span>
                                                <span className="font-medium text-blue-600 dark:text-blue-400">Vence dia {card.due_day}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right space-y-1">
                                            <div>
                                                <p className="text-[10px] text-zinc-500 uppercase font-semibold">Fatura Atual</p>
                                                <p className="text-sm font-bold text-red-600">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(card.current_invoice || 0)}
                                                </p>
                                            </div>
                                            <p className="text-[10px] text-zinc-400">
                                                Limite: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(card.limit_amount)}
                                            </p>
                                        </div>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => openDialog(card)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-600" onClick={() => setDeletingId(card.id)}>
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Excluir
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingCard ? "Editar Cartão" : "Adicionar Cartão"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Nome do Cartão</Label>
                            <Input placeholder="Ex: Nubank, Visa Platinum" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Limite (R$)</Label>
                            <Input type="number" placeholder="0.00" value={limit} onChange={(e) => setLimit(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Dia Fechamento</Label>
                                <Input type="number" min="1" max="31" placeholder="Dia" value={closingDay} onChange={(e) => setClosingDay(e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Dia Vencimento</Label>
                                <Input type="number" min="1" max="31" placeholder="Dia" value={dueDay} onChange={(e) => setDueDay(e.target.value)} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSubmit} disabled={loadingAction}>
                            {loadingAction ? "Salvando..." : "Salvar Cartão"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Cartão?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Isso removerá o cartão e pode afetar o histórico de faturas. Tem certeza?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}
