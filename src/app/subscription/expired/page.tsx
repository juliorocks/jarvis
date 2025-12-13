"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, CreditCard } from "lucide-react";
import { LogoutButton } from "@/components/layout/logout-button";

export default function ExpiredSubscriptionPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 p-4">
            <Card className="max-w-md w-full shadow-lg border-red-100 dark:border-red-900/30">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                        <Lock className="h-8 w-8 text-red-600 dark:text-red-400" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Acesso Bloqueado
                    </CardTitle>
                    <CardDescription className="text-base pt-2">
                        Seu período de teste ou assinatura expirou.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-center text-sm text-gray-600 dark:text-gray-400">
                    <p>
                        Para continuar utilizando o Jarvis e não perder seus dados, por favor, regularize sua assinatura.
                    </p>
                    <div className="bg-gray-100 dark:bg-zinc-900 p-4 rounded-lg text-left text-sm border">
                        <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Dúvidas?</p>
                        <p>Entre em contato com o administrador para reativar seu acesso.</p>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                    <Button className="w-full gap-2" asChild>
                        <a href="mailto:admin@jarvis.app">
                            Contatar Suporte
                        </a>
                    </Button>
                    <div className="w-full flex justify-center">
                        <LogoutButton />
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
