"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Mic, Command, CreditCard, Users, ShieldCheck, Zap, Globe, Menu } from "lucide-react";
import { useState } from "react";

export default function LandingPage() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="flex flex-col min-h-screen bg-background overflow-x-hidden transition-colors duration-300">

            {/* --- HEADER --- */}
            <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-white/10 dark:border-white/5">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary/20 p-2 rounded-lg">
                            <Command className="h-6 w-6 text-primary" />
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
                            Jarvis
                        </span>
                    </div>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
                        <Link href="#features" className="hover:text-primary transition-colors">Funcionalidades</Link>
                        <Link href="#pricing" className="hover:text-primary transition-colors">Planos</Link>
                        <Link href="#faq" className="hover:text-primary transition-colors">FAQ</Link>
                    </nav>

                    <div className="hidden md:flex items-center gap-4">
                        <Button variant="ghost" asChild>
                            <Link href="/login">Entrar</Link>
                        </Button>
                        <Button asChild className="rounded-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                            <Link href="/login">Começar Agora</Link>
                        </Button>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        <Menu className="h-6 w-6" />
                    </button>
                </div>

                {/* Mobile Nav */}
                {isMenuOpen && (
                    <div className="md:hidden absolute top-16 left-0 w-full bg-background border-b shadow-xl p-4 flex flex-col gap-4 animate-in slide-in-from-top-2">
                        <Link href="#features" className="text-lg font-medium p-2 hover:bg-muted rounded text-center" onClick={() => setIsMenuOpen(false)}>Funcionalidades</Link>
                        <Link href="#pricing" className="text-lg font-medium p-2 hover:bg-muted rounded text-center" onClick={() => setIsMenuOpen(false)}>Planos</Link>
                        <Button className="w-full" asChild>
                            <Link href="/login">Acessar Plataforma</Link>
                        </Button>
                    </div>
                )}
            </header>

            {/* --- HERO SECTION --- */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                {/* Background Gradients */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/20 rounded-full blur-[120px] -z-10 opacity-50 dark:opacity-20 animate-pulse" />
                <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-purple-500/10 rounded-full blur-[100px] -z-10 opacity-30" />

                <div className="container mx-auto px-4 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 border border-primary/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Zap className="h-4 w-4" />
                        <span>Inteligência Artificial de Última Geração</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground mb-6 max-w-4xl mx-auto leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-700">
                        Seu <span className="text-primary">Segundo Cérebro</span>. <br />
                        Comande tudo com a voz.
                    </h1>

                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
                        Chega de digitar. O Jarvis transforma seus áudios em ações reais. Agende compromissos, registre gastos e organize sua vida falando naturalmente.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                        <Button size="lg" className="rounded-full text-lg px-8 h-12 w-full sm:w-auto shadow-xl shadow-primary/20 hover:scale-105 transition-transform" asChild>
                            <Link href="/login">Testar Gratuitamente <ArrowRight className="ml-2 h-5 w-5" /></Link>
                        </Button>
                        <Button size="lg" variant="outline" className="rounded-full text-lg px-8 h-12 w-full sm:w-auto hover:bg-muted" asChild>
                            <Link href="#demo">Ver como funciona</Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* --- AUDIO DEMO SECTION --- */}
            <section id="demo" className="py-24 bg-muted/50 dark:bg-muted/10">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto bg-background rounded-3xl p-8 md:p-12 shadow-2xl border border-white/5 relative overflow-hidden">
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div className="space-y-6 relative z-10">
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                                    <Mic className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="text-3xl font-bold">Mágica Instantânea</h3>
                                <p className="text-lg text-muted-foreground">
                                    Basta segurar o botão e falar. O Jarvis entende o contexto, categoriza a informação e executa a ação.
                                </p>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border border-border/50">
                                        <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                                            <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Você diz:</p>
                                            <p className="text-base font-semibold">&quot;Gastei 45 reais no almoço com o cliente.&quot;</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border border-border/50">
                                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                                            <Command className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Jarvis faz:</p>
                                            <p className="text-base font-semibold">Registra despesa de R$ 45,00 em &quot;Alimentação&quot;.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="relative">
                                {/* Visual Mockup */}
                                <div className="relative z-10 bg-zinc-950 rounded-[2.5rem] p-4 border-4 border-zinc-800 shadow-2xl max-w-[320px] mx-auto">
                                    <div className="bg-background rounded-[2rem] h-[550px] overflow-hidden flex flex-col relative">
                                        {/* Mock App Header */}
                                        <div className="h-14 border-b flex items-center justify-center font-semibold">Jarvis</div>

                                        {/* Mock Chat */}
                                        <div className="flex-1 p-4 space-y-4 overflow-hidden">
                                            <div className="bg-muted p-3 rounded-2xl rounded-tl-none max-w-[80%] text-sm">
                                                Olá! Em que posso ajudar hoje?
                                            </div>
                                            <div className="bg-primary text-primary-foreground p-3 rounded-2xl rounded-tr-none max-w-[80%] ml-auto text-sm">
                                                Marcar dentista para terça-feira às 14h.
                                            </div>
                                            <div className="bg-muted p-3 rounded-2xl rounded-tl-none max-w-[80%] text-sm">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Check className="h-4 w-4 text-green-500" />
                                                    <span className="font-bold">Agendado</span>
                                                </div>
                                                Dentista adicionado ao Google Calendar para Terça, 14:00.
                                            </div>
                                        </div>

                                        {/* Mock Mic Button */}
                                        <div className="h-24 bg-gradient-to-t from-background to-transparent absolute bottom-0 w-full flex items-center justify-center pb-4">
                                            <div className="h-16 w-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/40 animate-pulse">
                                                <Mic className="h-8 w-8 text-white" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Decorative blobs */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/20 blur-[100px] -z-10" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- FEATURES --- */}
            <section id="features" className="py-24">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4">Tudo o que você precisa.</h2>
                        <p className="text-xl text-muted-foreground">O Jarvis não é apenas um bloco de notas. É um sistema operacional completo para sua vida pessoal e familiar.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<CreditCard className="h-8 w-8 text-primary" />}
                            title="Finanças Automatizadas"
                            description="Controle receitas e despesas. O Jarvis categoriza automaticamente e gera relatórios para você saber onde seu dinheiro vai."
                        />
                        <FeatureCard
                            icon={<Users className="h-8 w-8 text-purple-500" />}
                            title="Gestão Familiar"
                            description="Compartilhe carteiras e agendas. Saiba os gastos da casa e sincronize eventos familiares em um só lugar."
                        />
                        <FeatureCard
                            icon={<Globe className="h-8 w-8 text-green-500" />}
                            title="Agenda Integrada"
                            description="Sincronização bidirecional com Google Calendar. Nunca mais perca um compromisso ou esqueça de pagar uma conta."
                        />
                    </div>
                </div>
            </section>

            {/* --- PRICING --- */}
            <section id="pricing" className="py-24 bg-muted/30">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4">Planos Simples e Transparentes</h2>
                        <p className="text-xl text-muted-foreground">Comece a organizar sua vida hoje mesmo. Sem taxas ocultas.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {/* Individual Plan */}
                        <div className="bg-background rounded-3xl p-8 border hover:border-primary/50 transition-all shadow-lg hover:shadow-xl relative flex flex-col">
                            <div className="mb-8">
                                <h3 className="text-xl font-bold text-muted-foreground mb-2">Plano Individual</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-extrabold">R$ 14,90</span>
                                    <span className="text-muted-foreground">/mês</span>
                                </div>
                                <p className="mt-4 text-muted-foreground">Perfeito para quem quer dominar sua própria produtividade e finanças.</p>
                            </div>

                            <ul className="space-y-4 mb-8 flex-1">
                                <PricingCheck text="1 Usuário" />
                                <PricingCheck text="Comandos de Voz Ilimitados" />
                                <PricingCheck text="Dashboards Financeiros" />
                                <PricingCheck text="Integração com Calendar" />
                                <PricingCheck text="Suporte por E-mail" />
                            </ul>

                            <Button className="w-full rounded-full py-6 text-lg" variant="outline" asChild>
                                <Link href="/login?plan=individual">Escolher Individual</Link>
                            </Button>
                        </div>

                        {/* Family Plan */}
                        <div className="bg-gradient-to-b from-zinc-900 to-black text-white rounded-3xl p-8 border border-zinc-700 shadow-2xl relative flex flex-col transform md:-translate-y-4">
                            <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-2xl">
                                POPULAR
                            </div>
                            <div className="mb-8">
                                <h3 className="text-xl font-bold text-gray-300 mb-2">Plano Família</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-extrabold">R$ 29,90</span>
                                    <span className="text-gray-400">/mês</span>
                                </div>
                                <p className="mt-4 text-gray-400">A melhor opção para casais e famílias que querem crescer juntos.</p>
                            </div>

                            <ul className="space-y-4 mb-8 flex-1">
                                <PricingCheck text="Até 5 Usuários" dark />
                                <PricingCheck text="Tudo do Plano Individual" dark />
                                <PricingCheck text="Carteiras Compartilhadas" dark />
                                <PricingCheck text="Visão Financeira Unificada" dark />
                                <PricingCheck text="Gestão de Permissões" dark />
                            </ul>

                            <Button className="w-full rounded-full py-6 text-lg bg-primary hover:bg-primary/90 border-none text-white shadow-lg shadow-primary/40" asChild>
                                <Link href="/login?plan=family">Escolher Família</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- FAQ --- */}
            <section id="faq" className="py-24">
                <div className="container mx-auto px-4 max-w-3xl">
                    <h2 className="text-3xl font-bold mb-12 text-center">Perguntas Frequentes</h2>

                    <div className="space-y-6">
                        <FaqItem
                            q="Como funciona o comando de voz?"
                            a="Basta clicar no botão de microfone no app e falar naturalmente. Nossa IA processa o áudio, entende se é uma despesa, um evento ou uma anotação e realiza a ação automaticamente."
                        />
                        <FaqItem
                            q="Preciso conectar meu cartão de crédito?"
                            a="Para começar o teste gratuito de 7 dias, não. Apenas para assinar os planos após o período de teste."
                        />
                        <FaqItem
                            q="Posso cancelar a qualquer momento?"
                            a="Sim! Não há fidelidade. Você pode cancelar sua assinatura quando quiser direto pelo painel de configurações."
                        />
                    </div>
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="bg-muted/30 py-12 border-t">
                <div className="container mx-auto px-4 grid md:grid-cols-4 gap-8">
                    <div className="col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="bg-primary/20 p-1.5 rounded-lg">
                                <Command className="h-5 w-5 text-primary" />
                            </div>
                            <span className="text-xl font-bold">Jarvis</span>
                        </div>
                        <p className="text-muted-foreground text-sm max-w-xs">Leve inteligência para sua rotina. O assistente pessoal que realmente funciona.</p>
                    </div>

                    <div>
                        <h4 className="font-bold mb-4">Produto</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="#features">Funcionalidades</Link></li>
                            <li><Link href="#pricing">Preços</Link></li>
                            <li><Link href="/login">Login</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold mb-4">Legal</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/privacy">Privacidade</Link></li>
                            <li><Link href="/terms">Termos de Uso</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="container mx-auto px-4 mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
                    © {new Date().getFullYear()} Jarvis AI. Todos os direitos reservados.
                </div>
            </footer>
        </div>
    );
}

// Helper Components
function FeatureCard({ icon, title, description }: { icon: any, title: string, description: string }) {
    return (
        <div className="bg-background p-8 rounded-3xl border shadow-sm hover:shadow-md transition-all">
            <div className="mb-6 bg-muted/50 w-16 h-16 rounded-2xl flex items-center justify-center">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-3">{title}</h3>
            <p className="text-muted-foreground leading-relaxed">
                {description}
            </p>
        </div>
    )
}

function PricingCheck({ text, dark = false }: { text: string, dark?: boolean }) {
    return (
        <li className="flex items-center gap-3">
            <div className={`h-5 w-5 rounded-full flex items-center justify-center ${dark ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'}`}>
                <Check className="h-3 w-3" />
            </div>
            <span className={dark ? 'text-gray-200' : 'text-muted-foreground'}>{text}</span>
        </li>
    )
}

function FaqItem({ q, a }: { q: string, a: string }) {
    return (
        <div className="bg-background border rounded-2xl p-6 shadow-sm">
            <h4 className="font-bold text-lg mb-2">{q}</h4>
            <p className="text-muted-foreground">{a}</p>
        </div>
    )
}
