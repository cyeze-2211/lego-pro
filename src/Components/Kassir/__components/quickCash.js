import { useEffect, useState } from 'react';

/** Kassir oxirgi ishlatgan kassa — keyingi safar avtomatik tanlanadi */
export const QUICK_CASHBOX_KEY = 'kassir_quick_cashbox_id';

const loadCashbox = () => { try { return localStorage.getItem(QUICK_CASHBOX_KEY) || ''; } catch { return ''; } };
export const rememberCashbox = (id) => { try { if (id) localStorage.setItem(QUICK_CASHBOX_KEY, id); } catch { /* xotira yo‘q */ } };

/** Oyna ochilganda kassani eslab qolgan qiymatdan yoki yagona kassadan tanlaydi */
export function useQuickCashbox(open, cashboxes) {
    const [cashboxId, setCashboxId] = useState('');
    useEffect(() => {
        if (!open) return;
        const saved = loadCashbox();
        if (saved && cashboxes.some((c) => c.id === saved)) setCashboxId(saved);
        else if (cashboxes.length === 1) setCashboxId(cashboxes[0].id);
        else setCashboxId('');
    }, [open, cashboxes]);
    return [cashboxId, setCashboxId];
}

/** Qidiruv matnini 350 ms kechiktirib serverga yuborish */
export function useDebounced(value, delay = 350) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debounced;
}
