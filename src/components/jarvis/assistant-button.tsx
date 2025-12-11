"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Image as ImageIcon, Send, X, Loader2, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useFinance } from "@/hooks/use-finance";
import { toast } from "sonner";
import { TransactionForm } from "../finance/transaction-form";

import { cn } from "@/lib/utils";

interface JarvisAssistantProps {
    trigger?: React.ReactNode;
    className?: string;
}

export function JarvisAssistant({ trigger, className }: JarvisAssistantProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [inputMode, setInputMode] = useState<'text' | 'voice'>('text');
    const [textInput, setTextInput] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State for Action Handling
    const [suggestedTransaction, setSuggestedTransaction] = useState<any>(null);
    const [showTransactionModal, setShowTransactionModal] = useState(false);

    const { familyId } = useFinance();

    // Voice Recognition Setup
    const startListening = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            toast.error("Seu navegador não suporta reconhecimento de voz.");
            return;
        }

        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.lang = 'pt-BR';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            setIsRecording(true);
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setTextInput(prev => prev + (prev ? " " : "") + transcript);
        };

        recognition.onerror = (event: any) => {
            console.error(event.error);
            setIsRecording(false);
        };

        recognition.onend = () => {
            setIsRecording(false);
        };

        recognition.start();
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        if (!textInput && !selectedImage) return;

        setIsProcessing(true);
        try {
            const payload = {
                type: selectedImage ? 'image' : 'text',
                content: selectedImage || textInput,
                context: { familyId }
            };

            const response = await fetch('/api/jarvis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.action === 'transaction') {
                setSuggestedTransaction(result.data);
                setShowTransactionModal(true);
                setIsOpen(false); // Close assistant
            } else if (result.action === 'event' || result.action === 'task') {
                toast.info("Ainda estamos implementando a criação de eventos!", { description: JSON.stringify(result.data) });
            } else {
                toast.error("Não entendi o comando. Tente novamente.");
            }

            // Reset
            setTextInput("");
            setSelectedImage(null);

        } catch (error) {
            console.error(error);
            toast.error("Erro ao processar comando.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <>
            {trigger ? (
                <div onClick={() => setIsOpen(true)} className={className}>
                    {trigger}
                </div>
            ) : (
                /* Floating Trigger Button (Default) */
                <Button
                    size="icon"
                    className={cn(
                        "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-gradient-to-tr from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-300 z-50",
                        className
                    )}
                    onClick={() => setIsOpen(true)}
                >
                    <Sparkles className="h-6 w-6 text-white animate-pulse" />
                </Button>
            )}

            {/* Assistant Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-purple-600" />
                            Assistente Jarvis
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex flex-col gap-4 py-4">
                        {/* Selected Image Preview */}
                        {selectedImage && (
                            <div className="relative w-full h-32 bg-muted rounded-md overflow-hidden">
                                <img src={selectedImage} alt="Preview" className="w-full h-full object-contain" />
                                <Button
                                    size="icon"
                                    variant="destructive"
                                    className="absolute top-2 right-2 h-6 w-6"
                                    onClick={() => setSelectedImage(null)}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        )}

                        {/* Input Area */}
                        <Textarea
                            placeholder="Ex: 'Gastei 50 reais no Uber' ou envie a foto de um recibo..."
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            className="resize-none"
                            rows={3}
                        />

                        {/* Action Buttons */}
                        <div className="flex justify-between items-center">
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={startListening}
                                    className={isRecording ? "bg-red-100 border-red-500 animate-pulse text-red-600" : ""}
                                    title="Falar"
                                >
                                    <Mic className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => fileInputRef.current?.click()}
                                    title="Enviar Imagem"
                                >
                                    <ImageIcon className="h-4 w-4" />
                                </Button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageSelect}
                                />
                            </div>

                            <Button
                                onClick={handleSubmit}
                                disabled={(!textInput && !selectedImage) || isProcessing}
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processando...
                                    </>
                                ) : (
                                    <>
                                        Enviar <Send className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Smart Transaction Modal (Auto-fills form) */}
            {suggestedTransaction && (
                <TransactionForm
                    open={showTransactionModal}
                    onOpenChange={setShowTransactionModal}
                    initialData={{
                        amount: suggestedTransaction.amount,
                        description: suggestedTransaction.description,
                        date: suggestedTransaction.date ? new Date(suggestedTransaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                        type: suggestedTransaction.type,
                        // Categories might need mapping logic or user selects manually if not exact match
                    }}
                />
            )}
        </>
    );
}
