import { createClient } from '@/lib/supabase/client'
import { useEffect, useState, useCallback } from 'react'

export type CalendarEvent = {
    id: string
    title: string
    description?: string
    start_time: string
    end_time: string
    is_all_day: boolean
    location?: string
    color?: string
    is_google?: boolean
    google_event_id?: string
}

export function useEvents() {
    const [events, setEvents] = useState<CalendarEvent[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    const getCookie = (name: string) => {
        if (typeof document === 'undefined') return null;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return null; // Return null if not found
    }

    const fetchEvents = useCallback(async () => {
        try {
            setLoading(true)

            // Fetch local events
            const localPromise = supabase
                .from('events')
                .select('*')
                .order('start_time', { ascending: true })

            // Fetch Google events
            const googlePromise = (async () => {
                const token = getCookie('google_provider_token');
                if (token) {
                    try {
                        const { listGoogleCalendarEvents } = await import('@/lib/google-calendar');
                        const past = new Date();
                        past.setDate(past.getDate() - 30); // Last 30 days
                        return await listGoogleCalendarEvents(token, past.toISOString());
                    } catch (e) {
                        console.error("Failed to load Google Events", e);
                        return { data: [] };
                    }
                }
                return { data: [] };
            })();

            const [localResult, googleResult] = await Promise.all([localPromise, googlePromise]);

            if (localResult.error) throw localResult.error;

            const localEvents = localResult.data || [];

            // Map and Dedupe Google Events
            const googleEvents = (googleResult.data || []).map((g: any) => ({
                id: g.id,
                title: g.summary || 'Sem Título',
                description: g.description,
                start_time: g.start.dateTime || g.start.date, // Handle all-day
                end_time: g.end.dateTime || g.end.date,
                is_all_day: !!g.start.date,
                location: g.location,
                is_google: true // Flag to identify origin (could be useful for UI)
            } as CalendarEvent));

            const uniqueGoogleEvents = googleEvents.filter((g: CalendarEvent) =>
                !localEvents.some((l: CalendarEvent) =>
                    l.title === g.title &&
                    // Compare times loosely (within 1 minute) or exact? 
                    // Exact match is safer if we control creation.
                    Math.abs(new Date(l.start_time).getTime() - new Date(g.start_time).getTime()) < 60000
                )
            );

            setEvents([...localEvents, ...uniqueGoogleEvents].sort((a, b) =>
                new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
            ));

        } catch (error) {
            console.error('Error fetching events:', error)
        } finally {
            setLoading(false)
        }
    }, [supabase]) // Stable dependency

    const createEvent = async (event: Omit<CalendarEvent, 'id'>) => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const user = session?.user

            if (!user) {
                console.error("User not found")
                return { data: null, error: new Error("User not authenticated") }
            }

            let googleEventId = null;

            // 1. Sync to Google Calendar FIRST to get the ID
            try {
                const providerToken = getCookie('google_provider_token');

                if (providerToken) {
                    const { createGoogleCalendarEvent } = await import('@/lib/google-calendar');
                    const googleRes = await createGoogleCalendarEvent(providerToken, event);
                    if (googleRes.data && googleRes.data.id) {
                        googleEventId = googleRes.data.id;
                    }
                }
            } catch (syncError) {
                console.error("Google Calendar Sync failed:", syncError);
            }

            // 2. Create locally with Google ID
            const { data, error } = await supabase
                .from('events')
                .insert([{ ...event, user_id: user.id, google_event_id: googleEventId }])
                .select()
                .single()

            if (error) throw error

            setEvents((prev) => [...prev, data])

            return { data, error: null }
        } catch (error) {
            console.error('Error creating event:', error)
            return { data: null, error }
        }
    }

    const deleteEvent = async (id: string) => {
        try {
            // Find the event to check if it's Google or Local-Linked
            const eventToDelete = events.find(e => e.id === id);

            if (!eventToDelete) {
                console.error("Event not found locally");
                return { error: "Event not found" };
            }

            // 1. Delete from Google if it's a Google event OR has a link
            if (eventToDelete.is_google || eventToDelete.google_event_id) {
                const googleId = eventToDelete.is_google ? eventToDelete.id : eventToDelete.google_event_id;

                try {
                    const providerToken = getCookie('google_provider_token');
                    if (providerToken && googleId) {
                        const { deleteGoogleCalendarEvent } = await import('@/lib/google-calendar');
                        await deleteGoogleCalendarEvent(providerToken, googleId);
                    }
                } catch (syncError) {
                    console.error("Google Calendar Delete failed:", syncError);
                }
            }

            // 2. Delete locally (only if it's NOT a pure google event, or if we want to remove it from view?)
            // If it's pure google, it doesn't exist in DB. So just filter from state.
            if (!eventToDelete.is_google) {
                const { error } = await supabase
                    .from('events')
                    .delete()
                    .eq('id', id)

                if (error) throw error
            }

            setEvents((prev) => prev.filter((e) => e.id !== id))
            return { error: null }
        } catch (error) {
            console.error('Error deleting event:', error)
            return { error }
        }
    }

    const updateEvent = async (id: string, updates: Partial<Omit<CalendarEvent, 'id'>>) => {
        try {
            // 1. Update locally
            const { data, error } = await supabase
                .from('events')
                .update(updates)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error

            setEvents((prev) => prev.map((e) => (e.id === id ? data : e)))

            // 2. Sync to Google Calendar if linked
            if (data.google_event_id) {
                try {
                    const providerToken = getCookie('google_provider_token');
                    if (providerToken) {
                        const { updateGoogleCalendarEvent } = await import('@/lib/google-calendar');
                        // Ensure we have all necessary fields for Google Update
                        // We might need to merge updates with existing event data if partial
                        const fullEvent = { ...data, ...updates };

                        await updateGoogleCalendarEvent(providerToken, data.google_event_id, {
                            title: fullEvent.title,
                            description: fullEvent.description,
                            start_time: fullEvent.start_time,
                            end_time: fullEvent.end_time,
                            location: fullEvent.location
                        });
                    }
                } catch (syncError) {
                    console.error("Google Calendar Update failed:", syncError);
                }
            }

            return { data, error: null }
        } catch (error) {
            console.error('Error updating event:', error)
            return { data: null, error }
        }
    }

    useEffect(() => {
        fetchEvents()
    }, [fetchEvents])

    return { events, loading, createEvent, deleteEvent, updateEvent, refreshEvents: fetchEvents }
}
