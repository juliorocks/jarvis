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
    category?: {
        name: string
        icon?: string
        color?: string
    }
}
