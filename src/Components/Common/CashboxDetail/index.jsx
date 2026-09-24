import { useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import {
    LuWallet, LuCalendar, LuArrowDownLeft, LuArrowUpRight,
    LuChevronLeft, LuChevronRight, LuHistory, LuUser,
    LuFileText, LuFilter,
} from 'react-icons/lu';
import { useGetCashboxByIdQuery, useGetCashboxTransactionsQuery } from '../../../store/services/cashbox.api';
import { formatNumber } from '../../ui/number-format';
import EntityDetail, { DetailRow, DetailSection, formatDetailDate } from '../EntityDetail';
import { useAppTheme } from '../../../theme/tokens';

const PAGE_SIZE = 20;
const TYPE_OPTIONS = [
    { value: '',        label: 'Barchasi' },
    { value: 'INCOME',  label: 'Kirim' },
    { value: 'EXPENSE', label: 'Chiqim' },
];

function formatOperationDate(str) {
    if (!str) return '—';
    // yyyy-MM-dd yoki ISO datetime
    const d = new Date(str);
    if (Number.isNaN(d.getTime())) return str;
    return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function CashboxDetail() {
    const { id } = useParams();
    const { pathname } = useLocation();
    const backTo = pathname.startsWith('/kassir') ? '/kassir/cashboxes' : '/cashboxes';
    const { isDark, cardBg, cardBorder, textColor, subtitleColor } = useAppTheme();

    const { data: cashbox, isLoading, isError } = useGetCashboxByIdQuery(id, { skip: !id });

    /* ── Tarix filtrlari ── */
    const [page, setPage]       = useState(0);
    const [typeFilter, setType] = useState('');
    const [dateFrom, setFrom]   = useState('');
    const [dateTo,   setTo]     = useState('');

    const { data: txnData, isFetching: txnFetching } = useGetCashboxTransactionsQuery(
        { id, type: typeFilter || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, page, size: PAGE_SIZE },
        { skip: !id || !cashbox }
    );

    const transactions  = txnData?.items      ?? [];
    const pagination    = txnData?.pagination  ?? {};
    const totalPages    = pagination.totalPages    ?? 0;
    const totalElements = pagination.totalElements ?? 0;

    /* ── styles ── */
    const inputCx = [
        'rounded-xl border px-3 py-2 text-sm outline-none transition-all h-[38px]',
        isDark
            ? 'border-slate-700 bg-slate-800/80 text-white placeholder:text-slate-500 focus:border-yellow-400'
            : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-yellow-400',
    ].join(' ');

    return (
        <EntityDetail
            title={cashbox?.name || 'Kassa'}
            icon={LuWallet}
            backTo={backTo}
            backLabel="Kassalar"
            loading={isLoading}
            error={isError || !cashbox}
            single
            accentColorOverride="#FACC15"
            accentSoftBackground="rgba(250, 204, 21, 0.12)"
            accentGradient="linear(to-r, #FACC15, #FDE68A)"
        >
            {({ accentColor, textColor: tc, subtitleColor: sc }) => (
                <div className="flex flex-col gap-5">

                    {/* ── Kassa ma'lumotlari ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DetailSection title="Kassa ma'lumotlari" icon={LuWallet} accentColor={accentColor}>
                            <DetailRow label="Nomi"         value={cashbox.name}    emphasize />
                            <DetailRow label="Izoh"         value={cashbox.summary} />
                            <DetailRow
                                label="Joriy balans"
                                value={
                                    <span style={{ color: accentColor, fontWeight: 800 }}>
                                        {formatNumber(cashbox.balance)} so'm
                                    </span>
                                }
                                emphasize
                            />
                        </DetailSection>

                        <DetailSection title="Tizim ma'lumotlari" icon={LuCalendar} accentColor={accentColor}>
                            <DetailRow label="Yaratilgan"   value={formatDetailDate(cashbox.createdAt)} />
                            <DetailRow label="Yangilangan"  value={formatDetailDate(cashbox.lastModifiedAt)} />
                        </DetailSection>
                    </div>

                    {/* ── Kirim-chiqim tarixi ── */}
                    <div
                        className="rounded-2xl border overflow-hidden"
                        style={{
                            background: cardBg,
                            borderColor: cardBorder,
                            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,.25)' : '0 4px 16px rgba(15,23,42,.07)',
                        }}
                    >
                        {/* Header */}
                        <div
                            className="flex flex-wrap items-center gap-3 px-5 py-4 border-b"
                            style={{ borderColor: cardBorder }}
                        >
                            <LuHistory size={18} style={{ color: accentColor }} />
                            <h2 className="font-bold text-base" style={{ color: textColor }}>
                                Kirim-chiqim tarixi
                            </h2>
                            {totalElements > 0 && (
                                <span
                                    className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                                    style={{ background: isDark ? 'rgba(250,204,21,.12)' : '#FEF3C7', color: accentColor }}
                                >
                                    {totalElements} ta
                                </span>
                            )}
                        </div>

                        {/* Filtrlar */}
                        <div
                            className="flex flex-wrap items-end gap-3 px-5 py-3 border-b"
                            style={{ borderColor: cardBorder, background: isDark ? 'rgba(255,255,255,.02)' : '#FAFAFA' }}
                        >
                            {/* Tur */}
                            <div>
                                <label className="block text-xs font-semibold mb-1" style={{ color: subtitleColor }}>
                                    <LuFilter size={10} style={{ display: 'inline', marginRight: 4 }} />
                                    Tur
                                </label>
                                <select
                                    value={typeFilter}
                                    onChange={(e) => { setType(e.target.value); setPage(0); }}
                                    className={inputCx}
                                    style={{ minWidth: 120 }}
                                >
                                    {TYPE_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Sanadan */}
                            <div>
                                <label className="block text-xs font-semibold mb-1" style={{ color: subtitleColor }}>Sanadan</label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => { setFrom(e.target.value); setPage(0); }}
                                    className={inputCx}
                                />
                            </div>

                            {/* Sanagacha */}
                            <div>
                                <label className="block text-xs font-semibold mb-1" style={{ color: subtitleColor }}>Sanagacha</label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => { setTo(e.target.value); setPage(0); }}
                                    className={inputCx}
                                />
                            </div>

                            {/* Reset */}
                            {(typeFilter || dateFrom || dateTo) && (
                                <button
                                    type="button"
                                    onClick={() => { setType(''); setFrom(''); setTo(''); setPage(0); }}
                                    className="h-[38px] px-3 rounded-xl border text-xs font-semibold transition-all hover:opacity-80"
                                    style={{ borderColor: cardBorder, color: subtitleColor, background: 'transparent' }}
                                >
                                    Tozalash
                                </button>
                            )}
                        </div>

                        {/* Jadval */}
                        {txnFetching ? (
                            <div className="flex items-center justify-center gap-2 py-14 text-sm" style={{ color: subtitleColor }}>
                                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" style={{ color: accentColor }}>
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                                Yuklanmoqda...
                            </div>
                        ) : transactions.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 py-14" style={{ color: subtitleColor }}>
                                <LuHistory size={36} style={{ opacity: 0.3 }} />
                                <p className="text-sm">Hozircha harakat yo'q</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr style={{
                                            background: isDark ? 'rgba(255,255,255,.03)' : '#F8FAFC',
                                            borderBottom: `1px solid ${cardBorder}`,
                                        }}>
                                            {['№', 'Tur', 'Nomi / Mijoz', 'Summa', 'Sana', 'Izoh'].map((h) => (
                                                <th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap"
                                                    style={{ color: subtitleColor }}>
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.map((tx, idx) => {
                                            const isIncome = tx.type === 'INCOME';
                                            return (
                                                <tr key={tx.id} style={{ borderBottom: `1px solid ${cardBorder}` }}>
                                                    {/* № */}
                                                    <td className="px-4 py-3 text-xs" style={{ color: subtitleColor }}>
                                                        {page * PAGE_SIZE + idx + 1}
                                                    </td>

                                                    {/* Tur badge */}
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <span
                                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                                                            style={isIncome
                                                                ? { background: isDark ? 'rgba(34,197,94,.14)' : '#DCFCE7', color: isDark ? '#86EFAC' : '#166534' }
                                                                : { background: isDark ? 'rgba(239,68,68,.14)' : '#FEE2E2', color: isDark ? '#FCA5A5' : '#991B1B' }
                                                            }
                                                        >
                                                            {isIncome
                                                                ? <LuArrowDownLeft size={12} />
                                                                : <LuArrowUpRight  size={12} />
                                                            }
                                                            {isIncome ? 'Kirim' : 'Chiqim'}
                                                        </span>
                                                    </td>

                                                    {/* Nomi / Mijoz */}
                                                    <td className="px-4 py-3">
                                                        {isIncome ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <LuUser size={13} style={{ color: accentColor, flexShrink: 0 }} />
                                                                <span className="font-medium" style={{ color: textColor }}>
                                                                    {tx.customerName || '—'}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1.5">
                                                                <LuFileText size={13} style={{ color: subtitleColor, flexShrink: 0 }} />
                                                                <span className="font-medium" style={{ color: textColor }}>
                                                                    {tx.name || '—'}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* Summa */}
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <span
                                                            className="font-bold text-sm"
                                                            style={{ color: isIncome
                                                                ? (isDark ? '#86EFAC' : '#166534')
                                                                : (isDark ? '#FCA5A5' : '#991B1B')
                                                            }}
                                                        >
                                                            {isIncome ? '+' : '−'}{formatNumber(tx.amount)} so'm
                                                        </span>
                                                    </td>

                                                    {/* Sana */}
                                                    <td className="px-4 py-3 whitespace-nowrap text-xs" style={{ color: subtitleColor }}>
                                                        {formatOperationDate(tx.operationDate)}
                                                    </td>

                                                    {/* Izoh */}
                                                    <td className="px-4 py-3 max-w-xs">
                                                        <span className="text-xs" style={{ color: subtitleColor }}>
                                                            {tx.summary || '—'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div
                                className="flex items-center justify-between gap-3 px-5 py-3.5 border-t"
                                style={{ borderColor: cardBorder }}
                            >
                                <p className="text-xs" style={{ color: subtitleColor }}>
                                    {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalElements)} / {totalElements}
                                </p>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        disabled={pagination.first}
                                        onClick={() => setPage((p) => p - 1)}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors disabled:opacity-40"
                                        style={{ borderColor: cardBorder, background: cardBg, color: textColor }}
                                    >
                                        <LuChevronLeft size={14} />
                                    </button>
                                    <span className="px-3 text-sm font-semibold" style={{ color: textColor }}>
                                        {page + 1} / {totalPages}
                                    </span>
                                    <button
                                        type="button"
                                        disabled={pagination.last}
                                        onClick={() => setPage((p) => p + 1)}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors disabled:opacity-40"
                                        style={{ borderColor: cardBorder, background: cardBg, color: textColor }}
                                    >
                                        <LuChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </EntityDetail>
    );
}
