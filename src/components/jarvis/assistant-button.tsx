"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Image as ImageIcon, Send, X, Loader2, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useFinance } from "@/hooks/use-finance";
import { useEvents } from "@/hooks/use-events";
import { toast } from "sonner";
import { TransactionForm } from "../finance/transaction-form";
import { cn } from "@/lib/utils";

interface JarvisAssistantProps {
    trigger?: React.ReactNode;
    className?: string;
}

export function JarvisAssistant({ trigger, className }: JarvisAssistantProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [textInput, setTextInput] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State for Action Handling
    const [suggestedTransaction, setSuggestedTransaction] = useState<any>(null);
    const [showTransactionModal, setShowTransactionModal] = useState(false);

    const { familyId } = useFinance();
    const { createEvent, deleteEvent, updateEvent, events } = useEvents();

    // Voice Recognition Setup
    const startListening = () => {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;

        if (!SpeechRecognition) {
            toast.error("Seu navegador não suporta reconhecimento de voz.", {
                description: "Tente usar o Chrome no Android ou Desktop. O iOS (iPhone) tem suporte limitado.",
                duration: 5000
            });
            return;
        }

        try {
            const recognition = new SpeechRecognition();
            recognition.lang = 'pt-BR';
            recognition.continuous = false;
            recognition.interimResults = false;

            recognition.onstart = () => {
                setIsRecording(true);
                toast.success("Ouvindo...", { duration: 2000 });
            };

            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setTextInput(prev => prev + (prev ? " " : "") + transcript);
                toast.success("Entendi!");
            };

            recognition.onerror = (event: any) => {
                console.error("Speech Error:", event.error);
                setIsRecording(false);
                if (event.error === 'not-allowed') {
                    toast.error("Permissão de microfone negada.");
                } else if (event.error === 'no-speech') {
                    toast.warning("Não ouvi nada. Tente novamente.");
                } else {
                    toast.error("Erro no reconhecimento de voz: " + event.error);
                }
            };

            recognition.onend = () => {
                setIsRecording(false);
            };

            recognition.start();
        } catch (e) {
            console.error(e);
            toast.error("Erro ao iniciar microfone.");
        }
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
                setIsOpen(false);
            } else if (result.action === 'event') {
                try {
                    const eventData = result.data;
                    const { error } = await createEvent({
                        title: eventData.title,
                        description: eventData.description || "",
                        start_time: eventData.start,
                        end_time: eventData.end,
                        is_all_day: eventData.allDay || false,
                        location: eventData.location || ""
                    });

                    if (error) throw error;

                    toast.success("Evento criado com sucesso!", {
                        description: `${eventData.title} - ${new Date(eventData.start).toLocaleDateString()}`
                    });
                    setIsOpen(false);
                } catch (err) {
                    console.error(err);
                    toast.error("Erro ao criar evento.");
                }

            } else if (result.action === 'delete_event') {
                const searchTitle = result.data.original_reference?.toLowerCase();

                // Find best match: case insensitive title match
                // We could enhance this with date filtering if 'result.data.date' is present
                const targetEvent = events.find(e => e.title.toLowerCase().includes(searchTitle));

                if (targetEvent) {
                    const { error } = await deleteEvent(targetEvent.id);
                    if (error) throw error;
                    toast.success(`Evento excluído: ${targetEvent.title}`);
                    setIsOpen(false);
                } else {
                    toast.error(`Não encontrei um evento chamado "${result.data.original_reference}".`);
                }

            } else if (result.action === 'update_event') {
                const searchTitle = result.data.original_reference?.toLowerCase();
                const targetEvent = events.find(e => e.title.toLowerCase().includes(searchTitle));

                if (targetEvent) {
                    const updates: any = {};
                    if (result.data.new_title) updates.title = result.data.new_title;
                    if (result.data.new_start) updates.start_time = result.data.new_start;
                    if (result.data.new_end) updates.end_time = result.data.new_end;

                    const { error } = await updateEvent(targetEvent.id, updates);
                    if (error) throw error;
                    toast.success(`Evento atualizado: ${updates.title || targetEvent.title}`);
                    setIsOpen(false);
                } else {
                    toast.error(`Não encontrei o evento para editar.`);
                }

            } else if (result.action === 'task') {
                toast.info("Ainda estamos implementando a criação de tarefas!", { description: JSON.stringify(result.data) });
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
