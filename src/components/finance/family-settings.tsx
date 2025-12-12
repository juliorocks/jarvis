"use client";

import { useState, useEffect } from "react";
import { Users, Mail, Plus, Copy, Edit, LogOut, Check, X, Shield, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFinance } from "@/hooks/use-finance";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function FamilySettings({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
    const {
        familyMembers, invitations, inviteMember, userRole, updateProfile, leaveFamily,
        familyName, updateFamilyName, toggleMemberPermission, refresh, familyId
    } = useFinance();

    useEffect(() => {
        if (open) {
            refresh();
        }
    }, [open, refresh]);

    const [inviteEmail, setInviteEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [newName, setNewName] = useState("");
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isEditingFamilyName, setIsEditingFamilyName] = useState(false);
    const [newFamilyName, setNewFamilyName] = useState("");

    const isOwner = userRole === 'owner';

    // Helpers
    const getMemberName = (member: any) => {
        if (member.profiles?.full_name) return member.profiles.full_name;
        if (member.profiles?.email) return member.profiles.email;
        return `Usuário ${member.user_id.slice(0, 4)}...`;
    };

    const handleInvite = async () => {
        if (!inviteEmail) return;
        setLoading(true);
        const { error } = await inviteMember(inviteEmail);
        setLoading(false);
        if (error) {
            console.error("Invite Error Object:", error);
            alert(`Erro ao enviar convite: ${error.message || JSON.stringify(error)}`);
        } else {
            setInviteEmail("");
            alert("Convite enviado com sucesso!");
        }
    };

    const handleUpdateProfile = async () => {
        if (!newName) return;
        setLoading(true);
        const { error } = await updateProfile(newName);
        setLoading(false);
        if (error) {
            alert("Erro ao atualizar perfil.");
        } else {
            setIsEditingProfile(false);
            alert("Perfil atualizado! A página será recarregada para aplicar as mudanças.");
            window.location.reload();
        }
    };

    const handleUpdateFamilyName = async () => {
        if (!newFamilyName) return;
        setLoading(true);
        const { error } = await updateFamilyName(newFamilyName);
        setLoading(false);
        if (error) {
            alert("Erro ao atualizar nome da família.");
        } else {
            setIsEditingFamilyName(false);
        }
    };

    const handleLeaveFamily = async () => {
        if (confirm("Tem certeza que deseja sair desta família? Você perderá acesso aos dados compartilhados.")) {
            setLoading(true);
            const { error } = await leaveFamily();
            if (error) {
                alert("Erro ao sair da família: " + error.message);
                setLoading(false);
            }
        }
    };

    const copyInviteLink = (token: string) => {
        const link = `${window.location.origin}/invite?token=${token}`;
        navigator.clipboard.writeText(link).then(() => {
            alert("Link copiado! Envie este link para o convidado entrar na família.");
        });
    };

    const handleTogglePermission = async (userId: string, currentStatus: boolean) => {
        try {
            await toggleMemberPermission(userId, !currentStatus);
        } catch (error) {
            console.error("Error toggling permission:", error);
            alert("Erro ao alterar permissão.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            {isEditingFamilyName ? (
                                <div className="flex items-center gap-1">
                                    <Input
                                        value={newFamilyName}
                                        onChange={e => setNewFamilyName(e.target.value)}
                                        placeholder={familyName}
                                        className="h-7 w-40 text-sm"
                                    />
                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleUpdateFamilyName}>
                                        <Check className="h-4 w-4 text-green-600" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setIsEditingFamilyName(false)}>
                                        <X className="h-4 w-4 text-red-600" />
                                    </Button>
                                </div>
                            ) : (
                                <span className="flex items-center gap-2 font-semibold text-lg">
                                    {familyName}
                                    {isOwner && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 hover:bg-muted"
                                            onClick={() => { setNewFamilyName(familyName); setIsEditingFamilyName(true); }}
                                        >
                                            <Edit className="h-3 w-3 text-muted-foreground" />
                                        </Button>
                                    )}
                                </span>
                            )}
                        </div>
                    </DialogTitle>
                    <DialogDescription>
                        {isOwner
                            ? "Gerencie membros, permissões e convites."
                            : `Você é membro da família ${familyName}.`}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-2">
                    {/* Invite Section (Owners Only) */}
                    {isOwner && (
                        <div className="space-y-2">
                            <Label>Convidar Membro</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="email@exemplo.com"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                />
                                <Button onClick={handleInvite} disabled={loading || !inviteEmail}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Enviar
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Members List */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium leading-none">Membros Ativos</h4>
                        <div className="rounded-md border p-2 space-y-2 max-h-[250px] overflow-y-auto">
                            {familyMembers.map((member) => (
                                <div key={member.user_id} className="flex items-center justify-between text-sm p-1 hover:bg-muted/50 rounded">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <span className="font-bold text-xs text-primary">{getMemberName(member).substring(0, 2).toUpperCase()}</span>
                                        </div>
                                        <div className="truncate">
                                            <p className="font-medium truncate">{getMemberName(member)}</p>
                                            <div className="flex items-center gap-1">
                                                <p className="text-xs text-muted-foreground capitalize">
                                                    {member.role === 'owner' ? 'Administrador' : 'Membro'}
                                                </p>
                                                {member.can_view_all && (
                                                    <Badge variant="outline" className="text-[10px] h-4 py-0 px-1 border-blue-200 text-blue-600">Vê Tudo</Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {/* Permissions Toggle (Owner only, not on self) */}
                                        {isOwner && member.role !== 'owner' && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant={member.can_view_all ? "secondary" : "ghost"}
                                                            size="sm"
                                                            className="h-8 px-2 text-xs gap-1"
                                                            onClick={() => handleTogglePermission(member.user_id, !!member.can_view_all)}
                                                        >
                                                            {member.can_view_all ? (
                                                                <>
                                                                    <Eye className="h-3 w-3 text-blue-600" />
                                                                    <span className="text-blue-600">Vê Tudo</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <EyeOff className="h-3 w-3 text-gray-500" />
                                                                    <span className="text-gray-500">Restrito</span>
                                                                </>
                                                            )}
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>{member.can_view_all ? "Pode ver dados de todos" : "Vê apenas seus dados"}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                        {/* Tag for owner */}
                                        {member.role === 'owner' && (
                                            <Badge variant="secondary" className="text-[10px] h-5 bg-amber-100 text-amber-800 border-amber-200">
                                                <Shield className="h-3 w-3 mr-1" /> Dono
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pending Invites (Owners Only) */}
                    {isOwner && invitations.filter(i => i.status === 'pending').length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium leading-none text-amber-600">Convites Pendentes</h4>
                            <div className="rounded-md border border-amber-200 bg-amber-50 p-2 space-y-2">
                                {invitations.filter(i => i.status === 'pending').map((invite) => (
                                    <div key={invite.id} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-amber-600" />
                                            <div>
                                                <p className="font-medium">{invite.email}</p>
                                                <div className="flex items-center gap-1">
                                                    <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700">Pendente</Badge>
                                                    <span className="text-[10px] text-muted-foreground">Aguardando aceite</span>
                                                </div>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => copyInviteLink(invite.token)}>
                                            <Copy className="h-4 w-4 text-amber-600" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex-col sm:justify-end sm:flex-row gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
