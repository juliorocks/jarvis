"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Wallet, Lightbulb, Sparkles, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { JarvisAssistant } from "@/components/jarvis/assistant-button";

interface NavItem {
    href: string;
    icon: LucideIcon;
    label: string;
    primary?: boolean;
}

export function BottomNav() {
    const pathname = usePathname();

    const links: NavItem[] = [
        { href: "/", icon: Home, label: "Home" },
        { href: "/calendar", icon: Calendar, label: "Agenda" },
        { href: "#", icon: Sparkles, label: "Jarvis", primary: true },
        { href: "/finance", icon: Wallet, label: "Finanças" },
        { href: "/brain", icon: Lightbulb, label: "Ideias" },
    ];

    return (
        <>
            <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur-md pb-safe-area-inset-bottom md:hidden z-50">
                <nav className="flex justify-around items-center h-16 px-2">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;

                        if (link.primary) {
                            return (
                                <div key={link.label} className="relative -top-5">
                                    <JarvisAssistant
                                        trigger={
                                            <Button
                                                size="icon"
                                                className="h-14 w-14 rounded-full shadow-xl bg-gradient-to-tr from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 transition-transform active:scale-95 border-4 border-background"
                                            >
                                                <Icon className="h-6 w-6" />
                                                <span className="sr-only">{link.label}</span>
                                            </Button>
                                        }
                                    />
                                </div>
                            );
                        }

                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors active:scale-95",
                                    isActive
                                        ? "text-primary font-semibold"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                                <span className="text-[10px]">{link.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>
            {/* Spacer for content to not be hidden behind nav */}
            <div className="h-16 md:hidden" />
        </>
    );
}
