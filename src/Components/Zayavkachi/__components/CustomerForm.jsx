import { useState } from 'react';
import PropTypes from 'prop-types';
import {
    LuUser, LuPhone, LuStickyNote, LuDollarSign,
    LuSend, LuArrowLeft,
} from 'react-icons/lu';
import { useAppTheme } from '../../../theme/tokens';
import { Alert } from '../../Other/UI/Alert/Alert';
import { useCreateCustomerMutation, useUpdateCustomerMutation } from '../../../store/services/customer.api';

const PHONE_REGEX = /^\+998\d{9}$/;

export default function CustomerForm({ customer, onCancel, onSaved }) {
    const { isDark } = useAppTheme();
    const isEdit = Boolean(customer);

    const [name, setName]       = useState(customer?.name ?? '');
    const [phone, setPhone]     = useState(customer?.phone ?? '+998');
    const [summary, setSummary] = useState(customer?.summary ?? '');
    const [balance, setBalance] = useState(String(customer?.balance ?? '0'));

    const [createCustomer, { isLoading: isCreating }] = useCreateCustomerMutation();
    const [updateCustomer, { isLoading: isUpdating }] = useUpdateCustomerMutation();
    const isSending = isCreating || isUpdating;

    /* ── theme tokens ──────────────────────────────────────────────── */
    const panel   = isDark ? 'border-white/10 bg-[#141C2B]' : 'border-[#e2e8f0] bg-white';
    const muted   = isDark ? 'text-[#94a3b8]' : 'text-[#64748b]';
    const head    = isDark ? 'text-white' : 'text-[#0f172a]';
    const line    = isDark ? 'border-[#334155]/60' : 'border-[#f1f5f9]';
    const badge   = 'bg-[#FACC15]/10 text-[#EAB308] border-[#FACC15]/30';
    const submitBtn = 'bg-[#FACC15] hover:bg-[#EAB308] text-[#0F172A] shadow-[#FACC15]/30';
    const ghostBtn = isDark
        ? 'border-[#334155] text-[#94a3b8] hover:bg-[#1e293b]'
        : 'border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9]';
    const fieldCx = isDark
        ? 'border-[#334155] bg-[#1e293b]/80 text-white placeholder:text-[#64748b] focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'
        : 'border-[#e2e8f0] bg-white text-[#0f172a] placeholder:text-[#94a3b8] focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20';
    const inputCx = [
        'w-full rounded-xl border px-4 text-sm outline-none transition-all duration-200 h-12',
        fieldCx,
    ].join(' ');
    const textareaCx = [
        'w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all duration-200 min-h-[100px] resize-y',
        fieldCx,
    ].join(' ');

    /* ── helpers ───────────────────────────────────────────────────── */
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSending) return;
        if (!name.trim()) {
            Alert('Mijoz nomi majburiy', 'error');
            return;
        }
        if (!PHONE_REGEX.test(phone.trim())) {
            Alert('Telefon formati: +998XXXXXXXXX (9 raqam)', 'error');
            return;
        }
        if (balance === '' || Number.isNaN(Number(balance))) {
            Alert('Boshlang‘ich qoldiqni kiriting (masalan, 0)', 'error');
            return;
        }
        const data = {
            name: name.trim(),
            phone: phone.trim(),
            summary: summary.trim() || null,
            balance: Number(balance),
        };
        try {
            if (isEdit) {
                await updateCustomer({ id: customer.id, data }).unwrap();
                Alert('Mijoz yangilandi', 'success');
            } else {
                await createCustomer(data).unwrap();
                Alert('Mijoz qo‘shildi', 'success');
            }
            onSaved();
        } catch (error) {
            Alert(error?.data?.message || (isEdit ? 'Mijozni yangilashda xatolik' : 'Mijoz qo‘shishda xatolik'), 'error');
        }
    };

    return (
        <div className="flex w-full flex-col gap-4 py-2">

            {/* ── Header ────────────────────────────────────────────────── */}
            <div className={`relative overflow-hidden rounded-2xl border px-5 py-4 shadow-md ${panel}`}>
                <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-amber-400/6 to-transparent" />
                <div className="relative flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${badge}`}>
                            <LuUser size={20} />
                        </span>
                        <div>
                            <h1 className={`text-xl font-bold tracking-tight leading-tight ${head}`}>
                                {isEdit ? 'Mijozni tahrirlash' : 'Yangi mijoz'}
                            </h1>
                            <p className={`text-sm mt-0.5 ${muted}`}>Mijoz ma&apos;lumotlarini kiriting</p>
                        </div>
                    </div>
                    <button type="button" onClick={onCancel}
                        className={`flex h-12 shrink-0 items-center gap-2 rounded-xl border px-5 text-sm font-bold transition-colors ${ghostBtn}`}>
                        <LuArrowLeft size={16} /> Mijozlar
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className={`rounded-2xl border shadow-md ${panel}`}>

                    <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                        <div>
                            <label className={`mb-1.5 flex items-center gap-2 text-xs font-semibold ${muted}`}>
                                <LuUser size={12} /> Mijoz nomi
                            </label>
                            <input
                                type="text"
                                placeholder="Masalan, Alisher Karimov"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                maxLength={255}
                                className={inputCx}
                            />
                        </div>

                        <div>
                            <label className={`mb-1.5 flex items-center gap-2 text-xs font-semibold ${muted}`}>
                                <LuPhone size={12} /> Telefon
                            </label>
                            <input
                                type="text"
                                placeholder="+998901234567"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className={inputCx}
                            />
                            <p className={`mt-1.5 text-xs ${muted}`}>Format: +998XXXXXXXXX</p>
                        </div>

                        <div>
                            <label className={`mb-1.5 flex items-center gap-2 text-xs font-semibold ${muted}`}>
                                <LuDollarSign size={12} /> Boshlang&apos;ich qoldiq
                            </label>
                            <input
                                type="number"
                                placeholder="0"
                                value={balance}
                                onChange={(e) => setBalance(e.target.value)}
                                className={inputCx}
                            />
                            <p className={`mt-1.5 text-xs ${muted}`}>Musbat — qarzdor, manfiy — kredit</p>
                        </div>

                        <div className="sm:col-span-2">
                            <label className={`mb-1.5 flex items-center gap-2 text-xs font-semibold ${muted}`}>
                                <LuStickyNote size={12} /> Izoh <span className="font-normal">(ixtiyoriy)</span>
                            </label>
                            <textarea
                                rows={3}
                                placeholder="Mijoz haqida qo'shimcha ma'lumot yozing"
                                value={summary}
                                onChange={(e) => setSummary(e.target.value)}
                                className={textareaCx}
                            />
                        </div>
                    </div>

                    {/* ── Footer ──────────────────────────────────────── */}
                    <div className={`flex flex-wrap items-center justify-end gap-2 border-t px-5 py-4 ${line}`}>
                        <button type="button" onClick={onCancel}
                            className={`flex h-12 items-center rounded-xl border px-5 text-sm font-bold transition-colors ${ghostBtn}`}>
                            Bekor qilish
                        </button>
                        <button type="submit" disabled={isSending}
                            className={`flex h-12 items-center gap-2 rounded-xl px-7 text-sm font-bold shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl hover:-translate-y-px ${submitBtn}`}>
                            {isSending ? (
                                <>
                                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                                    </svg>
                                    Saqlanmoqda...
                                </>
                            ) : (
                                <>
                                    <LuSend size={15} />
                                    {isEdit ? 'O‘zgarishni saqlash' : 'Mijozni qo‘shish'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

CustomerForm.propTypes = {
    customer: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        phone: PropTypes.string,
        summary: PropTypes.string,
        balance: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
    onCancel: PropTypes.func.isRequired,
    onSaved: PropTypes.func.isRequired,
};
