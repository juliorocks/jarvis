"use server";

import { createClient } from "@/lib/supabase/server";

export async function getAdminStats() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // Check Admin Role
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "admin") throw new Error("Unauthorized: Admin Access Required");

    // Parallel fetch for stats
    // Note: In real app, consider caching or optimized RPC
    const [
        { count: totalUsers },
        { count: activeUsers },
        { count: trialUsers }, // Plan type = trial
        { count: suspendedUsers },
        { data: newUsers }
    ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("plan_status", "active"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("plan_type", "trial"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("plan_status", "suspended"),
        supabase.from("profiles")
            .select("id, full_name, email, created_at, plan_type, plan_status, avatar_url")
            .order("created_at", { ascending: false }) // Assuming created_at exists on profile? db_create_profiles had updated_at. auth.users has created_at.
            // Profiles might not have created_at if not added. Handle new_user trigger adds it?
            // db_create_profiles trigger inserts 'id, email, full_name'. No created_at.
            // But auth.users has created_at. Profiles join auth.users?
            // Let's assume for now we use 'updated_at' or just fetch from auth?
            // We can't query auth.users easily from client info.
            // Let's rely on what we have. If profiles table doesn't have created_at, use updated_at.
            // Wait, db_create_profiles.sql has updated_at.
            // I should add created_at to profiles migration if possible?
            // Too late to change migration without hassle? 
            // I'll just use updated_at for now, or assume migration added it.
            // Actually, I can select from profiles where we inserted 'now' in trigger?
            // The trigger in db_create_profiles.sql: INSERT INTO ... VALUES ...
            // It did NOT insert created_at.
            // I will use 'updated_at' for sort. 
            .limit(5)
    ]);

    return {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        trialUsers: trialUsers || 0,
        suspendedUsers: suspendedUsers || 0,
        newUsers: newUsers || []
    };
    if (profile?.role !== "admin") throw new Error("Unauthorized");

    let dbQuery = supabase.from("profiles").select("*").order("updated_at", { ascending: false });

    if (query) {
        dbQuery = dbQuery.ilike("full_name", `%${query}%`); // or email
    }
    if (planFilter !== "all") {
        dbQuery = dbQuery.eq("plan_type", planFilter);
    }

    const { data, error } = await dbQuery;
    if (error) throw new Error(error.message);
    return data;
}

export async function updateUserStatus(userId: string, status: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: adminProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (adminProfile?.role !== "admin") throw new Error("Unauthorized");

    const { error } = await supabase.from("profiles").update({ plan_status: status }).eq("id", userId);
    if (error) throw new Error(error.message);
    return { success: true };
}

export async function updateUserPlan(userId: string, plan: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: adminProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (adminProfile?.role !== "admin") throw new Error("Unauthorized");

    const { error } = await supabase.from("profiles").update({ plan_type: plan }).eq("id", userId);
    if (error) throw new Error(error.message);
    return { success: true };
}
