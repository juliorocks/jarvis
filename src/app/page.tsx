"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Mic, Command, CreditCard, Users, ShieldCheck, Zap, Globe, Menu, PlayCircle, Star, MessageCircle, DollarSign, Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { PhoneMockup } from "@/components/landing/phone-mockup";

export default function LandingPage() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const fadeIn = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    };

    return (
        <div className="flex flex-col min-h-screen bg-white text-zinc-900 overflow-x-hidden selection:bg-blue-100 selection:text-blue-900">

            {/* --- COMPONENT: NAVBAR --- */}
            <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 p-2 rounded-xl">
                            <Command className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">Jarvis</span>
                    </div>

                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-500">
                        <Link href="#features" className="hover:text-blue-600 transition-colors">Como funciona</Link>
                        <Link href="#pricing" className="hover:text-blue-600 transition-colors">Planos</Link>
                        <Link href="#faq" className="hover:text-blue-600 transition-colors">Dúvidas</Link>
                    </nav>

                    <div className="hidden md:flex items-center gap-4">
                        <Link href="/login" className="text-sm font-medium hover:text-blue-600">Entrar</Link>
                        <Button asChild className="rounded-full bg-blue-600 hover:bg-blue-700 text-white px-6">
                            <Link href="/login">Começar Grátis</Link>
                        </Button>
                    </div>

                    <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        <Menu className="h-6 w-6" />
                    </button>
                </div>

                {isMenuOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        className="md:hidden border-b bg-white overflow-hidden"
                    >
                        <div className="flex flex-col p-4 gap-4 text-center">
                            <Link href="#features" onClick={() => setIsMenuOpen(false)}>Como funciona</Link>
                            <Link href="#pricing" onClick={() => setIsMenuOpen(false)}>Planos</Link>
                            <Link href="/login" onClick={() => setIsMenuOpen(false)} className="font-bold text-blue-600">Entrar</Link>
                        </div>
                    </motion.div>
                )}
            </header>

            {/* --- HERO SECTION --- */}
            <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 relative overflow-hidden">
                <div className="container mx-auto px-4 flex flex-col items-center text-center max-w-5xl">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeIn}
                        className="space-y-6"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold mb-4 border border-blue-100">
                            <Star className="h-4 w-4 fill-current" />
                            <span>Seu Assistente Pessoal, só que muito mais eficiente.</span>
                        </div>

                        <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight leading-[1.1] text-zinc-900">
                            Controle toda a sua vida <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">apenas falando.</span>
                        </h1>

                        <p className="text-xl text-zinc-500 max-w-2xl mx-auto leading-relaxed">
                            Esqueça planilhas complicadas e apps de agenda chatos. Com o Jarvis, você manda um áudio e tudo acontece magicamente.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                            <Button size="lg" className="rounded-full text-lg px-8 h-12 w-full sm:w-auto bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-transform hover:scale-105" asChild>
                                <Link href="/login">Testar Grátis Agora <ArrowRight className="ml-2 h-5 w-5" /></Link>
                            </Button>
                            <Button size="lg" variant="outline" className="rounded-full text-lg px-8 h-12 w-full sm:w-auto border-zinc-200" asChild>
                                <Link href="#demo">Ver Vídeo</Link>
                            </Button>
                        </div>
                    </motion.div>

                    {/* HERO MOCKUP */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        viewport={{ once: true }}
                        className="mt-20 relative z-10"
                    >
                        {/* Decorative blobs */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-400/20 rounded-full blur-[100px] -z-10" />

                        <PhoneMockup type="voice" className="rotate-[-2deg] hover:rotate-0 transition-transform duration-500" />
                    </motion.div>
                </div>
            </section>


            {/* --- FEATURE 1: CALENDAR --- */}
            <section className="py-24 bg-zinc-50">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
                        <motion.div
                            initial={{ opacity: 0, x: -40 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="lg:w-1/2"
                        >
                            <div className="bg-orange-100 p-3 rounded-2xl w-fit mb-6">
                                <CalendarIcon className="h-8 w-8 text-orange-600" />
                            </div>
                            <h2 className="text-3xl md:text-5xl font-bold mb-6">Agenda Inteligente</h2>
                            <p className="text-xl text-zinc-500 leading-relaxed mb-8">
                                &quot;Já pensou ter toda a sua agenda organizada apenas enviando uma mensagem de voz?&quot;
                            </p>
                            <ul className="space-y-4">
                                <FeatureItem text="Adiciona reuniões, consultas e festas automaticamente." />
                                <FeatureItem text="Te lembra antes de cada compromisso." />
                                <FeatureItem text="Sincroniza direto com seu Google Calendar." />
                            </ul>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 40 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="lg:w-1/2 flex justify-center relative"
                        >
                            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-orange-200 to-transparent rounded-full blur-3xl opacity-50" />
                            {/* Combined composition: Phone Mockup + User Photo */}
                            <div className="relative">
                                <PhoneMockup type="calendar" className="z-20 relative shadow-2xl" />
                                <div className="absolute -bottom-10 -right-20 z-10 w-48 h-64 rounded-2xl overflow-hidden shadow-xl border-4 border-white hidden md:block">
                                    <img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop" alt="Pessoa feliz usando celular" className="w-full h-full object-cover" />
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* --- FEATURE 2: FINANCE --- */}
            <section className="py-24">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col-reverse lg:flex-row items-center gap-16 lg:gap-24">
                        <motion.div
                            initial={{ opacity: 0, x: -40 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="lg:w-1/2 flex justify-center relative"
                        >
                            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tl from-green-200 to-transparent rounded-full blur-3xl opacity-50" />
                            <div className="relative">
                                <PhoneMockup type="finance" className="z-20 relative shadow-2xl" />
                                <div className="absolute -top-10 -left-20 z-10 w-48 h-64 rounded-2xl overflow-hidden shadow-xl border-4 border-white hidden md:block">
                                    <img src="https://images.unsplash.com/photo-1574755866827-046645367566?q=80&w=800&auto=format&fit=crop" alt="Pessoa comprando café" className="w-full h-full object-cover" />
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 40 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="lg:w-1/2"
                        >
                            <div className="bg-green-100 p-3 rounded-2xl w-fit mb-6">
                                <DollarSign className="h-8 w-8 text-green-600" />
                            </div>
                            <h2 className="text-3xl md:text-5xl font-bold mb-6">Controle Financeiro</h2>
                            <p className="text-xl text-zinc-500 leading-relaxed mb-8">
                                &quot;Controle seus gastos na palma da mão de forma simples e muito prática.&quot;
                            </p>
                            <ul className="space-y-4">
                                <FeatureItem text="Tirou foto do comprovante? O Jarvis anota." />
                                <FeatureItem text="Saiba exatamente para onde vai seu dinheiro." />
                                <FeatureItem text="Categorias automáticas (Alimentação, Transporte...)." />
                            </ul>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* --- PRICING --- */}
            <section id="pricing" className="py-24 bg-zinc-50">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">Preço de um cafézinho ☕</h2>
                        <p className="text-lg text-zinc-500">Mais barato que esquecer de pagar uma conta e levar multa.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {/* Individual */}
                        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-zinc-200 hover:shadow-lg transition-all">
                            <h3 className="text-xl font-bold mb-2">Individual</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-4xl font-extrabold">R$ 14,90</span>
                                <span className="text-zinc-500">/mês</span>
                            </div>
                            <p className="text-sm text-zinc-500 mb-8">Para você organizar sua vida pessoal.</p>
                            <Button className="w-full rounded-full h-12 text-base bg-zinc-100 text-zinc-900 hover:bg-zinc-200" asChild>
                                <Link href="/login">Escolher Individual</Link>
                            </Button>
                        </div>

                        {/* Family */}
                        <div className="bg-black p-8 rounded-[2rem] shadow-xl text-white relative transform md:-translate-y-4 border-4 border-blue-500/20">
                            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-[1.5rem]">
                                MAIS VANTAJOSO
                            </div>
                            <h3 className="text-xl font-bold mb-2">Família</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-4xl font-extrabold">R$ 29,90</span>
                                <span className="text-zinc-400">/mês</span>
                            </div>
                            <p className="text-sm text-zinc-400 mb-8">Até 5 pessoas. Carteiras compartilhadas e agenda da casa.</p>
                            <Button className="w-full rounded-full h-12 text-base bg-blue-600 hover:bg-blue-700 text-white border-none" asChild>
                                <Link href="/login">Escolher Família</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- TESTIMONIAL / SOCIAL PROOF (Placeholder) --- */}
            <section className="py-24">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-2xl font-medium max-w-3xl mx-auto leading-relaxed italic">
                        &quot;Eu perdia horas tentando lembrar onde gastei meu salário. Com o Jarvis, eu só falo no carro voltando do trabalho e pronto. Minha vida mudou.&quot;
                    </p>
                    <div className="mt-8 flex items-center justify-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-zinc-200 flex items-center justify-center font-bold text-lg">M</div>
                        <div className="text-left">
                            <p className="font-bold text-sm">Marcos Silva</p>
                            <div className="flex text-yellow-500 h-4 w-4">
                                <Star className="h-3 w-3 fill-current" />
                                <Star className="h-3 w-3 fill-current" />
                                <Star className="h-3 w-3 fill-current" />
                                <Star className="h-3 w-3 fill-current" />
                                <Star className="h-3 w-3 fill-current" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- FAQ --- */}
            <section id="faq" className="py-24 bg-zinc-50">
                <div className="container mx-auto px-4 max-w-3xl">
                    <h2 className="text-3xl font-bold mb-12 text-center">Perguntas Frequentes</h2>
                    <div className="space-y-4">
                        <FaqItem q="Funciona no iPhone e Android?" a="Sim! O Jarvis funciona direto no navegador do seu celular, sem precisar baixar nada pesado na loja de aplicativos." />
                        <FaqItem q="Preciso digitar alguma coisa?" a="Raramente. A ideia é usar a voz para tudo. Mas se quiser, você pode digitar também." />
                        <FaqItem q="É seguro conectar minha agenda?" a="Totalmente. Usamos a conexão oficial do Google, super segura e criptografada." />
                    </div>
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="py-12 border-t border-zinc-100">
                <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="bg-zinc-900 p-1.5 rounded-lg">
                            <Command className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-bold">Jarvis</span>
                    </div>
                    <p className="text-sm text-zinc-500">
                        © {new Date().getFullYear()} Jarvis AI. Feito para simplificar.
                    </p>
                    <div className="flex gap-6 text-sm text-zinc-500">
                        <Link href="#">Privacidade</Link>
                        <Link href="#">Termos</Link>
                        <Link href="#">Contato</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function FeatureItem({ text }: { text: string }) {
    return (
        <li className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Check className="h-3.5 w-3.5" />
            </div>
            <span className="text-lg text-zinc-600">{text}</span>
        </li>
    )
}

function FaqItem({ q, a }: { q: string, a: string }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div
            className="bg-white border border-zinc-200 rounded-2xl p-6 cursor-pointer hover:shadow-md transition-all"
            onClick={() => setIsOpen(!isOpen)}
        >
            <div className="flex justify-between items-center font-bold text-lg">
                {q}
                <ArrowRight className={`h-5 w-5 transform transition-transform ${isOpen ? 'rotate-90' : ''} text-zinc-400`} />
            </div>
            {isOpen && (
                <motion.p
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="mt-3 text-zinc-500 leading-relaxed"
                >
                    {a}
                </motion.p>
            )}
        </div>
    )
}
