"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFinance, Wallet, Transaction } from "@/hooks/use-finance";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useEffect } from "react";
import { Trash2 } from "lucide-react";

interface TransactionFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: Partial<Transaction> | null;
}

export function TransactionForm({ open, onOpenChange, initialData }: TransactionFormProps) {
    const { addTransaction, updateTransaction, deleteTransaction, wallets, categories, creditCards, addWallet, addCategory } = useFinance();
    const [loading, setLoading] = useState(false);

    // Form State
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'credit_card' | 'pix'>('wallet');
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [categoryId, setCategoryId] = useState("");
    const [walletId, setWalletId] = useState("");
    const [creditCardId, setCreditCardId] = useState("");

    useEffect(() => {
        if (open) {
            if (initialData) {
                setType(initialData.type || 'expense');
                setAmount(initialData.amount ? initialData.amount.toString() : "");
                setDescription(initialData.description || "");
                setDate(initialData.date || new Date().toISOString().split('T')[0]);
                setCategoryId(initialData.category_id || "");

                if (initialData.credit_card_id) {
                    setPaymentMethod('credit_card');
                    setCreditCardId(initialData.credit_card_id);
                } else {
                    if (initialData.payment_method === 'pix') {
                        setPaymentMethod('pix');
                    } else {
                        setPaymentMethod('wallet');
                    }
                    if (initialData.wallet_id) setWalletId(initialData.wallet_id);
                }
            } else {
                // Reset defaults
                setType('expense');
                setPaymentMethod('wallet');
                setAmount("");
                setDescription("");
                setDate(new Date().toISOString().split('T')[0]);
                setCategoryId("");
                setWalletId("");
                setCreditCardId("");
            }
        }
    }, [open, initialData]);

    // Quick Add handlers for empty states
    const handleQuickSetup = async () => {
        setLoading(true);
        try {
            if (wallets.length === 0) {
                await addWallet({ name: "Carteira Principal", type: "checking", balance: 0 });
            }
            if (categories.length === 0) {
                await addCategory({ name: "Alimentação", type: "expense" });
                await addCategory({ name: "Salário", type: "income" });
                await addCategory({ name: "Lazer", type: "expense" });
            }
        } finally {
            setLoading(false);
        }
    }

    const handleSubmit = async () => {
        if (!amount) { alert("Por favor, informe o valor."); return; }
        if (!description) { alert("Por favor, informe a descrição."); return; }
        if (!categoryId) { alert("Por favor, selecione uma categoria."); return; }

        if (type === 'income' && !walletId) { alert("Selecione uma carteira de destino para a receita."); return; }
        if (type === 'expense' && (paymentMethod === 'wallet' || paymentMethod === 'pix') && !walletId) { alert("Selecione qual carteira será utilizada."); return; }
        if (type === 'expense' && paymentMethod === 'credit_card' && !creditCardId) { alert("Selecione qual cartão de crédito será utilizado."); return; }

        const parsedAmount = parseFloat(amount.replace(',', '.'));
        if (isNaN(parsedAmount)) {
            alert("Valor inválido. Por favor, insira um número.");
            return;
        }

        setLoading(true);

        // Determine effective payment method string for backend
        let finalMethod = 'money';
        if (paymentMethod === 'credit_card') finalMethod = 'credit';
        else if (paymentMethod === 'pix') finalMethod = 'pix';
        else finalMethod = 'money';

        let result;

        const payload = {
            type,
            amount: parsedAmount,
            description,
            date,
            category_id: categoryId,
            wallet_id: (type === 'expense' && paymentMethod === 'credit_card') ? null : (walletId || null),
            credit_card_id: (type === 'expense' && paymentMethod === 'credit_card') ? (creditCardId || null) : null,
            status: (type === 'expense' && paymentMethod === 'credit_card') ? 'pending' : 'completed',
            payment_method: finalMethod
        };

        if (initialData && initialData.id) {
            result = await updateTransaction({
                ...initialData,
                ...payload
            } as any);
        } else {
            result = await addTransaction(payload as any);
        }

        const { error } = result;

        setLoading(false);

        if (error) {
            alert(`Erro ao salvar transação: ${error.message || JSON.stringify(error)}`);
            console.error("Failed to add transaction:", error);
            return;
        }

        onOpenChange(false);
        // Reset form
        setAmount("");
        setDescription("");

        alert("Transação salva com sucesso!");
        window.location.reload();
    };

    const handleDelete = async () => {
        if (!initialData?.id) return;
        if (!confirm("Tem certeza que deseja excluir esta transação?")) return;

        setLoading(true);
        const { error } = await deleteTransaction(initialData.id);
        setLoading(false);

        if (error) {
            alert("Erro ao excluir.");
        } else {
            onOpenChange(false);
            window.location.reload();
        }
    };

    const isEditMode = !!(initialData && initialData.id);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEditMode ? "Editar Transação" : "Nova Transação"}</DialogTitle>
                    <DialogDescription>{isEditMode ? "Atualize os dados da transação." : "Adicione uma receita ou despesa."}</DialogDescription>
                </DialogHeader>

                {wallets.length === 0 ? (
                    <div className="text-center py-6 space-y-4">
                        <p className="text-muted-foreground">Você ainda não tem carteiras configuradas.</p>
                        <Button onClick={handleQuickSetup} disabled={loading}>
                            {loading ? "Configurando..." : "Criar Carteira Padrão"}
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                variant={type === 'income' ? 'default' : 'outline'}
                                className={type === 'income' ? 'bg-[#5cd36b] hover:opacity-90' : ''}
                                onClick={() => setType('income')}
                            >
                                Receita
                            </Button>
                            <Button
                                variant={type === 'expense' ? 'default' : 'outline'}
                                className={type === 'expense' ? 'bg-[#e14948] hover:opacity-90' : ''}
                                onClick={() => setType('expense')}
                            >
                                Despesa
                            </Button>
                        </div>

                        <div className="grid gap-2">
                            <Label>Valor</Label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0,00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Descrição</Label>
                            <Input
                                placeholder="Ex: Almoço, Uber"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Data</Label>
                            <Input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>

                        {type === 'expense' && (
                            <div className="grid gap-2">
                                <Label>Forma de Pagamento</Label>
                                <RadioGroup defaultValue="wallet" value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'wallet' | 'credit_card' | 'pix')} className="flex flex-row gap-4">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="wallet" id="wallet" />
                                        <Label htmlFor="wallet">Dinheiro</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="pix" id="pix" />
                                        <Label htmlFor="pix">PIX</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="credit_card" id="credit_card" />
                                        <Label htmlFor="credit_card">Cartão</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        )}

                        {(type === 'income' || paymentMethod === 'wallet' || paymentMethod === 'pix') ? (
                            <div className="grid gap-2">
                                <Label>Carteira</Label>
                                <Select value={walletId} onValueChange={setWalletId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {wallets.map(w => (
                                            <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : (
                            <div className="grid gap-2">
                                <Label>Cartão de Crédito</Label>
                                <Select value={creditCardId} onValueChange={setCreditCardId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o cartão..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {creditCards.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label>Categoria</Label>
                            <Select value={categoryId} onValueChange={(val) => {
                                if (val === "new") {
                                    const newName = prompt("Nome da nova categoria:");
                                    if (newName) {
                                        setLoading(true);
                                        addCategory({ name: newName, type }).then((res) => {
                                            if (res.data) {
                                                setCategoryId(res.data.id);
                                            } else {
                                                console.error("Failed to create category:", res.error);
                                                alert("Erro ao criar categoria. Tente novamente.");
                                            }
                                            setLoading(false);
                                        });
                                    }
                                } else {
                                    setCategoryId(val);
                                }
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.filter(c => c.type === type).map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                    <SelectItem value="new" className="text-muted-foreground font-medium">
                                        + Criar Nova Categoria
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}

                <DialogFooter className="gap-2 sm:justify-between">
                    {isEditMode && (
                        <Button variant="destructive" onClick={handleDelete} disabled={loading} className="bg-[#e14948] hover:opacity-90">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                        </Button>
                    )}
                    <Button onClick={handleSubmit} disabled={loading || wallets.length === 0} className={isEditMode ? "ml-auto" : "w-full sm:w-auto"}>
                        {loading ? "Salvando..." : "Salvar Transação"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
