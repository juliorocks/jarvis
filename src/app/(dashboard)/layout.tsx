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
            <div className="flex h-screen overflow-hidden bg-[#F2F4F8] dark:bg-zinc-950">
                {/* Desktop Sidebar */}
                <aside className="hidden md:block h-full">
                    <Sidebar />
                </aside>

                <div className="flex-1 flex flex-col h-full overflow-hidden">
                    {/* Mobile Header */}
                    <header className="flex md:hidden items-center justify-between px-4 h-16 bg-[#3B82F6] text-white shadow-none shrink-0 z-10 sticky top-0">
                        <div className="font-bold text-xl tracking-tight text-white flex items-center gap-2">
                            <span className="bg-white/20 p-1.5 rounded-lg">🤖</span>
                            Jarvis
                        </div>
                        <div className="flex items-center gap-2">
                            <Link href="/profile" className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <span className="sr-only">Perfil</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                            </Link>
                            <LogoutButton />
                        </div>
                    </header>

                    {/* Main Content Area */}
                    <main className="flex-1 overflow-y-auto px-2 py-4 md:p-6 animate-in fade-in duration-500 bg-[#F2F4F8] dark:bg-zinc-950">
                        <div className="container mx-auto max-w-5xl space-y-4 md:space-y-6 pb-24 md:pb-0 px-0 md:px-2">
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
