"use client";

import { useState, useEffect } from "react";
import { getUsers, updateUserStatus, updateUserPlan } from "@/app/actions/admin";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal, ShieldCheck, Ban, CreditCard, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [planFilter, setPlanFilter] = useState("all");

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await getUsers(search, planFilter);
            setUsers(data);
        } catch (error) {
            toast.error("Erro ao carregar usuários");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            loadUsers();
        }, 300);
        return () => clearTimeout(timeout);
    }, [search, planFilter]);

    const handleStatusChange = async (userId: string, status: string) => {
        try {
            await updateUserStatus(userId, status);
            toast.success("Status atualizado");
            loadUsers();
        } catch (e) {
            toast.error("Erro ao atualizar status");
        }
    };

    const handlePlanChange = async (userId: string, plan: string) => {
        try {
            await updateUserPlan(userId, plan);
            toast.success("Plano atualizado");
            loadUsers();
        } catch (e) {
            toast.error("Erro ao atualizar plano");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gerenciar Usuários</h1>
                    <p className="text-muted-foreground">Controle de acesso e planos.</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome ou email..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select value={planFilter} onValueChange={setPlanFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filtrar por plano" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Planos</SelectItem>
                        <SelectItem value="trial">Trial</SelectItem>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="family">Família</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Usuário</TableHead>
                            <TableHead>Plano</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    Nenhum usuário encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={user.avatar_url} />
                                                <AvatarFallback>{user.full_name?.[0]}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{user.full_name}</span>
                                                <span className="text-xs text-muted-foreground">{user.email}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize">
                                            {user.plan_type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.plan_status === 'active' ? 'default' : 'destructive'} className="capitalize bg-opacity-80">
                                            {user.plan_status === 'active' ? 'Ativo' : user.plan_status === 'trial_expired' ? 'Trial Expirado' : 'Suspenso'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="capitalize text-muted-foreground text-sm">
                                        {user.role}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleStatusChange(user.id, 'active')}>
                                                    <ShieldCheck className="mr-2 h-4 w-4" /> Ativar Acesso
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleStatusChange(user.id, 'suspended')} className="text-red-600">
                                                    <Ban className="mr-2 h-4 w-4" /> Suspender
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuLabel>Mudar Plano</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handlePlanChange(user.id, 'individual')}>
                                                    <CreditCard className="mr-2 h-4 w-4" /> Individual
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handlePlanChange(user.id, 'family')}>
                                                    <CreditCard className="mr-2 h-4 w-4" /> Família
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
