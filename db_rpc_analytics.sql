-- RPC for Dashboard Analytics
-- Returns aggregated data for charts to optimize performance and simplify frontend logic.

DROP FUNCTION IF EXISTS get_financial_analytics(uuid, date, date, text);

CREATE OR REPLACE FUNCTION get_financial_analytics(
    target_family_id UUID,
    start_date DATE,
    end_date DATE,
    granularity TEXT -- 'day' or 'month'
)
RETURNS TABLE (
    chart_data JSONB,
    expenses_by_category JSONB,
    incomes_by_category JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    -- Security Check
    IF NOT EXISTS (
        SELECT 1 FROM family_members fm
        WHERE fm.family_id = target_family_id AND fm.user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Access Denied';
    END IF;

    RETURN QUERY
    SELECT 
        -- 1. Bar Chart Data (Expenses over time)
        (
            SELECT jsonb_agg(series)
            FROM (
                SELECT 
                    to_char(date_trunc(granularity, t.date), 'YYYY-MM-DD') as date_key,
                    SUM(t.amount) as total
                FROM transactions t
                WHERE t.family_id = target_family_id
                AND t.type = 'expense'
                AND t.date >= start_date
                AND t.date <= end_date
                GROUP BY 1
                ORDER BY 1
            ) series
        ) as chart_data,

        -- 2. Expenses by Category (Pie Chart)
        (
            SELECT jsonb_agg(cat_stats)
            FROM (
                SELECT 
                    c.name,
                    c.color,
                    SUM(t.amount) as value
                FROM transactions t
                JOIN transaction_categories c ON t.category_id = c.id
                WHERE t.family_id = target_family_id
                AND t.type = 'expense'
                AND t.date >= start_date
                AND t.date <= end_date
                GROUP BY c.name, c.color
                ORDER BY value DESC
            ) cat_stats
        ) as expenses_by_category,

        -- 3. Incomes by Category (Pie Chart)
        (
            SELECT jsonb_agg(cat_stats)
            FROM (
                SELECT 
                    c.name,
                    c.color,
                    SUM(t.amount) as value
                FROM transactions t
                JOIN transaction_categories c ON t.category_id = c.id
                WHERE t.family_id = target_family_id
                AND t.type = 'income'
                AND t.date >= start_date
                AND t.date <= end_date
                GROUP BY c.name, c.color
                ORDER BY value DESC
            ) cat_stats
        ) as incomes_by_category;
END;
$$;
