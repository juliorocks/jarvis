"use client";

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState, useCallback, createContext, useContext, ReactNode } from 'react'
import { startOfMonth, startOfYear, subDays, endOfDay } from 'date-fns';

export type Wallet = {
    id: string
    name: string
    type: 'checking' | 'investment' | 'cash'
    balance: number
}

export type Transaction = {
    id: string
    description: string
    amount: number
    type: 'income' | 'expense'
    date: string
    category_id: string
    wallet_id?: string
    credit_card_id?: string
    status: 'pending' | 'completed'
    user_id: string
    payment_method?: string // 'money' | 'pix' | 'debit' | 'credit'
    // Joined fields
    category?: {
        name: string
        icon?: string
        color?: string
    }
    profiles?: {
        full_name: string
        email: string
    }
}

export type TransactionCategory = {
    id: string
    name: string
    type: 'income' | 'expense'
}

export type CreditCard = {
    id: string
    name: string
    limit_amount: number
    closing_day: number
    due_day: number
    current_invoice?: number
}

export type FamilyMember = {
    user_id: string
    role: 'owner' | 'admin' | 'member'
    joined_at: string
    profiles?: {
        email: string
        full_name: string
    }
    can_view_all?: boolean
}

export type Invitation = {
    id: string
    email: string
    status: 'pending' | 'accepted' | 'expired'
    token: string
}

