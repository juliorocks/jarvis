import { ReactNode } from "react";
import Link from "next/link";
import { BottomNav } from "@/components/layout/bottom-nav";
import { LogoutButton } from "@/components/layout/logout-button";
import { FinanceProvider } from "@/hooks/use-finance";
import { JarvisAssistant } from "@/components/jarvis/assistant-button";
import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <FinanceProvider>
            <div className="flex h-screen overflow-hidden bg-gray-50/50 dark:bg-zinc-950">
                {/* Desktop Sidebar */}
                <aside className="hidden md:block h-full">
                    <Sidebar />
                </aside>

                <div className="flex-1 flex flex-col h-full overflow-hidden">
                    {/* Mobile Header */}
                    <header className="flex md:hidden items-center justify-between px-4 h-14 bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm shrink-0">
                        <div className="font-bold text-lg tracking-tight text-white">Jarvis</div>
                        <LogoutButton />
                    </header>

                    {/* Main Content Area */}
                    <main className="flex-1 overflow-y-auto p-4 md:p-8 animate-in fade-in duration-500">
                        <div className="container mx-auto max-w-5xl space-y-6 md:space-y-8 pb-20 md:pb-0">
                            {children}
                        </div>
                    </main>

                    <div className="md:hidden">
                        <BottomNav />
                    </div>
                </div>

                <JarvisAssistant className="hidden md:flex" />
            </div>
        </FinanceProvider>
    );
}
