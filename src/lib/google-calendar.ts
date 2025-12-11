import { Session } from '@supabase/supabase-js'

export async function createGoogleCalendarEvent(providerToken: string | null, event: {
    title: string,
    description?: string,
    start_time: string,
    end_time: string,
    location?: string
}) {
    if (!providerToken) {
        console.error("No provider token found")
        return { error: "No Google provider token found. Please sign in again." }
    }

    const gEvent = {
        summary: event.title,
        description: event.description,
        location: event.location,
        start: {
            dateTime: event.start_time,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
            dateTime: event.end_time,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
    }

    try {
        const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${providerToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(gEvent),
        })

        if (!response.ok) {
            const errorData = await response.json()
            console.error('Google Calendar API Error:', errorData)
            throw new Error(errorData.error.message || 'Failed to create event in Google Calendar')
        }

        const data = await response.json()
        return { data, error: null }
    } catch (error) {
        console.error('Error creating Google Calendar event:', error)
        return { data: null, error }
    }
}

export async function listGoogleCalendarEvents(providerToken: string | null, timeMin?: string, timeMax?: string) {
    if (!providerToken) {
        return { data: null, error: "No token" }
    }

    const params = new URLSearchParams({
        calendarId: 'primary',
        timeMin: timeMin || new Date().toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
    });

    if (timeMax) {
        params.append('timeMax', timeMax);
    }

    try {
        const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${providerToken}`,
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error.message || 'Failed to list events')
        }

        const data = await response.json()
        return { data: data.items, error: null }
    } catch (error) {
        console.error('Error listing Google Calendar events:', error)
        return { data: null, error }
    }
}

export async function updateGoogleCalendarEvent(providerToken: string | null, eventId: string, event: {
    title: string,
    description?: string,
    start_time: string,
    end_time: string,
    location?: string
}) {
    if (!providerToken) {
        return { data: null, error: "No token" }
    }

    const gEvent = {
        summary: event.title,
        description: event.description,
        location: event.location,
        start: {
            dateTime: event.start_time,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
            dateTime: event.end_time,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
    }

    try {
        const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
            method: 'PATCH', // PATCH to update only changed fields, but we send all fields anyway
            headers: {
                'Authorization': `Bearer ${providerToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(gEvent),
        })

        if (!response.ok) {
            const errorData = await response.json()
            console.error('Google Calendar API Error (Update):', errorData)
            throw new Error(errorData.error.message || 'Failed to update event in Google Calendar')
        }

        const data = await response.json()
        return { data, error: null }
    } catch (error) {
        console.error('Error updating Google Calendar event:', error)
        return { data: null, error }
    }
}

export async function deleteGoogleCalendarEvent(providerToken: string | null, eventId: string) {
    if (!providerToken) {
        return { data: null, error: "No token" }
    }

    try {
        const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${providerToken}`,
            },
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({})); // Delete might return empty body 204
            console.error('Google Calendar API Error (Delete):', errorData)
            throw new Error('Failed to delete event in Google Calendar')
        }

        return { error: null }
    } catch (error) {
        console.error('Error deleting Google Calendar event:', error)
        return { error }
    }
}
