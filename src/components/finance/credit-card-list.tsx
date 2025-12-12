"use client";

import { useState } from "react";
import { Plus, CreditCard as CreditCardIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFinance } from "@/hooks/use-finance";
import { getBankLogo } from "@/lib/bank-logos";

export function CreditCardList() {
    const { creditCards, addCreditCard } = useFinance();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form State
    const [name, setName] = useState("");
    const [limit, setLimit] = useState("");
    const [closingDay, setClosingDay] = useState("");
    const [dueDay, setDueDay] = useState("");

    const handleSubmit = async () => {
        if (!name || !limit || !closingDay || !dueDay) return;
        setLoading(true);

        const { error } = await addCreditCard({
            name,
            limit_amount: parseFloat(limit),
            closing_day: parseInt(closingDay),
            due_day: parseInt(dueDay)
        });

        setLoading(false);

        if (error) {
            alert("Erro ao adicionar cartão de crédito.");
            console.error(error);
            return;
        }

        setIsDialogOpen(false);
        setName("");
        setLimit("");
        setClosingDay("");
        setDueDay("");
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <CreditCardIcon className="h-5 w-5" />
                    Cartões de Crédito
                </CardTitle>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                            <Plus className="h-4 w-4 mr-2" />
                            Novo Cartão
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Adicionar Cartão de Crédito</DialogTitle>
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
                            <Button onClick={handleSubmit} disabled={loading}>
                                {loading ? "Salvando..." : "Salvar Cartão"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {creditCards.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                        Nenhum cartão cadastrado.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {creditCards.map((card) => {
                            const logo = getBankLogo(card.name);
                            return (
                                <div key={card.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-3">
                                        {logo ? (
                                            <div className="h-10 w-10 min-w-[2.5rem] rounded-full overflow-hidden flex items-center justify-center shadow-sm">
                                                <img src={logo} alt={card.name} className="h-full w-full object-cover" />
                                            </div>
                                        ) : (
                                            <div className="h-10 w-10 min-w-[2.5rem] rounded-full bg-muted flex items-center justify-center">
                                                <CreditCardIcon className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-medium">{card.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Fecha dia {card.closing_day} • Vence dia {card.due_day}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-sm">
                                            Limite: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(card.limit_amount)}
                                        </p>
                                        <p className="text-sm font-bold text-red-600">
                                            Fatura: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(card.current_invoice || 0)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
