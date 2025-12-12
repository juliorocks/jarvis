"use client";

import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Wallet,
    Calendar,
    Settings,
    User,
    LogOut,
    Menu,
    ChevronLeft,
    Moon,
    Sun,
    ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SidebarProps {
    className?: string;
}

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [user, setUser] = useState<any>(null);
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        }
        getUser();
    }, [supabase]);

    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };

    const navItems = [
        {
            title: "Dashboard",
            href: "/",
            icon: LayoutDashboard,
        },
        {
            title: "Financeiro",
            href: "/finance",
            icon: Wallet,
        },
        {
            title: "Calendário",
            href: "/calendar",
            icon: Calendar,
        },
    ];

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    return (
        <TooltipProvider delayDuration={0}>
            <div
                className={cn(
                    "relative flex flex-col h-screen border-r bg-background transition-all duration-300",
                    isCollapsed ? "w-16" : "w-64",
                    className
                )}
            >
                {/* Header / Collapse Toggle */}
                <div className="flex h-16 items-center justify-between px-4 border-b">
                    {!isCollapsed && (
                        <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
                            Jarvis
                        </span>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleCollapse}
                        className={cn("ml-auto", isCollapsed && "mx-auto")}
                    >
                        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    </Button>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 space-y-2 p-2">
                    {navItems.map((item) => (
                        <Tooltip key={item.title}>
                            <TooltipTrigger asChild>
                                <Link
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                        pathname === item.href
                                            ? "bg-primary text-primary-foreground"
                                            : "hover:bg-accent hover:text-accent-foreground text-muted-foreground",
                                        isCollapsed && "justify-center px-2"
                                    )}
                                >
                                    <item.icon className="h-4 w-4 shrink-0" />
                                    {!isCollapsed && <span>{item.title}</span>}
                                </Link>
                            </TooltipTrigger>
                            {isCollapsed && (
                                <TooltipContent side="right">
                                    {item.title}
                                </TooltipContent>
                            )}
                        </Tooltip>
                    ))}
                </nav>

                {/* Footer Section */}
                <div className="border-t p-2 space-y-2">
                    {/* Theme Toggle */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("w-full justify-start", isCollapsed && "justify-center")}
                                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            >
                                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                {!isCollapsed && <span className="ml-3">Tema {theme === 'dark' ? 'Escuro' : 'Claro'}</span>}
                            </Button>
                        </TooltipTrigger>
                        {isCollapsed && <TooltipContent side="right">Alternar Tema</TooltipContent>}
                    </Tooltip>

                    {/* Profile */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Link href="/profile" className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground text-muted-foreground w-full",
                                isCollapsed && "justify-center px-2"
                            )}>
                                <Avatar className="h-6 w-6">
                                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                                    <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                                </Avatar>
                                {!isCollapsed && (
                                    <div className="flex flex-col items-start overflow-hidden">
                                        <span className="truncate w-full text-xs font-semibold">{user?.email?.split('@')[0]}</span>
                                        <span className="text-[10px] text-muted-foreground">Configurações</span>
                                    </div>
                                )}
                            </Link>
                        </TooltipTrigger>
                        {isCollapsed && <TooltipContent side="right">Perfil</TooltipContent>}
                    </Tooltip>

                    {/* Logout */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20",
                                    isCollapsed && "justify-center px-2"
                                )}
                                onClick={handleLogout}
                            >
                                <LogOut className="h-4 w-4" />
                                {!isCollapsed && <span className="ml-3">Sair</span>}
                            </Button>
                        </TooltipTrigger>
                        {isCollapsed && <TooltipContent side="right">Sair</TooltipContent>}
                    </Tooltip>
                </div>
            </div>
        </TooltipProvider>
    );
}
