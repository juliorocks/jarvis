import { ReactNode } from "react";
import Link from "next/link";
import { BottomNav } from "@/components/layout/bottom-nav";
import { LogoutButton } from "@/components/layout/logout-button";
import { FinanceProvider } from "@/hooks/use-finance";
import { JarvisAssistant } from "@/components/jarvis/assistant-button";

export default function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <FinanceProvider>
            <div className="flex min-h-screen flex-col bg-gray-50/50 dark:bg-zinc-950">
                {/* Desktop Header Placeholder */}
                <header className="hidden md:flex items-center justify-between px-8 h-16 bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm">
                    <div className="font-bold text-xl tracking-tight text-white">Jarvis</div>
                    <nav className="flex gap-4 text-sm font-medium">
                        <Link href="/" className="text-blue-100 hover:text-white transition-colors">Dashboard</Link>
                        <Link href="/finance" className="text-blue-100 hover:text-white transition-colors">Financeiro</Link>
                        <Link href="/calendar" className="text-blue-100 hover:text-white transition-colors">Calendário</Link>
                        <LogoutButton />
                    </nav>
                </header>

                {/* Mobile Header */}
                <header className="flex md:hidden items-center justify-between px-4 h-14 bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm">
                    <div className="font-bold text-lg tracking-tight text-white">Jarvis</div>
                    <LogoutButton />
                </header>

                <main className="flex-1 container mx-auto p-4 md:p-8 max-w-5xl space-y-6 md:space-y-8 animate-in fade-in duration-500">
                    {children}
                </main>

                <JarvisAssistant className="hidden md:flex" />
                <BottomNav />
            </div>
        </FinanceProvider>
    );
}
