import { FinanceDashboard } from "@/components/finance/finance-dashboard";
import { FinanceProvider } from "@/hooks/use-finance";

export default function FinancePage() {
    return (
        <FinanceProvider>
            <div className="space-y-6">
                <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
                <FinanceDashboard />
            </div>
        </FinanceProvider>
    )
}
