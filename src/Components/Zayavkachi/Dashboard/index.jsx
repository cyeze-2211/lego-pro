import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    LuArrowRight, LuClock3, LuClipboardList,
    LuCircleCheck, LuCircleDashed, LuUsers,
    LuTriangleAlert, LuPackage, LuWarehouse, LuTag, LuWallet,
    LuRefreshCw, LuRuler, LuBoxes,
    LuPackageCheck, LuCircleX,
} from 'react-icons/lu';
import {
    Box, HStack, VStack, Text, Spinner, Button,
} from '@chakra-ui/react';
import {
    useGetProductShortagesQuery,
    useGetSalesOrderDashboardQuery,
} from '../../../store/services/salesOrder.api';
import { useGetPaymentReminderDashboardQuery } from '../../../store/services/paymentReminder.api';
import { useAppTheme } from '../../../theme/tokens';
import { formatNumber } from '../../ui/number-format';

export default function ZayavkachiDashboard() {
    const { isDark } = useAppTheme();
    const [dashboardDate] = useState(() => {
        const date = new Date();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${date.getFullYear()}-${month}-${day}`;
    });

    /* ── Dashboard: zayavkalar soni holatlar bo'yicha ── */
    const {
        data: dashboard,
        isLoading: dashboardLoading,
        isFetching: dashboardFetching,
        error: dashboardError,
        refetch: refetchDashboard,
    } = useGetSalesOrderDashboardQuery(undefined, {
        refetchOnMountOrArgChange: true,
    });

    /* ── Yetishmayotgan mahsulotlar ── */
    const {
        data: shortages = [],
        isLoading: shortagesLoading,
        isFetching: shortagesFetching,
        error: shortagesError,
        refetch: refetchShortages,
    } = useGetProductShortagesQuery(undefined, {
        refetchOnMountOrArgChange: true,
    });

    const {
        data: paymentReminderDashboard,
        isLoading: paymentReminderLoading,
        isFetching: paymentReminderFetching,
        isError: paymentReminderError,
        refetch: refetchPaymentReminders,
    } = useGetPaymentReminderDashboardQuery(
        { date: dashboardDate },
        { refetchOnMountOrArgChange: true }
    );

    const panel = isDark ? 'border-white/10 bg-[#141C2B]' : 'border-[#e2e8f0] bg-white';
    const muted = isDark ? 'text-[#94a3b8]' : 'text-[#64748b]';
    const head = isDark ? 'text-white' : 'text-[#0f172a]';
    const divider = isDark ? 'divide-[#334155]/50' : 'divide-[#f1f5f9]';
    const line = isDark ? 'border-[#334155]/60' : 'border-[#f1f5f9]';

    /* ── Counters from dashboard ── */
    const totalOrders = dashboard?.total ?? 0;
    const totalCreated = dashboard?.created ?? 0;
    const totalLoaded = dashboard?.loaded ?? 0;
    const totalConfirmed = dashboard?.confirmed ?? 0;
    const totalRejected = dashboard?.rejected ?? 0;

    /* ── Shortages aggregated ── */
    const totalShortageUnits = shortages.reduce(
        (sum, s) => sum + (Number(s.shortageQuantity) || 0),
        0
    );

    const quickLinks = [
        { label: 'Buyurtmalar', path: '/zayavkachi/orders', icon: LuClipboardList, badge: 'bg-amber-400/10 text-amber-500 border-amber-400/20' },
        { label: 'Profil', path: '/profile', icon: LuUsers, badge: 'bg-[#0ea5e9]/10 text-[#0ea5e9] border-[#0ea5e9]/20' },
    ];

    /* ── Stat cards config ── */
    const statCards = [
        {
            label: 'Jami buyurtmalar',
            value: totalOrders,
            icon: LuClipboardList,
            cls: 'bg-amber-400/10 text-amber-500',
            loading: dashboardLoading,
        },
        {
            label: 'Kutilmoqda',
            value: totalCreated,
            icon: LuCircleDashed,
            cls: 'bg-amber-400/10 text-amber-500',
            loading: dashboardLoading,
        },
        {
            label: 'Ortildi',
            value: totalLoaded,
            icon: LuPackageCheck,
            cls: 'bg-[#a855f7]/10 text-[#a855f7]',
            loading: dashboardLoading,
        },
        {
            label: 'Tugallangan',
            value: totalConfirmed,
            icon: LuCircleCheck,
            cls: 'bg-[#10b981]/10 text-[#10b981]',
            loading: dashboardLoading,
        },
        {
            label: 'Rad etilgan',
            value: totalRejected,
            icon: LuCircleX,
            cls: 'bg-[#ef4444]/10 text-[#ef4444]',
            loading: dashboardLoading,
        },
    ];

    return (
        <div className="flex w-full flex-col gap-4 py-2">

            {/* Hero */}
            <div className={`relative overflow-hidden rounded-2xl border px-5 py-4 shadow-md ${panel}`}>
                <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-amber-400/6 to-transparent" />
                <div className="relative flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-amber-500">Zayavkachi</p>
                        <h1 className={`text-xl font-bold ${head}`}>Xayrli kun!</h1>
                        <p className={`mt-0.5 text-xs ${muted}`}>Mijozlardan kelgan buyurtmalarni qabul qiling va kuzatib boring.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                refetchDashboard();
                                refetchPaymentReminders();
                            }}
                            disabled={dashboardFetching || paymentReminderFetching}
                            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all hover:-translate-y-0.5 ${isDark
                                    ? 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-amber-400/30 hover:text-amber-400'
                                    : 'border-[#e2e8f0] bg-white text-[#475569] hover:border-amber-400 hover:text-amber-600'
                                } ${dashboardFetching ? 'opacity-50 cursor-wait' : ''}`}
                        >
                            <LuRefreshCw size={13} className={dashboardFetching ? 'animate-spin' : ''} />
                            <span>Yangilash</span>
                        </button>
                        <div className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm ${isDark ? 'border-amber-400/20 bg-amber-400/10' : 'border-amber-200 bg-amber-50'}`}>
                            <LuClock3 className="text-amber-500 shrink-0" size={16} />
                            <span className={`font-semibold ${head}`}>
                                {dashboardDate.split('-').reverse().join('.')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats — 5 cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {statCards.map(({ label, value, icon: Icon, cls, loading }) => (
                    <div key={label} className={`flex flex-col gap-3 rounded-2xl border p-4 shadow-md ${panel}`}>
                        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${cls}`}>
                            <Icon size={17} />
                        </span>
                        <div>
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <svg className="h-5 w-5 animate-spin text-amber-400" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                </div>
                            ) : (
                                <p className={`text-2xl font-bold ${head}`}>{formatNumber(value)}</p>
                            )}
                            <p className={`mt-0.5 text-xs leading-snug ${muted}`}>{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Today's expected payment reminder total */}
            <div className={`relative overflow-hidden rounded-2xl border p-4 sm:p-5 shadow-md ${panel}`}>
                <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-green-400/8 to-transparent" />
                <div className="relative flex flex-wrap items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-green-500">
                            <LuWallet size={20} />
                        </span>
                        <div className="min-w-0">
                            <p className={`text-sm font-semibold ${muted}`}>Bugun kutilayotgan to‘lovlar</p>
                            <p className={`mt-0.5 text-xs ${muted}`}>
                                {dashboardDate.split('-').reverse().join('.')}
                            </p>
                        </div>
                    </div>
                    <div className="relative flex flex-col items-end">
                        {paymentReminderLoading ? (
                            <Spinner size="sm" color="green.500" />
                        ) : paymentReminderError ? (
                            <button
                                type="button"
                                onClick={() => refetchPaymentReminders()}
                                className={`text-xs font-semibold underline ${isDark ? 'text-red-300' : 'text-red-600'}`}
                            >
                                Yuklashda xatolik · qayta urinish
                            </button>
                        ) : (
                            <Link
                                to="/reminders"
                                aria-label="To‘lov eslatmalarini ochish"
                                className={`group rounded-lg text-right focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 ${isDark ? 'focus-visible:ring-offset-[#141C2B]' : 'focus-visible:ring-offset-white'}`}
                            >
                                <p className={`text-2xl sm:text-3xl font-bold ${head}`}>
                                    {formatNumber(Math.round(Number(paymentReminderDashboard?.totalPrice) || 0))} so‘m
                                </p>
                                <span className={`mt-1 inline-flex items-center justify-end gap-1.5 text-xs ${muted} group-hover:text-green-500`}>
                                    {formatNumber(paymentReminderDashboard?.reminderCount ?? 0)} ta eslatma · Batafsil
                                    <LuArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                                </span>
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Dashboard error banner */}
            {dashboardError && !dashboardLoading && (
                <div className={`rounded-2xl border px-5 py-3 text-sm ${isDark
                        ? 'border-red-500/20 bg-red-500/[0.06] text-red-300'
                        : 'border-red-200 bg-red-50 text-red-600'
                    }`}>
                    <div className="flex items-center justify-between gap-3">
                        <span>Statistikani yuklashda xatolik yuz berdi.</span>
                        <button
                            type="button"
                            onClick={() => refetchDashboard()}
                            className="font-semibold underline hover:no-underline"
                        >
                            Qayta urinish
                        </button>
                    </div>
                </div>
            )}


            {/* ═══ Yetishmayotgan mahsulotlar ═══ */}
            <div className={`rounded-2xl border shadow-md ${panel}`}>
                <div className={`flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3.5 ${line}`}>
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                            <LuTriangleAlert size={15} />
                        </span>
                        <div>
                            <p className={`text-sm font-bold ${head}`}>Yetishmayotgan mahsulotlar</p>
                            <p className={`text-xs ${muted}`}>
                                Zayavkalar bo&apos;yicha omborda yetishmayotgan mahsulotlar
                                {!shortagesLoading && shortages.length > 0 && (
                                    <> · Jami <strong>{formatNumber(totalShortageUnits)}</strong> dona</>
                                )}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => refetchShortages()}
                        disabled={shortagesFetching}
                        className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all hover:-translate-y-0.5 ${isDark
                                ? 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-amber-400/30 hover:text-amber-400'
                                : 'border-[#e2e8f0] bg-white text-[#475569] hover:border-amber-400 hover:text-amber-600'
                            } ${shortagesFetching ? 'opacity-50 cursor-wait' : ''}`}
                    >
                        <LuRefreshCw size={13} className={shortagesFetching ? 'animate-spin' : ''} />
                        <span>Yangilash</span>
                    </button>
                </div>

                <div className={`divide-y ${divider}`}>
                    {/* Loading */}
                    {shortagesLoading ? (
                        <Box py={10} display="flex" alignItems="center" justifyContent="center" gap={3}>
                            <Spinner size="sm" color="red.400" />
                            <Text fontSize="sm" color={isDark ? '#94a3b8' : '#64748b'}>
                                Yuklanmoqda...
                            </Text>
                        </Box>
                    ) : shortagesError ? (
                        <Box py={10} textAlign="center">
                            <Text fontSize="sm" color={isDark ? 'red.300' : 'red.600'}>
                                Ma&apos;lumotlarni yuklashda xatolik
                            </Text>
                            <Button
                                size="sm"
                                variant="ghost"
                                mt={2}
                                onClick={() => refetchShortages()}
                                color={isDark ? 'red.300' : 'red.600'}
                            >
                                Qayta urinish
                            </Button>
                        </Box>
                    ) : shortages.length === 0 ? (
                        /* Empty — всё в порядке */
                        <Box py={12} display="flex" flexDirection="column" alignItems="center" gap={3}>
                            <Box
                                p={4}
                                borderRadius="2xl"
                                bg={isDark ? 'rgba(16,185,129,.08)' : '#ECFDF5'}
                                color="#10b981"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                            >
                                <LuCircleCheck size={30} strokeWidth={1.5} />
                            </Box>
                            <VStack gap={1} textAlign="center">
                                <Text fontSize="sm" fontWeight="bold" color={isDark ? 'white' : '#0f172a'}>
                                    Yetishmovchilik yo&apos;q
                                </Text>
                                <Text fontSize="xs" color={isDark ? '#94a3b8' : '#64748b'} maxW="320px">
                                    Barcha CREATED holatdagi zayavkalar uchun ombor qoldig&apos;i yetarli
                                </Text>
                            </VStack>
                        </Box>
                    ) : (
                        shortages.map((item) => (
                            <ShortageRow
                                key={item.productId}
                                item={item}
                                isDark={isDark}
                                head={head}
                                muted={muted}
                            />
                        ))
                    )}
                </div>
            </div>

        </div>
    );
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Shortage row — yashil faqat 90%+ da ko'rinadi                       */
/*  Tailwind: green-* (emerald emas)                                    */
/* ════════════════════════════════════════════════════════════════════ */
function ShortageRow({ item, isDark, head, muted }) {
    const shortage = Number(item.shortageQuantity) || 0;
    const available = Number(item.availableQuantity) || 0;
    const ordered = Number(item.orderedQuantity) || 0;

    /* Точный процент */
    const rawPercent = ordered > 0 ? (available / ordered) * 100 : 0;
    const percent = Math.max(0, Math.min(100, rawPercent));
    const shortagePercent = 100 - percent;

    /* Уровни:
     *   < 30%        → qizil (kritik)
     *   30% – 89.9%  → sariq (ogohlantirish)
     *   >= 90%       → yashil (yaxshi)
     */
    const isCritical = percent < 30;
    const isWarning = percent >= 30 && percent < 90;
    const isGood = percent >= 90;

    /* Цвета через green-* — уже есть в проекте */
    const barColor = isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-green-500';
    const barTextColor = isCritical
        ? (isDark ? 'text-red-300' : 'text-red-600')
        : isWarning
        ? (isDark ? 'text-amber-300' : 'text-amber-600')
        : (isDark ? 'text-green-300' : 'text-green-600');

    const iconBg = isCritical
        ? 'bg-red-500/10 text-red-500'
        : isWarning
        ? 'bg-amber-400/10 text-amber-500'
        : 'bg-green-500/10 text-green-500';

    const formatPercent = (p) => {
        if (!Number.isFinite(p)) return '0%';
        const rounded = Math.round(p * 10) / 10;
        return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`;
    };

    return (
        <div className="px-5 py-4 transition-colors hover:bg-red-500/[0.02]">
            <div className="flex flex-wrap items-start justify-between gap-4">
                {/* Left: product info */}
                <div className="flex min-w-0 flex-1 items-start gap-3">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
                        <LuPackage size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm font-bold ${head}`}>{item.productName}</p>
                        <div className={`mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs ${muted}`}>
                            {item.productArticle && (
                                <span className="inline-flex items-center gap-1">
                                    <LuTag size={11} />
                                    <span className="font-mono">{item.productArticle}</span>
                                </span>
                            )}
                            {item.productSize && (
                                <span className="inline-flex items-center gap-1">
                                    <LuRuler size={11} />
                                    <span>{item.productSize}</span>
                                </span>
                            )}
                            {item.productPiecesPerPack && (
                                <span className="inline-flex items-center gap-1">
                                    <LuBoxes size={11} />
                                    <span>{item.productPiecesPerPack} dona/qadoq</span>
                                </span>
                            )}
                            {item.brand?.name && (
                                <span className="inline-flex items-center gap-1">
                                    <LuTag size={11} />
                                    <span>{item.brand.name}</span>
                                </span>
                            )}
                            {item.productBarcode && (
                                <span className="font-mono opacity-70">{item.productBarcode}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: numbers */}
                <div className="flex shrink-0 items-center gap-4">
                    <div className="text-right">
                        <p className={`text-[10px] font-semibold uppercase tracking-wide ${muted}`}>
                            Buyurtma
                        </p>
                        <p className={`text-sm font-bold ${head}`}>
                            {formatNumber(ordered)}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className={`text-[10px] font-semibold uppercase tracking-wide ${muted}`}>
                            Mavjud
                        </p>
                        <p className={`text-sm font-bold ${isDark ? 'text-green-300' : 'text-green-600'}`}>
                            {formatNumber(available)}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className={`text-[10px] font-semibold uppercase tracking-wide ${muted}`}>
                            Yetishmaydi
                        </p>
                        <p className={`text-base font-bold ${isDark ? 'text-red-300' : 'text-red-600'}`}>
                            {formatNumber(shortage)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Progress bar */}
            {ordered > 0 && (
                <div className="mt-3">
                    <div className={`relative h-2 w-full overflow-hidden rounded-full ${isDark ? 'bg-white/[0.06]' : 'bg-slate-100'}`}>
                        <div
                            className={`absolute left-0 top-0 h-full rounded-full ${barColor} transition-all duration-500`}
                            style={{ width: `${percent}%` }}
                        />
                    </div>

                    <div className="mt-1.5 flex items-center justify-between gap-3 text-[11px] font-semibold">
                        <span className={`inline-flex items-center gap-1.5 ${barTextColor}`}>
                            <span className={`inline-block h-2 w-2 rounded-full ${barColor}`} />
                            <span>{formatPercent(percent)} mavjud</span>
                        </span>

                        {shortage > 0 && (
                            <span className={`inline-flex items-center gap-1.5 ${isDark ? 'text-red-300' : 'text-red-600'}`}>
                                <span className={`inline-block h-2 w-2 rounded-full ${isDark ? 'bg-red-400/60' : 'bg-red-400'}`} />
                                <span>{formatPercent(shortagePercent)} kamomad</span>
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Warehouses breakdown */}
            {Array.isArray(item.warehouses) && item.warehouses.length > 0 && (
                <div className={`mt-3 rounded-xl border px-3 py-2.5 ${isDark
                        ? 'border-white/[0.06] bg-white/[0.02]'
                        : 'border-[#f1f5f9] bg-[#f8fafc]'
                    }`}>
                    <div className={`mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide ${muted}`}>
                        <LuWarehouse size={11} />
                        <span>Ombоrlar bo‘yicha taqsimot</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {item.warehouses.map((wh) => {
                            const whAvailable = Number(wh.availableQuantity) || 0;
                            const whOrdered = Number(wh.orderedQuantity) || 0;
                            const whPercent = whOrdered > 0
                                ? Math.max(0, Math.min(100, (whAvailable / whOrdered) * 100))
                                : 0;
                            const whCritical = whPercent < 30;

                            return (
                                <span
                                    key={wh.warehouseId}
                                    className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs ${isDark
                                            ? 'border-white/[0.08] bg-white/[0.03] text-slate-300'
                                            : 'border-[#e2e8f0] bg-white text-[#475569]'
                                        }`}
                                >
                                    <span className="font-semibold">{wh.warehouseName}</span>
                                    <span className={muted}>·</span>
                                    <span className={isDark ? 'text-red-300' : 'text-red-600'}>
                                        −{formatNumber(wh.shortageQuantity)}
                                    </span>
                                    <span className={`text-[10px] font-semibold ${
                                        whCritical
                                            ? (isDark ? 'text-red-300' : 'text-red-600')
                                            : muted
                                    }`}>
                                        ({formatNumber(whAvailable)}/{formatNumber(whOrdered)})
                                    </span>
                                </span>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}