interface FinanceContextType {
    wallets: Wallet[]
    transactions: Transaction[]
    categories: TransactionCategory[]
    loading: boolean
    refresh: () => Promise<void>
    addTransaction: (transaction: Omit<Transaction, 'id' | 'status' | 'user_id'> & { status?: string }) => Promise<{ data: any, error: any }>
    addTransactions: (transactions: (Omit<Transaction, 'id' | 'status' | 'user_id'> & { status?: string })[]) => Promise<{ data: any, error: any }>
    addWallet: (wallet: Omit<Wallet, 'id' | 'balance'> & { balance?: number }) => Promise<{ data: any, error: any }>
    addCategory: (category: Omit<TransactionCategory, 'id'>) => Promise<{ data: any, error: any }>
    creditCards: CreditCard[]
    addCreditCard: (card: Omit<CreditCard, 'id'>) => Promise<{ data: any, error: any }>
    updateCreditCard: (card: CreditCard) => Promise<{ data: any, error: any }>
    deleteCreditCard: (id: string) => Promise<{ error: any }>
    updateTransaction: (transaction: Transaction) => Promise<{ data: any, error: any }>
    deleteTransaction: (id: string) => Promise<{ error: any }>
    updateWallet: (wallet: Wallet) => Promise<{ data: any, error: any }>
    deleteWallet: (id: string) => Promise<{ error: any }>
    familyId: string | null
    familyMembers: FamilyMember[]
    invitations: Invitation[]
    inviteMember: (email: string) => Promise<{ error: any }>
    userRole: 'owner' | 'admin' | 'member' | null
    updateProfile: (name: string) => Promise<{ error: any }>
    leaveFamily: () => Promise<{ error: any }>
    familyName: string
    updateFamilyName: (name: string) => Promise<{ error: any }>
    toggleMemberPermission: (userId: string, canViewAll: boolean) => Promise<{ error: any }>
    // New Analytics
    getAnalytics: (range: 'week' | 'month' | 'year') => Promise<{ chartData: any[], expensePie: any[], incomePie: any[] }>
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: ReactNode }) {
    const [wallets, setWallets] = useState<Wallet[]>([])
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [categories, setCategories] = useState<TransactionCategory[]>([])
    const [creditCards, setCreditCards] = useState<CreditCard[]>([])
    const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
    const [invitations, setInvitations] = useState<Invitation[]>([])
    const [familyId, setFamilyId] = useState<string | null>(null)
    const [familyName, setFamilyName] = useState<string>("")
    const [userRole, setUserRole] = useState<'owner' | 'admin' | 'member' | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    const fetchData = useCallback(async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session?.user) return

            // 1. Get Family ID
            let currentFamilyId = null;

            // Try RPC first
            const { data: familyIdRPC, error: rpcError } = await supabase.rpc('get_user_family_id');

            if (familyIdRPC) {
                currentFamilyId = familyIdRPC;
            } else {
                console.log("RPC failed or returned null, trying manual fetch...");

                // Fallback: Fetch all memberships
                const { data: memberships } = await supabase
                    .from('family_members')
                    .select('family_id, joined_at, role, families(owner_id)')
                    .eq('user_id', session.user.id);

                if (memberships && memberships.length > 0) {
                    // Logic: Prefer families I don't own (meaning I was invited), OR if I own multiple, pick one?
                    // actually, prefer the one that is NOT "Minha Família" with 1 member if I have others.
                    // Simple heuristic: Pick the most recently joined one that isn't my auto-created orphan.

                    // Sort by joined_at desc
                    const sorted = memberships.sort((a, b) => new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime());
                    currentFamilyId = sorted[0].family_id;
                }
            }

            if (!currentFamilyId) {
                // Check if user has pending invites (Rescue Orphan)
                const { data: pendingInvites } = await supabase.rpc('get_my_pending_invites');

                if (pendingInvites && pendingInvites.length > 0) {
                    console.log("Found pending invite! Auto-accepting...", pendingInvites[0]);
                    const invite = pendingInvites[0];

                    // Auto-accept
                    const { error: acceptError } = await supabase.rpc('accept_invite_by_token', { token_arg: invite.token });

                    if (!acceptError) {
                        currentFamilyId = invite.family_id;
                        // Reload window to refresh state properly after accepting
                        window.location.reload();
                        return;
                    } else {
                        console.error("Failed to auto-accept invite:", acceptError);
                    }
                }

                if (!currentFamilyId) {
                    // Auto-create family for new users ONLY if no invite was found/accepted
                    console.log("User has no family and no invites. Creating one...");

                    const { data: newFamily, error: famError } = await supabase
                        .from('families')
                        .insert([{ name: 'Minha Família', owner_id: session.user.id }])
                        .select()
                        .single();

                    if (famError || !newFamily) {
                        console.error("Error creating family:", famError);
                        setLoading(false);
                        return;
                    }

                    // Add user as owner
                    const { error: memberError } = await supabase
                        .from('family_members')
                        .insert([{ family_id: newFamily.id, user_id: session.user.id, role: 'owner', can_view_all: true }]);

                    if (memberError) {
                        console.error("Error joining family:", memberError);
                        setLoading(false);
                        return;
                    }

                    // Set ID directly since we just created it
                    currentFamilyId = newFamily.id;
                }
            }

            setFamilyId(currentFamilyId);

            // Get Family Name
            const { data: famData } = await supabase
                .from('families')
                .select('name')
                .eq('id', currentFamilyId)
                .single();
            setFamilyName(famData?.name || "Minha Família");

            // Determine Role
            const { data: myMember } = await supabase
                .from('family_members')
                .select('role')
                .eq('family_id', currentFamilyId)
                .eq('user_id', session.user.id)
                .single();

            setUserRole(myMember?.role || null);

            // Fetch Data in parallel
            // Use RPC for sensitive family data to avoid RLS issues
            const [walletsRes, catsRes, transRes, cardsRes, dashboardRes] = await Promise.all([
                supabase.from('wallets').select('*').order('name'),
                supabase.from('transaction_categories').select('*').order('name'),
                supabase.rpc('get_family_transactions', { target_family_id: currentFamilyId }), // Reliable RPC
                supabase.from('credit_cards').select('*').order('name'),
                supabase.rpc('get_family_dashboard_data', { target_family_id: currentFamilyId }).single()
            ])

            console.log("DEBUG: Current Family ID:", currentFamilyId);
            console.log("DEBUG: Trans Res Error:", transRes.error);
            console.log("DEBUG: Trans Res Data:", transRes.data);

            setWallets((walletsRes.data as Wallet[]) || [])
            setCategories((catsRes.data as TransactionCategory[]) || [])

            // Map RPC result to Transaction type
            const rawTransactions = transRes.data as any[] || [];
            const mappedTransactions: Transaction[] = rawTransactions.map(t => ({
                id: t.id,
                description: t.description,
                amount: t.amount,
                type: t.type,
                date: t.date,
                category_id: t.category_id,
                wallet_id: t.wallet_id,
                credit_card_id: t.credit_card_id,
                status: t.status,
                user_id: t.creator_id, // Mapped from new RPC column name
                payment_method: t.payment_method, // Mapped
                category: t.category_json,
                profiles: t.profile_json
            }));
            setTransactions(mappedTransactions);

            setCreditCards(((dashboardRes.data as any)?.cards_usage_json as CreditCard[]) || (cardsRes.data as CreditCard[]) || [])

            // Parse RPC result
            if (dashboardRes.data) {
                setFamilyMembers((dashboardRes.data as any).members_json || []);
                setInvitations((dashboardRes.data as any).invites_json || []);
            } else {
                // Fallback or error state?
                console.error("Dashboard RPC error or empty:", dashboardRes.error);
                setFamilyMembers([]);
                setInvitations([]);
            }
        } catch (error) {
            console.error('Error fetching finance data:', error)
        } finally {
            setLoading(false)
        }
    }, [supabase])

    // Initial fetch
    useEffect(() => {
        fetchData()
    }, [fetchData])

    const addTransaction = async (transaction: Omit<Transaction, 'id' | 'status' | 'user_id'> & { status?: string }) => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session?.user) throw new Error("User not authenticated")

            console.log("Adding transaction with payload:", { ...transaction, user_id: session.user.id, family_id: familyId });
            const { data, error } = await supabase
                .from('transactions')
                .insert([{ ...transaction, user_id: session.user.id, family_id: familyId }])
                .select()
                .single()

            if (error) {
                console.error("Supabase Insert Error:", error);
                throw error
            }

            await fetchData()
            return { data, error: null }
        } catch (error) {
            console.error('Error adding transaction:', error)
            return { data: null, error }
        }
    }

    const addTransactions = async (transactions: (Omit<Transaction, 'id' | 'status' | 'user_id'> & { status?: string })[]) => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session?.user) throw new Error("User not authenticated")

            const payload = transactions.map(t => ({
                ...t,
                user_id: session.user.id,
                family_id: familyId
            }));

            const { data, error } = await supabase
                .from('transactions')
                .insert(payload)
                .select()

            if (error) throw error

            await fetchData()
            return { data, error: null }
        } catch (error) {
            console.error('Error adding transactions:', error)
            return { data: null, error }
        }
    }

    const addWallet = async (wallet: Omit<Wallet, 'id' | 'balance'> & { balance?: number }) => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session?.user) throw new Error("User not authenticated")

            const { data, error } = await supabase
                .from('wallets')
                .insert([{ ...wallet, user_id: session.user.id, family_id: familyId }])
                .select()
                .single()

            if (error) throw error
            await fetchData()
            return { data, error: null }
        } catch (error) {
            return { data: null, error }
        }
    }

    const updateWallet = async (wallet: Wallet) => {
        try {
            const { data, error } = await supabase
                .from('wallets')
                .update(wallet)
                .eq('id', wallet.id)
                .select()
                .single()

            if (error) throw error
            await fetchData()
            return { data, error: null }
        } catch (error) {
            console.error(error)
            return { data: null, error }
        }
    }

    const deleteWallet = async (id: string) => {
        try {
            const { error } = await supabase
                .from('wallets')
                .delete()
                .eq('id', id)

            if (error) throw error
            await fetchData()
            return { error: null }
        } catch (error) {
            console.error(error)
            return { error }
        }
    }

    const addCategory = async (category: Omit<TransactionCategory, 'id'>) => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session?.user) throw new Error("User not authenticated")

            const { data, error } = await supabase
                .from('transaction_categories')
                .insert([{ ...category, user_id: session.user.id, family_id: familyId }])
                .select()
                .single()

            if (error) throw error
            await fetchData()
            return { data, error: null }
        } catch (error) {
            return { data: null, error }
        }
    }

    const addCreditCard = async (card: Omit<CreditCard, 'id'>) => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session?.user) throw new Error("User not authenticated")

            const { data, error } = await supabase
                .from('credit_cards')
                .insert([{ ...card, user_id: session.user.id, family_id: familyId }])
                .select()
                .single()

            if (error) throw error
            await fetchData()
            return { data, error: null }
        } catch (error) {
            return { data: null, error }
        }
    }

    const updateCreditCard = async (card: CreditCard) => {
        try {
            const { data, error } = await supabase
                .from('credit_cards')
                .update(card)
                .eq('id', card.id)
                .select()
                .single()

            if (error) throw error
            await fetchData()
            return { data, error: null }
        } catch (error) {
            console.error(error)
            return { data: null, error }
        }
    }

    const deleteCreditCard = async (id: string) => {
        try {
            const { error } = await supabase
                .from('credit_cards')
                .delete()
                .eq('id', id)

            if (error) throw error
            await fetchData()
            return { error: null }
        } catch (error) {
            console.error(error)
            return { error }
        }
    }

    const updateTransaction = async (transaction: Transaction) => {
        try {
            // Remove joined fields before update
            const { category, profiles, ...rest } = transaction; // eslint-disable-line

            const { data, error } = await supabase
                .from('transactions')
                .update(rest)
                .eq('id', transaction.id)
                .select()
                .single()

            if (error) throw error
            await fetchData()
            return { data, error: null }
        } catch (error) {
            console.error(error)
            return { data: null, error }
        }
    }

    const deleteTransaction = async (id: string) => {
        try {
            const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('id', id)

            if (error) throw error
            await fetchData()
            return { error: null }
        } catch (error) {
            console.error(error)
            return { error }
        }
    }

    const inviteMember = async (email: string) => {
        try {
            if (!familyId) throw new Error("No family ID");

            const { error } = await supabase
                .from('invitations')
                .insert([{
                    family_id: familyId,
                    email,
                    status: 'pending'
                }])

            if (error) throw error
            await fetchData()
            return { error: null }
        } catch (error) {
            console.error(error)
            return { error }
        }
    }

    const updateProfile = async (name: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return { error: "No session" };

            // Update profiles table
            const { error } = await supabase
                .from('profiles')
                .upsert({ id: session.user.id, full_name: name, email: session.user.email });

            if (error) throw error;
            await fetchData()
            return { error: null };
        } catch (error) {
            return { error };
        }
    }

    const leaveFamily = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session || !familyId) return { error: "Error" };

            const { error } = await supabase
                .from('family_members')
                .delete()
                .eq('family_id', familyId)
                .eq('user_id', session.user.id);

            if (error) throw error;
            window.location.reload(); // Hard reload to reset state
            return { error: null };
        } catch (error) {
            return { error };
        }
    }

    const updateFamilyName = async (name: string) => {
        try {
            if (!familyId) return { error: "No family" };
            const { error } = await supabase
                .from('families')
                .update({ name })
                .eq('id', familyId);

            if (error) throw error;
            await fetchData();
            return { error: null };
        } catch (error) {
            return { error };
        }
    }

    const toggleMemberPermission = async (userId: string, canViewAll: boolean) => {
        try {
            // Only owners can do this, but RLS/Policy should handle checks or we check role here
            if (userRole !== 'owner') return { error: "Unauthorized" };

            const { error } = await supabase
                .from('family_members')
                .update({ can_view_all: canViewAll })
                .eq('family_id', familyId)
                .eq('user_id', userId);

            if (error) throw error;
            await fetchData();
            return { error: null };
        } catch (error) {
            return { error };
        }
    }

    const getAnalytics = async (range: 'week' | 'month' | 'year') => {
        if (!familyId) return { chartData: [], expensePie: [], incomePie: [] };

        const now = new Date();
        let startDate = subDays(now, 7);
        let granularity = 'day';

        if (range === 'month') {
            startDate = startOfMonth(now);
            granularity = 'day';
        } else if (range === 'year') {
            startDate = startOfYear(now);
            granularity = 'month';
        }

        const { data, error } = await supabase.rpc('get_financial_analytics', {
            target_family_id: familyId,
            start_date: startDate.toISOString().split('T')[0],
            end_date: endOfDay(now).toISOString().split('T')[0],
            granularity
        });

        if (error) {
            console.error("Analytics Error:", error);
            return { chartData: [], expensePie: [], incomePie: [] };
        }

        const row = data && data[0] ? data[0] : {};

        return {
            chartData: row.chart_data || [],
            expensePie: row.expenses_by_category || [],
            incomePie: row.incomes_by_category || []
        };
    }

    return (
        <FinanceContext.Provider value={{
            wallets,
            transactions,
            categories,
            loading,
            refresh: fetchData,
            addTransaction,
            addTransactions,
            addWallet,
            updateWallet,
            deleteWallet,
            addCategory,
            creditCards,
            addCreditCard,
            updateCreditCard,
            deleteCreditCard,
            updateTransaction,
            deleteTransaction,
            familyId,
            familyMembers,
            invitations,
            inviteMember,
            userRole,
            updateProfile,
            leaveFamily,
            familyName,
            updateFamilyName,
            toggleMemberPermission,
            getAnalytics
        }}>
            {children}
        </FinanceContext.Provider>
    )
}

export function useFinance() {
    const context = useContext(FinanceContext)
    if (context === undefined) {
        throw new Error('useFinance must be used within a FinanceProvider')
    }
    return context
}
