"use client";

import { CalendarView } from "@/components/calendar/calendar-view";

export default function CalendarPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
                    <p className="text-muted-foreground">Gerencie seus compromissos e eventos.</p>
                </div>
            </div>

            <CalendarView />
        </div>
    );
}
