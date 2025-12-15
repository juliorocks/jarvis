"use client";

import { motion } from "framer-motion";
import { Mic, Wifi, Battery, Signal, Calendar, CreditCard, ChevronLeft, Menu, Plus, Check } from "lucide-react";

interface PhoneMockupProps {
    type?: "voice" | "calendar" | "finance";
    className?: string;
}

export function PhoneMockup({ type = "voice", className }: PhoneMockupProps) {
    return (
        <div className={`relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-900 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl ${className}`}>
            <div className="w-[148px] h-[18px] bg-gray-800 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute"></div>
            <div className="h-[32px] w-[3px] bg-gray-800 absolute -left-[17px] top-[72px] rounded-l-lg"></div>
            <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[124px] rounded-l-lg"></div>
            <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[178px] rounded-l-lg"></div>
            <div className="h-[64px] w-[3px] bg-gray-800 absolute -right-[17px] top-[142px] rounded-r-lg"></div>
            <div className="rounded-[2rem] overflow-hidden w-full h-full bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white relative">
                {/* Status Bar */}
                <div className="flex items-center justify-between px-6 pt-3 pb-2 text-[10px] font-medium text-gray-500">
                    <span>9:41</span>
                    <div className="flex items-center gap-1.5">
                        <Signal className="h-2.5 w-2.5" />
                        <Wifi className="h-2.5 w-2.5" />
                        <Battery className="h-2.5 w-2.5" />
                    </div>
                </div>

                {/* Content */}
                <div className="h-full w-full relative">
                    {type === "voice" && <VoiceScreen />}
                    {type === "calendar" && <CalendarScreen />}
                    {type === "finance" && <FinanceScreen />}
                </div>

                {/* Home Indicator */}
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full"></div>
            </div>
        </div>
    );
}

function VoiceScreen() {
    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900 p-6 pt-12">
            <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground uppercase tracking-widest">Jarvis AI</p>
                    <h3 className="text-2xl font-semibold leading-tight">Como posso ajudar?</h3>
                </div>

                <div className="relative">
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute inset-0 bg-blue-500 rounded-full blur-xl"
                    />
                    <div className="relative h-24 w-24 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <Mic className="h-10 w-10 text-white" />
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-800/80 p-4 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-700/50 w-full max-w-[240px]">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <p className="text-xs font-medium text-muted-foreground">Ouvindo...</p>
                    </div>
                    <p className="text-sm font-medium">"Agendar almoço com a Sara amanhã ao meio-dia."</p>
                </div>
            </div>
            <div className="h-20" /> {/* Spacer for bottom */}
        </div>
    );
}

function CalendarScreen() {
    const events = [
        { time: "09:00", title: "Daily Sync", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
        { time: "12:00", title: "Almoço c/ Sara", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300", highlight: true },
        { time: "15:30", title: "Revisão Financeira", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
        { time: "18:00", title: "Academia", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
    ];

    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-950">
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900">
                <div className="flex items-center gap-2 text-zinc-400">
                    <Menu className="h-5 w-5" />
                </div>
                <span className="font-semibold text-sm">Calendário</span>
                <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <Plus className="h-4 w-4" />
                </div>
            </div>

            {/* Calendar Strip */}
            <div className="px-6 py-4">
                <div className="flex justify-between text-center">
                    {['Seg', 'Ter', 'Qua', 'Qui', 'Sex'].map((day, i) => (
                        <div key={day} className={`flex flex-col gap-1 items-center ${i === 2 ? 'text-blue-600' : 'text-zinc-400'}`}>
                            <span className="text-[10px] font-medium uppercase">{day}</span>
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold ${i === 2 ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : ''}`}>
                                {12 + i}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 px-6 space-y-4 overflow-hidden pt-2">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Hoje</p>
                {events.map((evt, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`p-3 rounded-xl border-l-4 ${evt.highlight ? 'bg-zinc-50 dark:bg-zinc-900 border-blue-500 shadow-sm' : 'border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900/50'}`}
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="text-sm font-semibold">{evt.title}</h4>
                                <span className="text-xs text-zinc-500">{evt.time}</span>
                            </div>
                            {evt.highlight && <div className="h-5 w-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><Check className="h-3 w-3" /></div>}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}

function FinanceScreen() {
    const txs = [
        { label: "Mercado Semanal", val: "-145,00", icon: CreditCard },
        { label: "Uber", val: "-24,90", icon: CreditCard },
        { label: "Freela Design", val: "+850,00", green: true, icon: CreditCard },
    ];

    return (
        <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950">
            {/* Header Card */}
            <div className="px-6 py-8 bg-black text-white rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-800 rounded-full blur-3xl -mr-10 -mt-10 opacity-50"></div>
                <div className="relative z-10">
                    <p className="text-xs text-zinc-400 mb-1">Saldo Atual</p>
                    <h2 className="text-3xl font-bold">R$ 3.240,50</h2>
                    <div className="flex gap-2 mt-4">
                        <div className="px-3 py-1 rounded-full bg-zinc-800 text-[10px] font-medium border border-zinc-700">Entradas +4.2k</div>
                        <div className="px-3 py-1 rounded-full bg-zinc-800 text-[10px] font-medium border border-zinc-700 text-red-300">Saídas -980</div>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 px-6 pt-6 space-y-3">
                <div className="flex justify-between items-end mb-2">
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">Recentes</p>
                    <p className="text-[10px] text-blue-600 font-medium">Ver tudo</p>
                </div>

                {txs.map((t, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + (i * 0.1) }}
                        className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${t.green ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                <t.icon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold">{t.label}</p>
                                <p className="text-[10px] text-zinc-500">Hoje, 14:30</p>
                            </div>
                        </div>
                        <span className={`text-xs font-bold ${t.green ? 'text-green-600' : 'text-zinc-900 dark:text-zinc-100'}`}>
                            {t.val}
                        </span>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
