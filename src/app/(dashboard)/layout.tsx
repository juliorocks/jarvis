import { ReactNode } from "react";
import Link from "next/link";
import { BottomNav } from "@/components/layout/bottom-nav";
import { LogoutButton } from "@/components/layout/logout-button";
import { FinanceProvider } from "@/hooks/use-finance";

export default function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <FinanceProvider>
            <div className="flex min-h-screen flex-col bg-gray-50/50 dark:bg-zinc-950">
                {/* Desktop Header Placeholder */}
                <header className="hidden md:flex items-center justify-between border-b px-8 h-16 bg-background/95 backdrop-blur">
                    <div className="font-bold text-xl tracking-tight">Jarvis</div>
                    <nav className="flex gap-4 text-sm font-medium">
                        <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
                        <Link href="/finance" className="text-muted-foreground hover:text-foreground transition-colors">Financeiro</Link>
                        <Link href="/calendar" className="text-muted-foreground hover:text-foreground transition-colors">Calendário</Link>
                        <LogoutButton />
                    </nav>
                </header>

                {/* Mobile Header */}
                <header className="flex md:hidden items-center justify-between border-b px-4 h-14 bg-background/95 backdrop-blur">
                    <div className="font-bold text-lg tracking-tight">Jarvis</div>
                    <LogoutButton />
                </header>

                <main className="flex-1 container mx-auto p-4 md:p-8 max-w-5xl space-y-6 md:space-y-8 animate-in fade-in duration-500">
                    {children}
                </main>

                <BottomNav />
            </div>
        </FinanceProvider>
    );
}
