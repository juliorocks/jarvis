-- SCRIPT PARA RECALCULAR SALDOS DAS CARTEIRAS
-- Útil para corrigir inconsistências geradas antes da ativação do Trigger automático.

BEGIN;

-- 1. Zera os saldos de todas as carteiras da família (ou todas do banco para garantir)
-- Para ser mais seguro, vamos atualizar todas baseadas nas transações existentes.

WITH CalculatedBalances AS (
    SELECT 
        wallet_id,
        SUM(CASE 
            WHEN type = 'income' THEN amount 
            WHEN type = 'expense' THEN -amount 
            ELSE 0 
        END) as new_balance
    FROM transactions
    WHERE wallet_id IS NOT NULL
    GROUP BY wallet_id
)
UPDATE wallets w
SET balance = COALESCE(cb.new_balance, 0)
FROM CalculatedBalances cb
WHERE w.id = cb.wallet_id;

-- Opcional: Se houver carteiras sem transações, definir como 0? Não, melhor manter o manual se não tiver hit.
-- O UPDATE acima com FROM só atualiza as que tem match na view CalculatedBalances.
-- Para zerar as que não tem transações (assumindo que o histórico é a verdade absoluta):
UPDATE wallets
SET balance = 0
WHERE id NOT IN (SELECT DISTINCT wallet_id FROM transactions WHERE wallet_id IS NOT NULL);

COMMIT;
