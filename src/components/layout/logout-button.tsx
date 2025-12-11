"use client";

import { createClient } from '@/lib/supabase/client';
import { LogOut } from 'lucide-react';

export function LogoutButton() {
    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    return (
        <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-muted-foreground hover:text-red-500 transition-colors ml-4 text-sm font-medium"
        >
            <LogOut className="h-4 w-4" />
            Sair
        </button>
    );
}
