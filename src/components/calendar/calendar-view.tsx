"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks, addYears, subYears, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, MapPin, Clock, Trash2, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { useEvents } from "@/hooks/use-events";
import { useFinance } from "@/hooks/use-finance";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function CalendarView() {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const { events, loading, createEvent, deleteEvent, updateEvent } = useEvents();
    const { transactions } = useFinance();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingEventId, setEditingEventId] = useState<string | null>(null);
    const [newEvent, setNewEvent] = useState({
        title: "",
        description: "",
        date: format(new Date(), "yyyy-MM-dd"),
        startTime: "09:00",
        endTime: "10:00",
        location: ""
    });

    // Recurrence State
    const [isRecurring, setIsRecurring] = useState(false);
    const [frequency, setFrequency] = useState("weekly");
    const [endDate, setEndDate] = useState("");

    const allEvents = [
        ...events,
        ...transactions.map(t => {
            const [y, m, d] = t.date.split('-').map(Number);
            const dt = new Date(y, m - 1, d, 12, 0, 0);
            return {
                id: `txn-${t.id}`,
                title: `${t.type === 'income' ? '+' : '-'} ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)} ${t.description}`,
                start_time: dt.toISOString(),
                end_time: dt.toISOString(),
                is_all_day: true,
                location: 'Financeiro',
                description: t.category?.name,
                is_transaction: true,
                color_class: t.type === 'income' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'
            };
        })
    ] as any[];

    const selectedDateEvents = allEvents.filter(event => {
        if (!date) return false;
        const eventDate = new Date(event.start_time);
        return eventDate.toDateString() === date.toDateString();
    });

    const [isSaving, setIsSaving] = useState(false);

    const handleCreateEvent = async () => {
        if (!newEvent.date || !newEvent.title) return;
        setIsSaving(true);
        try {
            const [year, month, day] = newEvent.date.split('-').map(Number);
            let currentDate = new Date(year, month - 1, day);

            if (isRecurring && !editingEventId && endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);

                let count = 0;
                const LIMIT = 52;

                while (currentDate <= end && count < LIMIT) {
                    const startDateTime = new Date(currentDate);
                    const [startHour, startMinute] = newEvent.startTime.split(':').map(Number);
                    startDateTime.setHours(startHour, startMinute);

                    const endDateTime = new Date(currentDate);
                    const [endHour, endMinute] = newEvent.endTime.split(':').map(Number);
                    endDateTime.setHours(endHour, endMinute);

                    const eventData = {
                        title: newEvent.title,
                        description: newEvent.description,
                        start_time: startDateTime.toISOString(),
                        end_time: endDateTime.toISOString(),
                        is_all_day: false,
                        location: newEvent.location
                    };

                    await createEvent(eventData); // Sequential wait

                    if (frequency === 'daily') currentDate = addDays(currentDate, 1);
                    else if (frequency === 'weekly') currentDate = addWeeks(currentDate, 1);
                    else if (frequency === 'biweekly') currentDate = addWeeks(currentDate, 2);
                    else if (frequency === 'monthly') currentDate = addMonths(currentDate, 1);
                    else if (frequency === 'yearly') currentDate = addYears(currentDate, 1);

                    count++;
                }
            } else {
                const startDateTime = new Date(currentDate);
                const [startHour, startMinute] = newEvent.startTime.split(':').map(Number);
                startDateTime.setHours(startHour, startMinute);

                const endDateTime = new Date(currentDate);
                const [endHour, endMinute] = newEvent.endTime.split(':').map(Number);
                endDateTime.setHours(endHour, endMinute);

                const eventData = {
                    title: newEvent.title,
                    description: newEvent.description,
                    start_time: startDateTime.toISOString(),
                    end_time: endDateTime.toISOString(),
                    is_all_day: false,
                    location: newEvent.location
                };

                if (editingEventId) {
                    await updateEvent(editingEventId, eventData);
                } else {
                    await createEvent(eventData);
                }
            }

            setIsDialogOpen(false);
            setNewEvent({
                title: "",
                description: "",
                date: date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
                startTime: "09:00",
                endTime: "10:00",
                location: ""
            });
            setIsRecurring(false);
            setFrequency("weekly");
            setEndDate("");
            setEditingEventId(null);
        } catch (error) {
            console.error("Failed to save event", error);
        } finally {
            setIsSaving(false);
        }
    };

    const openEditDialog = (event: any) => {
        setEditingEventId(event.id);
        setNewEvent({
            title: event.title,
            description: event.description || "",
            date: format(new Date(event.start_time), "yyyy-MM-dd"),
            startTime: format(new Date(event.start_time), "HH:mm"),
            endTime: format(new Date(event.end_time), "HH:mm"),
            location: event.location || ""
        });
        setIsDialogOpen(true);
    };

    const openNewDialog = () => {
        setEditingEventId(null);
        setNewEvent({
            title: "",
            description: "",
            date: date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
            startTime: "09:00",
            endTime: "10:00",
            location: ""
        });
        setIsDialogOpen(true);
    };

    return (
        <Tabs defaultValue="day" className="w-full space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <TabsList className="w-full md:w-auto h-auto p-1 grid grid-cols-4 md:flex">
                    <TabsTrigger value="day">Dia</TabsTrigger>
                    <TabsTrigger value="week">Semana</TabsTrigger>
                    <TabsTrigger value="month">Mês</TabsTrigger>
                    <TabsTrigger value="year">Ano</TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-2 self-end md:self-auto">
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={openNewDialog}>
                                <Plus className="mr-2 h-4 w-4" /> Novo Evento
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingEventId ? "Editar Evento" : "Adicionar Novo Evento"}</DialogTitle>
                                <DialogDescription>
                                    {editingEventId ? "Edite os detalhes do compromisso." : `Crie um novo compromisso para ${date ? format(date, "d 'de' MMMM", { locale: ptBR }) : "esta data"}.`}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="title">Título</Label>
                                    <Input
                                        id="title"
                                        value={newEvent.title}
                                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                        placeholder="Reunião de Projeto"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="date">Data</Label>
                                    <Input
                                        id="date"
                                        type="date"
                                        value={newEvent.date}
                                        onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="start">Início</Label>
                                        <Input
                                            id="start"
                                            type="time"
                                            value={newEvent.startTime}
                                            onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="end">Fim</Label>
                                        <Input
                                            id="end"
                                            type="time"
                                            value={newEvent.endTime}
                                            onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Recurrence Options */}
                                {!editingEventId && (
                                    <div className="space-y-4 border p-3 rounded-md bg-muted/20">
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                id="recurring"
                                                checked={isRecurring}
                                                onCheckedChange={setIsRecurring}
                                            />
                                            <Label htmlFor="recurring">Repetir evento?</Label>
                                        </div>

                                        {isRecurring && (
                                            <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                                                <div className="grid gap-2">
                                                    <Label>Frequência</Label>
                                                    <Select value={frequency} onValueChange={setFrequency}>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="daily">Diária</SelectItem>
                                                            <SelectItem value="weekly">Semanal</SelectItem>
                                                            <SelectItem value="biweekly">Quinzenal</SelectItem>
                                                            <SelectItem value="monthly">Mensal</SelectItem>
                                                            <SelectItem value="yearly">Anual</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label>Data Final</Label>
                                                    <Input
                                                        type="date"
                                                        value={endDate}
                                                        onChange={(e) => setEndDate(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="grid gap-2">
                                    <Label htmlFor="location">Local</Label>
                                    <Input
                                        id="location"
                                        value={newEvent.location}
                                        onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                                        placeholder="Google Meet"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="description">Descrição</Label>
                                    <Textarea
                                        id="description"
                                        value={newEvent.description}
                                        onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                                        placeholder="Detalhes do evento..."
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreateEvent} disabled={isSaving}>
                                    {isSaving ? "Salvando..." : "Salvar Evento"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <TabsContent value="day" className="m-0">
                <div className="grid gap-6 md:grid-cols-[350px_1fr]">
                    <div className="space-y-6">
                        <Card className="h-fit">
                            <CardHeader>
                                <CardTitle>Calendário</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 flex justify-center pb-4">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    className="rounded-md border w-full h-full flex items-center justify-center p-4"
                                    classNames={{
                                        months: "w-full h-full flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                                        month: "space-y-4 w-full flex flex-col",
                                        table: "w-full h-full border-collapse space-y-1",
                                        head_row: "flex w-full",
                                        row: "flex w-full mt-2",
                                        head_cell: "text-muted-foreground rounded-md w-full font-normal text-[0.8rem]",
                                        cell: "h-9 w-full text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                                        day: "h-14 w-full p-0 font-normal aria-selected:opacity-100 items-center justify-center flex text-lg hover:bg-accent hover:text-accent-foreground rounded-md transition-all cursor-pointer",
                                        day_range_end: "day-range-end",
                                        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                                        day_today: "bg-accent text-accent-foreground",
                                        day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                                        day_disabled: "text-muted-foreground opacity-50",
                                        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                                        day_hidden: "invisible",
                                    }}
                                    locale={ptBR}
                                    modifiers={{
                                        hasEvent: (date) => allEvents.some(e => new Date(e.start_time).toDateString() === date.toDateString()),
                                        isFree: (date) => !allEvents.some(e => new Date(e.start_time).toDateString() === date.toDateString())
                                    }}
                                    modifiersClassNames={{
                                        hasEvent: "bg-red-100 text-red-900 font-medium hover:bg-red-200 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground",
                                        isFree: "bg-green-50 text-green-900 hover:bg-green-100 data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground"
                                    }}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight">
                                    {date ? format(date, "d 'de' MMMM, yyyy", { locale: ptBR }) : "Selecione uma data"}
                                </h2>
                                <p className="text-muted-foreground">
                                    {selectedDateEvents.length} compromissos agendados
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-4">
                            {loading ? (
                                <p>Carregando...</p>
                            ) : selectedDateEvents.length === 0 ? (
                                <Card>
                                    <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                                        <p>Nenhum evento para este dia.</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                selectedDateEvents.map((event) => (
                                    <Card key={event.id}>
                                        <CardHeader className="p-4">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-base flex items-center gap-2">
                                                    {event.title}
                                                    {event.is_transaction && (
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${event.color_class}`}>
                                                            Financeiro
                                                        </span>
                                                    )}
                                                </CardTitle>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center text-sm text-muted-foreground mr-2">
                                                        <Clock className="mr-1 h-3 w-3" />
                                                        {format(new Date(event.start_time), "HH:mm")} - {format(new Date(event.end_time), "HH:mm")}
                                                    </div>
                                                    {!event.is_transaction && (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-muted-foreground hover:text-blue-500"
                                                                onClick={() => openEditDialog(event)}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    deleteEvent(event.id);
                                                                }}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            {event.location && (
                                                <div className="flex items-center text-xs text-muted-foreground mt-1">
                                                    <MapPin className="mr-1 h-3 w-3" />
                                                    {event.location}
                                                </div>
                                            )}
                                        </CardHeader>
                                        {event.description && (
                                            <CardContent className="p-4 pt-0 text-sm text-muted-foreground">
                                                {event.description}
                                            </CardContent>
                                        )}
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="week">
                <Card className="h-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xl font-bold">
                            Semana de {format(startOfWeek(date || new Date()), "d 'de' MMMM", { locale: ptBR })}
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                            <Button variant="outline" size="icon" onClick={() => setDate(subWeeks(date || new Date(), 1))}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => setDate(new Date())}>
                                Hoje
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => setDate(addWeeks(date || new Date(), 1))}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="grid grid-cols-7 border-b text-center">
                            {eachDayOfInterval({
                                start: startOfWeek(date || new Date()),
                                end: endOfWeek(date || new Date())
                            }).map((day) => (
                                <div key={day.toISOString()} className={`p-4 border-r last:border-r-0 ${isSameDay(day, new Date()) ? "bg-accent/50" : ""}`}>
                                    <div className="text-sm font-medium text-muted-foreground mb-1">
                                        {format(day, "EEE", { locale: ptBR })}
                                    </div>
                                    <div className={`text-2xl font-bold h-10 w-10 flex items-center justify-center rounded-full mx-auto ${isSameDay(day, new Date()) ? "bg-primary text-primary-foreground" : ""
                                        }`}>
                                        {format(day, "d")}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 h-[600px] overflow-y-auto">
                            {eachDayOfInterval({
                                start: startOfWeek(date || new Date()),
                                end: endOfWeek(date || new Date())
                            }).map((day, i) => {
                                const dayEvents = allEvents.filter(e => isSameDay(new Date(e.start_time), day));
                                return (
                                    <div key={day.toISOString()} className="border-r last:border-r-0 p-2 space-y-2 min-h-full">
                                        {dayEvents.map(event => (
                                            <div
                                                key={event.id}
                                                className={`p-2 rounded text-xs border cursor-pointer ${event.is_transaction
                                                    ? event.color_class
                                                    : event.is_google
                                                        ? "bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100"
                                                        : "bg-card border-border hover:bg-accent hover:text-accent-foreground shadow-sm"
                                                    }`}
                                                onClick={() => !event.is_transaction && openEditDialog(event)}
                                            >
                                                <div className="font-semibold mb-1 truncate">{event.title}</div>
                                                <div className="flex items-center text-[10px] opacity-70 mb-1">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    {format(new Date(event.start_time), "HH:mm")}
                                                </div>
                                                {event.location && (
                                                    <div className="flex items-center text-[10px] opacity-70 truncate">
                                                        <MapPin className="w-3 h-3 mr-1" />
                                                        {event.location}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="month">
                <Card className="h-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xl font-bold">
                            {format(date || new Date(), "MMMM yyyy", { locale: ptBR })}
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                            <Button variant="outline" size="icon" onClick={() => setDate(subMonths(date || new Date(), 1))}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => setDate(new Date())}>
                                Hoje
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => setDate(addMonths(date || new Date(), 1))}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="grid grid-cols-7 border-b">
                            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
                                <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground border-r last:border-r-0">
                                    {day}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 auto-rows-fr h-[600px]">
                            {eachDayOfInterval({
                                start: startOfWeek(startOfMonth(date || new Date())),
                                end: endOfWeek(endOfMonth(date || new Date()))
                            }).map((day, i) => {
                                const dayEvents = allEvents.filter(e => isSameDay(new Date(e.start_time), day));
                                return (
                                    <div
                                        key={day.toISOString()}
                                        className={`min-h-[100px] border-b border-r last:border-r-0 p-2 transition-colors hover:bg-muted/50 ${!isSameMonth(day, date || new Date()) ? "bg-muted/30 text-muted-foreground" : ""
                                            }`}
                                        onClick={() => setDate(day)} // Select day on click
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={`text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full ${isSameDay(day, new Date()) ? "bg-primary text-primary-foreground" : ""
                                                }`}>
                                                {format(day, "d")}
                                            </span>
                                            {dayEvents.length > 0 && (
                                                <span className="text-xs text-muted-foreground font-medium">
                                                    {dayEvents.length}
                                                </span>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            {dayEvents.slice(0, 3).map(event => (
                                                <div
                                                    key={event.id}
                                                    className={`text-[10px] truncate px-1 py-0.5 rounded cursor-pointer ${event.is_transaction
                                                        ? event.color_class
                                                        : event.is_google
                                                            ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                                            : "bg-primary/10 text-primary hover:bg-primary/20"
                                                        }`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        !event.is_transaction && openEditDialog(event);
                                                    }}
                                                    title={event.title}
                                                >
                                                    {event.title}
                                                </div>
                                            ))}
                                            {dayEvents.length > 3 && (
                                                <div className="text-[10px] text-muted-foreground pl-1">
                                                    + {dayEvents.length - 3} mais
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="year">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xl font-bold">
                            {format(date || new Date(), "yyyy")}
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                            <Button variant="outline" size="icon" onClick={() => setDate(subYears(date || new Date(), 1))}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => setDate(new Date())}>
                                Hoje
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => setDate(addYears(date || new Date(), 1))}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {Array.from({ length: 12 }).map((_, i) => {
                                const monthDate = new Date(new Date(date || new Date()).getFullYear(), i, 1);
                                return (
                                    <div key={i} className="border rounded-md p-2">
                                        <div className="font-semibold text-center mb-2 capitalize">
                                            {format(monthDate, "MMMM", { locale: ptBR })}
                                        </div>
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={setDate}
                                            month={monthDate}
                                            disableNavigation
                                            className="w-full flex justify-center !p-1 scale-90 origin-top"
                                            classNames={{
                                                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                                                day_today: "bg-accent text-accent-foreground font-bold",
                                            }}
                                            modifiers={{
                                                hasEvent: (d) => allEvents.some(e => new Date(e.start_time).toDateString() === d.toDateString()),
                                                isFree: (d) => !allEvents.some(e => new Date(e.start_time).toDateString() === d.toDateString()) && !isSameDay(d, new Date())
                                            }}
                                            modifiersClassNames={{
                                                hasEvent: "bg-red-100 text-red-900 font-medium",
                                                isFree: "bg-green-50 text-green-900"
                                            }}
                                            locale={ptBR}
                                        />
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs >
    );
}
