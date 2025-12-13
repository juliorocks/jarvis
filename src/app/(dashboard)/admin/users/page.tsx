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
import { MoreHorizontal, ShieldCheck, Ban, CreditCard, Search, Loader2, ChevronRight, ChevronDown, UserPlus, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AddUserDialog } from "@/components/admin/add-user-dialog";

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [planFilter, setPlanFilter] = useState("all");
    const [expandedFamilies, setExpandedFamilies] = useState<Record<string, boolean>>({});

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await getUsers(search, planFilter);
            setUsers(data);
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Erro ao carregar usuários");
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

    const toggleFamily = (userId: string) => {
        setExpandedFamilies(prev => ({ ...prev, [userId]: !prev[userId] }));
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Gerenciar Usuários</h1>
                    <p className="text-muted-foreground mt-1">Controle de acesso, planos e famílias.</p>
                </div>
                <AddUserDialog onUserAdded={loadUsers} />
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row items-center gap-4 bg-white dark:bg-card p-4 rounded-2xl shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome ou email..."
                        className="pl-9 bg-gray-50 dark:bg-zinc-800 border-none rounded-xl"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select value={planFilter} onValueChange={setPlanFilter}>
                    <SelectTrigger className="w-full md:w-[200px] border-none bg-gray-50 dark:bg-zinc-800 rounded-xl">
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

            {/* Table */}
            <div className="bg-white dark:bg-card rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50/50 dark:bg-zinc-800/20">
                        <TableRow>
                            <TableHead className="pl-6 w-[350px]">Usuário</TableHead>
                            <TableHead>Status & Plano</TableHead>
                            <TableHead>Cadastro / Expiração</TableHead>
                            <TableHead>Permissão</TableHead>
                            <TableHead className="text-right pr-6">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                        <p className="text-xs text-muted-foreground">Carregando...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                    Nenhum usuário encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => {
                                const hasGuests = user.guests && user.guests.length > 0;
                                const isExpanded = expandedFamilies[user.id];

                                return (
                                    <>
                                        <TableRow key={user.id} className={`group ${hasGuests ? 'cursor-pointer hover:bg-gray-50/80 dark:hover:bg-zinc-800/30' : ''}`} onClick={() => hasGuests && toggleFamily(user.id)}>
                                            <TableCell className="pl-6">
                                                <div className="flex items-center gap-3">
                                                    {/* Expand Icon for Families */}
                                                    {hasGuests && (
                                                        <div className="mr-1 text-muted-foreground">
                                                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                        </div>
                                                    )}
                                                    <Avatar className="h-10 w-10 border border-gray-100 dark:border-zinc-800">
                                                        <AvatarImage src={user.avatar_url} />
                                                        <AvatarFallback>{user.full_name?.[0] || "U"}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-gray-900 dark:text-gray-100">{user.full_name || "Sem Nome"}</span>
                                                        <span className="text-xs text-muted-foreground">{user.email}</span>
                                                        {hasGuests && <span className="text-[10px] text-indigo-500 font-medium mt-0.5">{user.guests.length} convidado(s)</span>}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1 items-start">
                                                    <Badge variant={user.plan_status === 'active' ? 'default' : 'destructive'} className={`${user.plan_status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-400' :
                                                        'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-400'
                                                        } border-none shadow-none`}>
                                                        {user.plan_status === 'active' ? 'Ativo' : user.plan_status === 'trial_expired' ? 'Trial Expirado' : 'Suspenso'}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground capitalize ml-1">{user.plan_type}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                                                        <Calendar className="h-3 w-3" />
                                                        {user.created_at ? format(new Date(user.created_at), "dd/MM/yyyy") : "-"}
                                                    </div>
                                                    {user.subscription_expires_at && (
                                                        <span className="text-[10px] text-orange-500 font-medium">Expira: {format(new Date(user.subscription_expires_at), "dd/MM/yy")}</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize text-xs font-normal">
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-zinc-800">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => handleStatusChange(user.id, 'active')}>
                                                            <ShieldCheck className="mr-2 h-4 w-4 text-green-600" /> Ativar Acesso
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

                                        {/* Guests Rows - Render if expanded */}
                                        {hasGuests && isExpanded && user.guests.map((guest: any) => (
                                            <TableRow key={guest.id} className="bg-gray-50/50 dark:bg-zinc-900/30">
                                                <TableCell className="pl-14">
                                                    <div className="flex items-center gap-3 relative">
                                                        <div className="absolute -left-6 top-1/2 w-4 h-px bg-gray-300 dark:bg-zinc-700"></div>
                                                        <div className="absolute -left-6 top-0 bottom-1/2 w-px bg-gray-300 dark:bg-zinc-700 h-full"></div>
                                                        <Avatar className="h-8 w-8 scale-90 opacity-80">
                                                            <AvatarImage src={guest.avatar_url} />
                                                            <AvatarFallback>{guest.full_name?.[0] || "?"}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-sm text-gray-700 dark:text-gray-300">{guest.full_name || "Convidado"}</span>
                                                            <span className="text-[10px] text-muted-foreground">{guest.email}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-xs text-muted-foreground italic">Membro da Família</span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-xs text-muted-foreground">{guest.created_at ? format(new Date(guest.created_at), "dd/MM/yyyy") : "-"}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="text-[10px] bg-gray-100 text-gray-600">Convidado</Badge>
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    {/* Actions for guests could be restricted or same */}
                                                    <Button variant="ghost" size="sm" disabled className="h-6 text-[10px]">Ver detalhes</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
