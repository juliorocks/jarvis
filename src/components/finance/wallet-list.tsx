"use client";

import { useState } from "react";
import { Plus, Wallet as WalletIcon, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFinance, Wallet } from "@/hooks/use-finance";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function WalletList() {
    const { wallets, addWallet, updateWallet, deleteWallet } = useFinance();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState("");
    const [initialBalance, setInitialBalance] = useState("");
    const [type, setType] = useState<'checking' | 'investment' | 'cash'>('checking');

    const openDialog = (wallet?: Wallet) => {
        if (wallet) {
            setEditingWallet(wallet);
            setName(wallet.name);
            setInitialBalance(wallet.balance.toString());
            setType(wallet.type);
        } else {
            setEditingWallet(null);
            setName("");
            setInitialBalance("");
            setType("checking");
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async () => {
        if (!name) return;
        setLoading(true);

        const balanceVal = parseFloat(initialBalance) || 0;

        if (editingWallet) {
            await updateWallet({
                ...editingWallet,
                name,
                type,
                // We usually don't update balance directly here as it's calculated from transactions,
                // but for "Initial Balance" logic (if implemented) or adjusting drift, we might.
                // For now let's assume this updates the current balance directly (manual adjustment).
                balance: balanceVal
            });
        } else {
            await addWallet({
                name,
                type,
                balance: balanceVal
            });
        }

        setLoading(false);
        setIsDialogOpen(false);
    };

    const handleDelete = async () => {
        if (deletingId) {
            await deleteWallet(deletingId);
            setDeletingId(null);
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <WalletIcon className="h-5 w-5" />
                    Contas Bancárias
                </CardTitle>
                <Button size="sm" variant="outline" onClick={() => openDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Conta
                </Button>
            </CardHeader>
            <CardContent>
                {wallets.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                        Nenhuma conta cadastrada.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {wallets.map((wallet) => {
                            const logo = getBankLogo(wallet.name);
                            return (
                                <div key={wallet.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-3">
                                        {logo ? (
                                            <div className="h-10 w-10 min-w-[2.5rem] rounded-full overflow-hidden bg-white border flex items-center justify-center p-1">
                                                <img src={logo} alt={wallet.name} className="h-full w-full object-contain" />
                                            </div>
                                        ) : (
                                            <div className="h-10 w-10 min-w-[2.5rem] rounded-full bg-muted flex items-center justify-center">
                                                <WalletIcon className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-medium">{wallet.name}</p>
                                            <p className="text-xs text-muted-foreground capitalize">
                                                {/* Translate types */}
                                                {wallet.type === 'checking' ? 'Corrente' : wallet.type === 'investment' ? 'Investimento' : 'Dinheiro'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <p className="font-medium text-sm">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(wallet.balance)}
                                        </p>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => openDialog(wallet)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-600" onClick={() => setDeletingId(wallet.id)}>
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
                        <DialogTitle>{editingWallet ? "Editar Conta" : "Nova Conta"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Nome da Conta</Label>
                            <Input placeholder="Ex: NuConta, Bradesco" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Tipo</Label>
                            <Select value={type} onValueChange={(v: any) => setType(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="checking">Conta Corrente</SelectItem>
                                    <SelectItem value="investment">Investimento</SelectItem>
                                    <SelectItem value="cash">Dinheiro Físico</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Saldo Atual</Label>
                            <Input type="number" step="0.01" placeholder="0.00" value={initialBalance} onChange={(e) => setInitialBalance(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSubmit} disabled={loading}>
                            {loading ? "Salvando..." : "Salvar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Conta?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Isso removerá a conta e pode afetar o histórico. Tem certeza?
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
