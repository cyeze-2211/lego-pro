import { useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { useAppTheme } from '../../../theme/tokens';
import QuickIncomeModal from './QuickIncomeModal';
import QuickOutcomeModal from './QuickOutcomeModal';

/**
 * Kassir uchun sarlavhadagi tez amallar: Kirim (mijozdan to‘lov) va Chiqim (xarajat / yetkazib beruvchi).
 * Klaviatura: Alt+K — Kirim, Alt+C — Chiqim.
 */
export default function QuickCashActions() {
    const { isDark } = useAppTheme();
    const [incomeOpen, setIncomeOpen] = useState(false);
    const [outcomeOpen, setOutcomeOpen] = useState(false);

    useEffect(() => {
        const onKey = (event) => {
            if (!event.altKey || event.ctrlKey || event.metaKey) return;
            if (event.code === 'KeyK') { event.preventDefault(); setOutcomeOpen(false); setIncomeOpen(true); }
            if (event.code === 'KeyC') { event.preventDefault(); setIncomeOpen(false); setOutcomeOpen(true); }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const base = 'flex h-8 sm:h-9 items-center gap-1.5 rounded-lg border px-2 sm:px-3 text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]';
    const incomeCx = isDark
        ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20'
        : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100';
    const outcomeCx = isDark
        ? 'border-rose-400/30 bg-rose-400/10 text-rose-300 hover:bg-rose-400/20'
        : 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100';

    return (
        <>
            <div className="flex items-center gap-1.5 sm:gap-2">
                <button type="button" onClick={() => setIncomeOpen(true)} className={`${base} ${incomeCx}`} title="Kirim — mijozdan pul qabul qilish (Alt+K)" aria-label="Kirim">
                    <ArrowDownLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Kirim</span>
                </button>
                <button type="button" onClick={() => setOutcomeOpen(true)} className={`${base} ${outcomeCx}`} title="Chiqim — xarajat yoki yetkazib beruvchiga to‘lov (Alt+C)" aria-label="Chiqim">
                    <ArrowUpRight className="h-4 w-4" />
                    <span className="hidden sm:inline">Chiqim</span>
                </button>
            </div>

            <QuickIncomeModal open={incomeOpen} onClose={() => setIncomeOpen(false)} />
            <QuickOutcomeModal open={outcomeOpen} onClose={() => setOutcomeOpen(false)} />
        </>
    );
}
