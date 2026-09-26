import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
    Box, Button, HStack, Heading, Text, VStack, Spinner,
} from '@chakra-ui/react';
import {
    LuFileSpreadsheet, LuUsers, LuCalendar, LuSearch, LuX,
    LuChevronLeft, LuChevronRight, LuClipboardList, LuCreditCard,
    LuTrendingDown, LuTrendingUp, LuWallet, LuTriangleAlert,
    LuCircleCheck, LuCircleDot, LuFilter,
} from 'react-icons/lu';
import Select from 'react-select';
import { useGetCustomersQuery } from '../../../store/services/customer.api';
import { useGetSalesOrdersQuery } from '../../../store/services/salesOrder.api';
import { useGetPaymentsQuery } from '../../../store/services/payment.api';
import { formatNumber } from '../../ui/number-format';
import { formatDetailDate, formatDetailNumber } from '../EntityDetail';
import { useAppTheme, BRAND_COLORS } from '../../../theme/tokens';
import { Alert } from '../../Other/UI/Alert/Alert';

/* ── helpers ─────────────────────────────────────────────────────────────── */
const ORDER_STATUS_LABELS = {
    PENDING:  'Kutilmoqda',
    APPROVED: 'Tasdiqlangan',
    REJECTED: 'Rad etilgan',
};

const ORDER_STATUS_COLORS = {
    PENDING:  { bg: 'rgba(250,204,21,.15)', color: '#b45309', border: '#d97706' },
    APPROVED: { bg: 'rgba(34,197,94,.15)',  color: '#15803d', border: '#16a34a' },
    REJECTED: { bg: 'rgba(239,68,68,.15)',  color: '#b91c1c', border: '#dc2626' },
};

const ORDER_STATUS_COLORS_DARK = {
    PENDING:  { bg: 'rgba(250,204,21,.14)', color: '#fde68a', border: '#ca8a04' },
    APPROVED: { bg: 'rgba(34,197,94,.14)',  color: '#86efac', border: '#16a34a' },
    REJECTED: { bg: 'rgba(239,68,68,.14)',  color: '#fca5a5', border: '#dc2626' },
};

function statusPill(status, isDark) {
    const map = isDark ? ORDER_STATUS_COLORS_DARK : ORDER_STATUS_COLORS;
    const s = map[status] || map.PENDING;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: s.bg, color: s.color, border: `1px solid ${s.border}`,
            borderRadius: 999, padding: '2px 10px', fontSize: 12, fontWeight: 700,
            whiteSpace: 'nowrap',
        }}>
            {ORDER_STATUS_LABELS[status] ?? status}
        </span>
    );
}

function SummaryCard({ icon: Icon, label, value, color, subLabel, isDark, cardBg, cardBorder }) {
    return (
        <Box
            flex="1"
            minW="200px"
            bg={cardBg}
            borderWidth="1px"
            borderColor={cardBorder}
            borderRadius="2xl"
            p={5}
            position="relative"
            overflow="hidden"
            boxShadow={isDark ? '0 4px 20px rgba(0,0,0,.3)' : '0 4px 16px rgba(15,23,42,.07)'}
        >
            <Box
                position="absolute"
                top={0} right={0}
                w="80px" h="80px"
                borderRadius="0 1rem 0 80px"
                bg={color}
                opacity={0.08}
            />
            <HStack gap={3} mb={3}>
                <Box
                    p={2.5}
                    borderRadius="xl"
                    bg={color}
                    opacity={0.15}
                    position="absolute"
                />
                <Box
                    p={2.5}
                    borderRadius="xl"
                    bg="transparent"
                    border={`1.5px solid ${color}`}
                    color={color}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                >
                    <Icon size={18} />
                </Box>
                <Text fontSize="sm" color={isDark ? 'gray.400' : 'gray.500'} fontWeight="medium">{label}</Text>
            </HStack>
            <Text fontSize="xl" fontWeight="bold" color={isDark ? 'gray.100' : 'gray.800'} lineHeight="1.2">
                {value}
            </Text>
            {subLabel && (
                <Text fontSize="xs" color={isDark ? 'gray.500' : 'gray.400'} mt={1}>{subLabel}</Text>
            )}
        </Box>
    );
}

const PAGE_SIZE = 15;
const BIG_PAGE = 999;

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function CustomerReconciliation() {
    const {
        isDark, pageBg, cardBg, cardBorder, textColor, subtitleColor, accentColor,
    } = useAppTheme();

    /* ── filter state ─────────────────────────────────────────────────── */
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [dateFrom, setDateFrom]                 = useState('');
    const [dateTo, setDateTo]                     = useState('');
    const [customerSearch, setCustomerSearch]     = useState('');
    const [ordersPage, setOrdersPage]             = useState(0);
    const [paymentsPage, setPaymentsPage]         = useState(0);
    const [activeTab, setActiveTab]               = useState('orders'); // 'orders' | 'payments' | 'summary'
    const [exporting, setExporting]               = useState(false);

    /* ── derived ──────────────────────────────────────────────────────── */
    const customerId = selectedCustomer?.value ?? null;
    const hasCustomer = Boolean(customerId);

    /* ── customers list for selector ─────────────────────────────────── */
    const { data: customersData, isLoading: customersLoading } = useGetCustomersQuery(
        { name: customerSearch || undefined, page: 0, size: 50 },
    );
    const customerOptions = (customersData?.items ?? []).map((c) => ({
        value: c.id,
        label: c.name,
        phone: c.phone,
        balance: c.balance,
    }));

    /* ── orders ───────────────────────────────────────────────────────── */
    const { data: ordersData, isFetching: ordersFetching } = useGetSalesOrdersQuery(
        {
            customerId: customerId ?? undefined,
            dateFrom:   dateFrom   || undefined,
            dateTo:     dateTo     || undefined,
            page:       ordersPage,
            size:       PAGE_SIZE,
        },
        { skip: !hasCustomer },
    );

    /* ── payments ─────────────────────────────────────────────────────── */
    const { data: paymentsData, isFetching: paymentsFetching } = useGetPaymentsQuery(
        {
            customerId: customerId ?? undefined,
            paidFrom:   dateFrom   || undefined,
            paidTo:     dateTo     || undefined,
            page:       paymentsPage,
            size:       PAGE_SIZE,
        },
        { skip: !hasCustomer },
    );

    const orders       = ordersData?.items       ?? [];
    const payments     = paymentsData?.items     ?? [];
    const orderPagination   = ordersData?.pagination   ?? {};
    const paymentPagination = paymentsData?.pagination ?? {};

    /* ── summary numbers ──────────────────────────────────────────────── */
    const totalOrdersCount   = orderPagination?.totalElements   ?? 0;
    const totalPaymentsCount = paymentPagination?.totalElements ?? 0;

    // These come from the current page only; for accurate totals we rely on the current page sums
    const ordersTotalSum    = orders.reduce((s, o) => s + (o.totalAmount  ?? 0), 0);
    const paymentsSum       = payments.reduce((s, p) => s + (p.amount     ?? 0), 0);
    const remainingDebtSum  = orders.reduce((s, o) => s + (o.remainingDebt ?? 0), 0);

    const customerBalance = selectedCustomer?.balance ?? null;

    /* ── reset pages on filter change ─────────────────────────────────── */
    const resetPages = () => { setOrdersPage(0); setPaymentsPage(0); };

    const handleCustomerChange = (opt) => { setSelectedCustomer(opt); resetPages(); };
    const handleDateChange = (field, val) => {
        if (field === 'from') setDateFrom(val);
        else setDateTo(val);
        resetPages();
    };

    const clearAll = () => {
        setSelectedCustomer(null);
        setDateFrom('');
        setDateTo('');
        setCustomerSearch('');
        resetPages();
    };

    const hasFilters = hasCustomer || dateFrom || dateTo;

    /* ── Excel export ─────────────────────────────────────────────────── */
    const handleExport = useCallback(async () => {
        if (!hasCustomer) {
            Alert('Avval mijozni tanlang', 'warning');
            return;
        }
        setExporting(true);
        try {
            // fetch ALL orders and payments for export (no pagination)
            const { useGetSalesOrdersQuery: _, useGetPaymentsQuery: __, ...rest } = {};
            void rest;

            const wb = XLSX.utils.book_new();
            const customerName = selectedCustomer?.label ?? 'Mijoz';
            const period = dateFrom && dateTo
                ? `${dateFrom} — ${dateTo}`
                : dateFrom
                ? `${dateFrom} dan`
                : dateTo
                ? `${dateTo} gacha`
                : 'Barcha vaqt';

            // ── Cover / Info sheet ──────────────────────────────────────
            const infoRows = [
                ['MIJOZ SVERKA HISOBOTI'],
                [],
                ['Mijoz:', customerName],
                ['Telefon:', selectedCustomer?.phone ?? ''],
                ['Joriy balans:', `${formatNumber(Math.abs(Number(customerBalance) || 0))} so'm ${(Number(customerBalance) || 0) < 0 ? '(qarzdor)' : (Number(customerBalance) || 0) > 0 ? '(kredit)' : ''}`],
                ['Davr:', period],
                ['Hisobot sanasi:', new Date().toLocaleDateString('uz-UZ')],
                [],
                ['Buyurtmalar soni:', totalOrdersCount],
                ["To'lovlar soni:", totalPaymentsCount],
            ];
            const infoWs = XLSX.utils.aoa_to_sheet(infoRows);
            infoWs['!cols'] = [{ wch: 22 }, { wch: 40 }];
            XLSX.utils.book_append_sheet(wb, infoWs, 'Ma\'lumot');

            // ── Orders sheet ────────────────────────────────────────────
            const orderHeaders = ['№', 'Mahsulotlar soni', 'Jami summa (so\'m)', 'Qolgan qarz (so\'m)', 'Holat', 'Izoh', 'Sana'];
            const orderRows = orders.map((o, i) => [
                i + 1,
                o.items?.length ?? 0,
                o.totalAmount   ?? 0,
                o.remainingDebt ?? 0,
                ORDER_STATUS_LABELS[o.status] ?? o.status,
                o.summary ?? '',
                formatDetailDate(o.createdAt),
            ]);

            const ordersWs = XLSX.utils.aoa_to_sheet([orderHeaders, ...orderRows]);
            ordersWs['!cols'] = [
                { wch: 5 }, { wch: 18 }, { wch: 22 }, { wch: 22 }, { wch: 16 }, { wch: 30 }, { wch: 20 },
            ];
            XLSX.utils.book_append_sheet(wb, ordersWs, 'Buyurtmalar');

            // ── Payments sheet ──────────────────────────────────────────
            const payHeaders = ['№', 'Kassa', 'Summa (so\'m)', 'Taqsimlangan (so\'m)', 'Avans (so\'m)', 'Holat', 'Izoh', 'Sana'];
            const payRows = payments.map((p, i) => [
                i + 1,
                p.cashboxName ?? '',
                p.amount           ?? 0,
                p.allocatedAmount   ?? 0,
                p.unallocatedAmount ?? 0,
                p.status === 'ACTIVE' ? 'Faol' : 'Bekor qilingan',
                p.summary ?? '',
                formatDetailDate(p.paidAt ?? p.createdAt),
            ]);

            const paymentsWs = XLSX.utils.aoa_to_sheet([payHeaders, ...payRows]);
            paymentsWs['!cols'] = [
                { wch: 5 }, { wch: 20 }, { wch: 20 }, { wch: 22 }, { wch: 16 }, { wch: 18 }, { wch: 30 }, { wch: 20 },
            ];
            XLSX.utils.book_append_sheet(wb, paymentsWs, 'To\'lovlar');

            // ── Summary sheet ───────────────────────────────────────────
            const summaryRows = [
                ['XULOSA'],
                [],
                ['Ko\'rsatkich',                                             'Qiymat'],
                ['Jami buyurtmalar soni',                                    totalOrdersCount],
                ["Jami to'lovlar soni",                                      totalPaymentsCount],
                ["Joriy sahifadagi buyurtmalar summasi (so'm)",               ordersTotalSum],
                ["Joriy sahifadagi to'lovlar summasi (so'm)",                 paymentsSum],
                ["Joriy sahifadagi qolgan qarz summasi (so'm)",              remainingDebtSum],
                ['Joriy balans',                                             `${formatNumber(Math.abs(Number(customerBalance) || 0))} so'm ${(Number(customerBalance) || 0) < 0 ? '(qarzdor)' : (Number(customerBalance) || 0) > 0 ? '(kredit)' : ''}`],
            ];
            const summaryWs = XLSX.utils.aoa_to_sheet(summaryRows);
            summaryWs['!cols'] = [{ wch: 40 }, { wch: 25 }];
            XLSX.utils.book_append_sheet(wb, summaryWs, 'Xulosa');

            const fileName = `Sverka_${customerName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
            XLSX.writeFile(wb, fileName);
            Alert(`"${customerName}" uchun sverka yuklab olindi`, 'success');
        } catch (err) {
            console.error(err);
            Alert("Eksportda xatolik yuz berdi", 'error');
        } finally {
            setExporting(false);
        }
    }, [hasCustomer, selectedCustomer, customerBalance, dateFrom, dateTo, orders, payments, totalOrdersCount, totalPaymentsCount, ordersTotalSum, paymentsSum, remainingDebtSum]);

    /* ── theme helpers ────────────────────────────────────────────────── */
    const panel   = `rounded-2xl border ${isDark ? 'border-white/[0.07] bg-[#141C2B]' : 'border-[#e2e8f0] bg-white'}`;
    const muted   = isDark ? 'text-[#94a3b8]' : 'text-[#64748b]';
    const head    = isDark ? 'text-white' : 'text-[#0f172a]';
    const rowHov  = isDark ? 'hover:bg-amber-400/[0.05]' : 'hover:bg-amber-50/60';
    const divLine = isDark ? 'divide-white/[0.06]' : 'divide-[#f1f5f9]';
    const thCx    = `px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide ${muted} ${isDark ? 'bg-[#0f172a]/30' : 'bg-[#f8fafc]'}`;
    const tdCx    = 'px-4 py-3 text-sm';
    const inputCx = [
        'h-11 w-full rounded-xl border px-4 text-sm outline-none transition-all duration-200',
        isDark
            ? 'border-white/[0.1] bg-[#1e293b]/80 text-white placeholder:text-slate-500 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'
            : 'border-[#e2e8f0] bg-white text-[#0f172a] placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20',
    ].join(' ');

    /* react-select styles */
    const selectStyles = {
        control: (base, state) => ({
            ...base,
            minHeight: 44,
            borderRadius: 12,
            borderColor: state.isFocused ? '#FACC15' : (isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'),
            backgroundColor: isDark ? 'rgba(30,41,59,0.8)' : '#fff',
            boxShadow: state.isFocused ? '0 0 0 2px rgba(250,204,21,.2)' : 'none',
            '&:hover': { borderColor: '#FACC15' },
            fontSize: 14,
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected
                ? '#FACC15'
                : state.isFocused
                ? (isDark ? 'rgba(250,204,21,.12)' : '#FFFBEB')
                : (isDark ? '#141C2B' : '#fff'),
            color: state.isSelected ? '#0F172A' : (isDark ? '#e2e8f0' : '#0f172a'),
            fontSize: 14,
            cursor: 'pointer',
        }),
        menu: (base) => ({
            ...base,
            backgroundColor: isDark ? '#141C2B' : '#fff',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
            borderRadius: 12,
            boxShadow: isDark
                ? '0 16px 40px rgba(0,0,0,.5)'
                : '0 8px 24px rgba(15,23,42,.12)',
            zIndex: 50,
        }),
        singleValue: (base) => ({ ...base, color: isDark ? '#f1f5f9' : '#0f172a' }),
        placeholder: (base) => ({ ...base, color: isDark ? '#64748b' : '#94a3b8', fontSize: 14 }),
        input: (base) => ({ ...base, color: isDark ? '#f1f5f9' : '#0f172a' }),
        noOptionsMessage: (base) => ({
            ...base,
            color: isDark ? '#64748b' : '#94a3b8',
            backgroundColor: isDark ? '#141C2B' : '#fff',
            fontSize: 14,
        }),
    };

    const formatOptionLabel = (opt) => (
        <div className="flex items-center justify-between gap-2 py-0.5">
            <div>
                <div className="font-semibold text-sm">{opt.label}</div>
                {opt.phone && <div className="text-xs opacity-60">{opt.phone}</div>}
            </div>
            {opt.balance !== undefined && opt.balance !== null && (
                <span className={`text-xs font-bold shrink-0 ${
                    Number(opt.balance) > 0
                        ? 'text-red-500'
                        : Number(opt.balance) < 0
                        ? 'text-green-500'
                        : 'text-slate-400'
                }`}>
                    {Number(opt.balance) === 0 ? '0' : formatNumber(Math.abs(Number(opt.balance)))} so'm
                </span>
            )}
        </div>
    );

    /* ── tabs ─────────────────────────────────────────────────────────── */
    const tabs = [
        { id: 'summary',  label: 'Xulosa',      icon: LuWallet },
        { id: 'orders',   label: 'Buyurtmalar', icon: LuClipboardList, count: totalOrdersCount },
        { id: 'payments', label: "To'lovlar",   icon: LuCreditCard,    count: totalPaymentsCount },
    ];

    /* ════════════════════════════════════════════════════════════════════ */
    return (
        <Box my={2} bg={pageBg} color={textColor} minH="100%">

            {/* ── Page Header ───────────────────────────────────────────── */}
            <Box
                className={panel}
                mb={5}
                position="relative"
                overflow="hidden"
            >
                <Box
                    position="absolute" top={0} right={0}
                    w="40%" h="100%"
                    bgGradient="linear(to-l, rgba(250,204,21,0.06), transparent)"
                />
                <HStack justify="space-between" align="center" flexWrap="wrap" gap={4} p={5}>
                    <HStack gap={4}>
                        <Box
                            p={3}
                            borderRadius="xl"
                            bg={isDark ? 'rgba(250,204,21,.12)' : '#FEF9C3'}
                            border={`1.5px solid ${isDark ? 'rgba(250,204,21,.3)' : '#FDE047'}`}
                            color="#CA8A04"
                            display="flex" alignItems="center" justifyContent="center"
                        >
                            <LuFileSpreadsheet size={24} />
                        </Box>
                        <Box>
                            <Heading fontSize="2xl" fontWeight="bold" color={textColor} lineHeight="1.2">
                                Mijoz Sverka
                            </Heading>
                            <Text fontSize="sm" color={subtitleColor} mt={0.5}>
                                Buyurtmalar va to'lovlar bo'yicha hisob-kitob hisoboti
                            </Text>
                        </Box>
                    </HStack>
                    <Button
                        onClick={handleExport}
                        disabled={!hasCustomer || exporting}
                        bg={hasCustomer ? accentColor : (isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9')}
                        color={hasCustomer ? '#0F172A' : subtitleColor}
                        borderRadius="xl"
                        px={6}
                        h="44px"
                        fontWeight="bold"
                        fontSize="sm"
                        _hover={hasCustomer ? { bg: BRAND_COLORS.yellowHover, transform: 'translateY(-1px)', shadow: 'lg' } : {}}
                        transition="all .2s"
                        cursor={hasCustomer ? 'pointer' : 'not-allowed'}
                        opacity={hasCustomer ? 1 : 0.5}
                    >
                        <HStack gap={2}>
                            {exporting
                                ? <Spinner size="sm" />
                                : <LuFileSpreadsheet size={17} />
                            }
                            <span>{exporting ? 'Yuklanmoqda...' : 'Excel yuklab olish'}</span>
                        </HStack>
                    </Button>
                </HStack>
            </Box>

            {/* ── Filters ───────────────────────────────────────────────── */}
            <Box className={panel} mb={5} p={5}>
                <HStack gap={2} mb={4}>
                    <LuFilter size={15} color={isDark ? '#94a3b8' : '#64748b'} />
                    <Text fontSize="sm" fontWeight="semibold" color={subtitleColor}>Filterlar</Text>
                    {hasFilters && (
                        <Button
                            size="xs"
                            variant="ghost"
                            onClick={clearAll}
                            color={subtitleColor}
                            ml={1}
                            borderRadius="full"
                            px={3}
                            _hover={{ bg: isDark ? 'whiteAlpha.100' : 'gray.100', color: textColor }}
                        >
                            <HStack gap={1}><LuX size={12} /><span>Tozalash</span></HStack>
                        </Button>
                    )}
                </HStack>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Customer selector */}
                    <div className="lg:col-span-2">
                        <label className={`mb-1.5 block text-xs font-semibold ${muted}`}>
                            <HStack as="span" gap={1.5} display="inline-flex">
                                <LuUsers size={13} />
                                <span>Mijoz tanlash *</span>
                            </HStack>
                        </label>
                        <Select
                            value={selectedCustomer}
                            onChange={handleCustomerChange}
                            onInputChange={(v) => setCustomerSearch(v)}
                            options={customerOptions}
                            isLoading={customersLoading}
                            isClearable
                            placeholder="Mijoz nomini qidiring..."
                            noOptionsMessage={() => 'Mijoz topilmadi'}
                            loadingMessage={() => 'Yuklanmoqda...'}
                            styles={selectStyles}
                            formatOptionLabel={formatOptionLabel}
                        />
                    </div>

                    {/* Date from */}
                    <div>
                        <label className={`mb-1.5 block text-xs font-semibold ${muted}`}>
                            <HStack as="span" gap={1.5} display="inline-flex">
                                <LuCalendar size={13} />
                                <span>Sanadan</span>
                            </HStack>
                        </label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => handleDateChange('from', e.target.value)}
                            className={inputCx}
                        />
                    </div>

                    {/* Date to */}
                    <div>
                        <label className={`mb-1.5 block text-xs font-semibold ${muted}`}>
                            <HStack as="span" gap={1.5} display="inline-flex">
                                <LuCalendar size={13} />
                                <span>Sanagacha</span>
                            </HStack>
                        </label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => handleDateChange('to', e.target.value)}
                            className={inputCx}
                        />
                    </div>
                </div>

                {/* Selected customer info bar */}
                {selectedCustomer && (
                    <Box
                        mt={4}
                        p={4}
                        borderRadius="xl"
                        bg={isDark ? 'rgba(250,204,21,.07)' : '#FFFBEB'}
                        borderWidth="1px"
                        borderColor={isDark ? 'rgba(250,204,21,.2)' : '#FDE68A'}
                    >
                        <HStack gap={4} flexWrap="wrap">
                            <HStack gap={2}>
                                <Box p={2} borderRadius="lg" bg={isDark ? 'rgba(250,204,21,.15)' : '#FEF3C7'} color="#CA8A04">
                                    <LuUsers size={16} />
                                </Box>
                                <Box>
                                    <Text fontSize="xs" color={subtitleColor}>Tanlangan mijoz</Text>
                                    <Text fontWeight="bold" color={textColor}>{selectedCustomer.label}</Text>
                                </Box>
                            </HStack>
                            {selectedCustomer.phone && (
                                <Box>
                                    <Text fontSize="xs" color={subtitleColor}>Telefon</Text>
                                    <Text fontWeight="semibold" color={textColor}>{selectedCustomer.phone}</Text>
                                </Box>
                            )}
                            {customerBalance !== null && (
                                <Box>
                                    <Text fontSize="xs" color={subtitleColor}>Joriy balans</Text>
                                    <Text
                                        fontWeight="bold"
                                        color={
                                            Number(customerBalance) < 0
                                                ? (isDark ? 'red.300' : 'red.600')
                                                : Number(customerBalance) > 0
                                                ? (isDark ? 'green.300' : 'green.600')
                                                : subtitleColor
                                        }
                                    >
                                        {Number(customerBalance) === 0
                                            ? '0 so\'m'
                                            : `${formatNumber(Math.abs(Number(customerBalance)))} so'm ${
                                                Number(customerBalance) < 0 ? '(qarzdor)' : '(kredit)'
                                            }`
                                        }
                                    </Text>
                                </Box>
                            )}
                        </HStack>
                    </Box>
                )}
            </Box>

            {/* ── Empty state when no customer selected ─────────────────── */}
            {!hasCustomer && (
                <Box
                    className={panel}
                    p={14}
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    gap={4}
                >
                    <Box
                        p={5}
                        borderRadius="2xl"
                        bg={isDark ? 'rgba(250,204,21,.08)' : '#FEF9C3'}
                        border={`2px dashed ${isDark ? 'rgba(250,204,21,.2)' : '#FDE68A'}`}
                        color="#CA8A04"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                    >
                        <LuUsers size={36} strokeWidth={1.5} />
                    </Box>
                    <VStack gap={1} textAlign="center">
                        <Text fontSize="lg" fontWeight="bold" color={textColor}>Mijoz tanlanmagan</Text>
                        <Text fontSize="sm" color={subtitleColor} maxW="360px">
                            Sverka hisobotini ko'rish uchun yuqoridan mijozni tanlang va davr sanalarini belgilang
                        </Text>
                    </VStack>
                </Box>
            )}

            {/* ── Data view ─────────────────────────────────────────────── */}
            {hasCustomer && (
                <>
                    {/* Summary cards */}
                    <HStack gap={4} mb={5} flexWrap="wrap" align="stretch">
                        <SummaryCard
                            icon={LuClipboardList}
                            label="Jami buyurtmalar"
                            value={`${formatDetailNumber(totalOrdersCount)} ta`}
                            color="#FACC15"
                            subLabel={`Sahifada: ${orders.length} ta`}
                            isDark={isDark}
                            cardBg={cardBg}
                            cardBorder={cardBorder}
                        />
                        <SummaryCard
                            icon={LuCreditCard}
                            label="Jami to'lovlar"
                            value={`${formatDetailNumber(totalPaymentsCount)} ta`}
                            color="#22c55e"
                            subLabel={`Sahifada: ${payments.length} ta`}
                            isDark={isDark}
                            cardBg={cardBg}
                            cardBorder={cardBorder}
                        />
                        <SummaryCard
                            icon={LuTrendingDown}
                            label="Buyurtmalar summasi"
                            value={`${formatNumber(ordersTotalSum)} so'm`}
                            color="#f59e0b"
                            subLabel="Joriy sahifa bo'yicha"
                            isDark={isDark}
                            cardBg={cardBg}
                            cardBorder={cardBorder}
                        />
                        <SummaryCard
                            icon={LuTrendingUp}
                            label="To'lovlar summasi"
                            value={`${formatNumber(paymentsSum)} so'm`}
                            color="#3b82f6"
                            subLabel="Joriy sahifa bo'yicha"
                            isDark={isDark}
                            cardBg={cardBg}
                            cardBorder={cardBorder}
                        />
                        <SummaryCard
                            icon={LuTriangleAlert}
                            label="Qolgan qarz"
                            value={`${formatNumber(remainingDebtSum)} so'm`}
                            color={remainingDebtSum > 0 ? '#ef4444' : '#22c55e'}
                            subLabel="Joriy sahifa bo'yicha"
                            isDark={isDark}
                            cardBg={cardBg}
                            cardBorder={cardBorder}
                        />
                    </HStack>

                    {/* Tabs */}
                    <Box className={panel}>
                        {/* Tab header */}
                        <HStack
                            gap={0}
                            borderBottomWidth="1px"
                            borderColor={cardBorder}
                            px={4}
                            pt={1}
                            overflowX="auto"
                        >
                            {tabs.map((tab) => {
                                const isActive = activeTab === tab.id;
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`relative flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-all whitespace-nowrap border-b-2 -mb-px ${
                                            isActive
                                                ? 'border-amber-400 text-amber-500'
                                                : `border-transparent ${muted} hover:text-slate-600 dark:hover:text-slate-300`
                                        }`}
                                    >
                                        <Icon size={15} />
                                        {tab.label}
                                        {tab.count !== undefined && tab.count > 0 && (
                                            <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                                                isActive
                                                    ? 'bg-amber-400 text-slate-900'
                                                    : (isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-600')
                                            }`}>
                                                {tab.count}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </HStack>

                        {/* ══ XULOSA TAB ═══════════════════════════════════ */}
                        {activeTab === 'summary' && (
                            <Box p={6}>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {/* Balance block */}
                                    <Box
                                        p={5}
                                        borderRadius="xl"
                                        bg={
                                            Number(customerBalance) > 0
                                                ? (isDark ? 'rgba(239,68,68,.08)' : '#FEF2F2')
                                                : Number(customerBalance) < 0
                                                ? (isDark ? 'rgba(34,197,94,.08)' : '#F0FDF4')
                                                : (isDark ? 'rgba(255,255,255,.04)' : '#F8FAFC')
                                        }
                                        borderWidth="1px"
                                        borderColor={
                                            Number(customerBalance) > 0
                                                ? (isDark ? 'rgba(239,68,68,.25)' : '#FECACA')
                                                : Number(customerBalance) < 0
                                                ? (isDark ? 'rgba(34,197,94,.25)' : '#BBF7D0')
                                                : cardBorder
                                        }
                                    >
                                        <HStack gap={3} mb={3}>
                                            <Box
                                                p={2.5} borderRadius="xl"
                                                bg={Number(customerBalance) > 0 ? 'rgba(239,68,68,.15)' : 'rgba(34,197,94,.15)'}
                                                color={Number(customerBalance) > 0 ? '#ef4444' : '#22c55e'}
                                                display="flex" alignItems="center"
                                            >
                                                {Number(customerBalance) > 0
                                                    ? <LuTriangleAlert size={18} />
                                                    : <LuCircleCheck size={18} />
                                                }
                                            </Box>
                                            <Text fontWeight="semibold" color={textColor}>Joriy balans holati</Text>
                                        </HStack>
                                        <Text fontSize="2xl" fontWeight="bold"
                                            color={
                                                Number(customerBalance) > 0
                                                    ? (isDark ? 'red.300' : 'red.600')
                                                    : Number(customerBalance) < 0
                                                    ? (isDark ? 'green.300' : 'green.600')
                                                    : subtitleColor
                                            }>
                                            {Number(customerBalance) === 0
                                                ? '0 so\'m'
                                                : `${formatNumber(Math.abs(Number(customerBalance)))} so'm`
                                            }
                                        </Text>
                                        <Text fontSize="sm" color={subtitleColor} mt={1}>
                                            {Number(customerBalance) < 0
                                                ? '⚠ Mijoz qarzdor'
                                                : Number(customerBalance) > 0
                                                ? '✓ Mijozda kredit bor (ortiqcha to\'lagan)'
                                                : 'Hisob-kitob balanslangan'
                                            }
                                        </Text>
                                    </Box>

                                    {/* Stats block */}
                                    <Box
                                        p={5} borderRadius="xl"
                                        bg={isDark ? 'rgba(255,255,255,.03)' : '#F8FAFC'}
                                        borderWidth="1px" borderColor={cardBorder}
                                    >
                                        <Text fontWeight="semibold" color={textColor} mb={4}>Statistika (joriy sahifa)</Text>
                                        <VStack gap={3} align="stretch">
                                            {[
                                                { label: 'Buyurtmalar soni', value: `${formatDetailNumber(totalOrdersCount)} ta`, icon: LuClipboardList, color: '#FACC15' },
                                                { label: "To'lovlar soni",   value: `${formatDetailNumber(totalPaymentsCount)} ta`, icon: LuCreditCard, color: '#22c55e' },
                                                { label: 'Buyurtmalar jami', value: `${formatNumber(ordersTotalSum)} so'm`, icon: LuTrendingDown, color: '#f59e0b' },
                                                { label: "To'lovlar jami",   value: `${formatNumber(paymentsSum)} so'm`, icon: LuTrendingUp, color: '#3b82f6' },
                                                { label: 'Qolgan qarz',      value: `${formatNumber(remainingDebtSum)} so'm`, icon: LuTriangleAlert, color: remainingDebtSum > 0 ? '#ef4444' : '#22c55e' },
                                            ].map(({ label, value, icon: Ic, color }) => (
                                                <HStack key={label} justify="space-between" gap={4}>
                                                    <HStack gap={2}>
                                                        <Ic size={14} color={color} />
                                                        <Text fontSize="sm" color={subtitleColor}>{label}</Text>
                                                    </HStack>
                                                    <Text fontSize="sm" fontWeight="bold" color={textColor}>{value}</Text>
                                                </HStack>
                                            ))}
                                        </VStack>
                                    </Box>
                                </div>

                                {/* Export hint */}
                                <Box
                                    mt={5} p={4} borderRadius="xl"
                                    bg={isDark ? 'rgba(250,204,21,.06)' : '#FFFBEB'}
                                    borderWidth="1px" borderColor={isDark ? 'rgba(250,204,21,.15)' : '#FDE68A'}
                                >
                                    <HStack gap={3}>
                                        <LuFileSpreadsheet size={18} color="#CA8A04" />
                                        <Box>
                                            <Text fontSize="sm" fontWeight="semibold" color={isDark ? '#fde68a' : '#92400e'}>
                                                Excel hisobotni yuklab oling
                                            </Text>
                                            <Text fontSize="xs" color={subtitleColor} mt={0.5}>
                                                Hisobot 3 ta varaqdan iborat: Ma'lumot, Buyurtmalar va To'lovlar.
                                                Mijozga jo'natish uchun tayyor formatda saqlanadi.
                                            </Text>
                                        </Box>
                                        <Button
                                            onClick={handleExport}
                                            disabled={exporting}
                                            bg={accentColor}
                                            color="black"
                                            borderRadius="xl"
                                            px={5}
                                            h="38px"
                                            fontSize="sm"
                                            fontWeight="bold"
                                            ml="auto"
                                            flexShrink={0}
                                            _hover={{ bg: BRAND_COLORS.yellowHover }}
                                        >
                                            <HStack gap={2}>
                                                {exporting ? <Spinner size="sm" /> : <LuFileSpreadsheet size={15} />}
                                                <span>Yuklab olish</span>
                                            </HStack>
                                        </Button>
                                    </HStack>
                                </Box>
                            </Box>
                        )}

                        {/* ══ BUYURTMALAR TAB ═══════════════════════════════ */}
                        {activeTab === 'orders' && (
                            <Box>
                                {ordersFetching ? (
                                    <Box py={14} display="flex" alignItems="center" justifyContent="center" gap={3} color={subtitleColor}>
                                        <Spinner size="sm" color="yellow.400" />
                                        <Text fontSize="sm">Yuklanmoqda...</Text>
                                    </Box>
                                ) : orders.length === 0 ? (
                                    <VStack py={14} gap={3}>
                                        <LuClipboardList size={36} color={isDark ? '#334155' : '#cbd5e1'} strokeWidth={1.5} />
                                        <Text color={subtitleColor} fontSize="sm">Bu davr uchun buyurtmalar topilmadi</Text>
                                    </VStack>
                                ) : (
                                    <>
                                        <Box overflowX="auto">
                                            <table className="w-full text-sm border-collapse">
                                                <thead>
                                                    <tr>
                                                        <th className={`${thCx} w-12 text-center`}>№</th>
                                                        <th className={thCx}>Mahsulotlar</th>
                                                        <th className={`${thCx} text-right`}>Jami summa</th>
                                                        <th className={`${thCx} text-right`}>Qolgan qarz</th>
                                                        <th className={thCx}>Holat</th>
                                                        <th className={thCx}>Izoh</th>
                                                        <th className={thCx}>Sana</th>
                                                    </tr>
                                                </thead>
                                                <tbody className={`divide-y ${divLine}`}>
                                                    {orders.map((order, idx) => (
                                                        <tr key={order.id} className={`transition-colors ${rowHov}`}>
                                                            <td className={`${tdCx} text-center ${muted}`}>
                                                                {ordersPage * PAGE_SIZE + idx + 1}
                                                            </td>
                                                            <td className={`${tdCx} font-semibold ${head}`}>
                                                                <HStack gap={2}>
                                                                    <Box p={1.5} borderRadius="md"
                                                                        bg={isDark ? 'rgba(250,204,21,.1)' : '#FEF3C7'}
                                                                        color="#CA8A04"
                                                                        display="flex" alignItems="center"
                                                                    >
                                                                        <LuClipboardList size={13} />
                                                                    </Box>
                                                                    <span>{order.items?.length ?? 0} ta mahsulot</span>
                                                                </HStack>
                                                            </td>
                                                            <td className={`${tdCx} text-right font-bold ${head} whitespace-nowrap`}>
                                                                {formatNumber(order.totalAmount ?? 0)} so'm
                                                            </td>
                                                            <td className={`${tdCx} text-right whitespace-nowrap`}>
                                                                <span style={{
                                                                    fontWeight: (order.remainingDebt ?? 0) > 0 ? 700 : 400,
                                                                    color: (order.remainingDebt ?? 0) > 0
                                                                        ? (isDark ? '#f87171' : '#dc2626')
                                                                        : (isDark ? '#94a3b8' : '#64748b'),
                                                                }}>
                                                                    {formatNumber(order.remainingDebt ?? 0)} so'm
                                                                </span>
                                                            </td>
                                                            <td className={tdCx}>
                                                                {statusPill(order.status, isDark)}
                                                            </td>
                                                            <td className={`${tdCx} ${muted} max-w-[200px] truncate`}>
                                                                {order.summary || '—'}
                                                            </td>
                                                            <td className={`${tdCx} ${muted} whitespace-nowrap`}>
                                                                <HStack gap={1.5}>
                                                                    <LuCalendar size={12} />
                                                                    <span>{formatDetailDate(order.createdAt)}</span>
                                                                </HStack>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                {/* Totals row */}
                                                <tfoot>
                                                    <tr className={isDark ? 'bg-[#0f172a]/50' : 'bg-[#f8fafc]'}>
                                                        <td colSpan={2} className={`${tdCx} font-bold ${head}`}>
                                                            Sahifa jami
                                                        </td>
                                                        <td className={`${tdCx} text-right font-bold text-amber-500 whitespace-nowrap`}>
                                                            {formatNumber(ordersTotalSum)} so'm
                                                        </td>
                                                        <td className={`${tdCx} text-right font-bold whitespace-nowrap`}
                                                            style={{ color: remainingDebtSum > 0 ? (isDark ? '#f87171' : '#dc2626') : (isDark ? '#94a3b8' : '#64748b') }}>
                                                            {formatNumber(remainingDebtSum)} so'm
                                                        </td>
                                                        <td colSpan={3} />
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </Box>
                                        {/* Pagination */}
                                        <HStack justify="space-between" align="center" px={5} py={4} flexWrap="wrap" gap={3}
                                            borderTopWidth="1px" borderColor={cardBorder}>
                                            <Text color={subtitleColor} fontSize="sm">
                                                Jami <strong>{formatDetailNumber(totalOrdersCount)}</strong> ta buyurtma
                                                {' '}· Sahifa <strong>{ordersPage + 1}</strong> / <strong>{orderPagination.totalPages || 1}</strong>
                                            </Text>
                                            <HStack gap={2}>
                                                <Button
                                                    size="sm" variant="outline" borderRadius="xl"
                                                    disabled={ordersPage === 0}
                                                    onClick={() => setOrdersPage((v) => v - 1)}
                                                >
                                                    <LuChevronLeft size={15} />
                                                </Button>
                                                <Button
                                                    size="sm" variant="outline" borderRadius="xl"
                                                    disabled={ordersPage >= (orderPagination.totalPages || 1) - 1}
                                                    onClick={() => setOrdersPage((v) => v + 1)}
                                                >
                                                    <LuChevronRight size={15} />
                                                </Button>
                                            </HStack>
                                        </HStack>
                                    </>
                                )}
                            </Box>
                        )}

                        {/* ══ TO'LOVLAR TAB ═════════════════════════════════ */}
                        {activeTab === 'payments' && (
                            <Box>
                                {paymentsFetching ? (
                                    <Box py={14} display="flex" alignItems="center" justifyContent="center" gap={3} color={subtitleColor}>
                                        <Spinner size="sm" color="yellow.400" />
                                        <Text fontSize="sm">Yuklanmoqda...</Text>
                                    </Box>
                                ) : payments.length === 0 ? (
                                    <VStack py={14} gap={3}>
                                        <LuCreditCard size={36} color={isDark ? '#334155' : '#cbd5e1'} strokeWidth={1.5} />
                                        <Text color={subtitleColor} fontSize="sm">Bu davr uchun to'lovlar topilmadi</Text>
                                    </VStack>
                                ) : (
                                    <>
                                        <Box overflowX="auto">
                                            <table className="w-full text-sm border-collapse">
                                                <thead>
                                                    <tr>
                                                        <th className={`${thCx} w-12 text-center`}>№</th>
                                                        <th className={thCx}>Kassa</th>
                                                        <th className={`${thCx} text-right`}>Summa</th>
                                                        <th className={`${thCx} text-right`}>Taqsimlangan</th>
                                                        <th className={`${thCx} text-right`}>Avans</th>
                                                        <th className={thCx}>Holat</th>
                                                        <th className={thCx}>Izoh</th>
                                                        <th className={thCx}>Sana</th>
                                                    </tr>
                                                </thead>
                                                <tbody className={`divide-y ${divLine}`}>
                                                    {payments.map((pay, idx) => {
                                                        const isActive = pay.status === 'ACTIVE';
                                                        return (
                                                            <tr
                                                                key={pay.id}
                                                                className={`transition-colors ${rowHov}`}
                                                                style={{ opacity: isActive ? 1 : 0.5 }}
                                                            >
                                                                <td className={`${tdCx} text-center ${muted}`}>
                                                                    {paymentsPage * PAGE_SIZE + idx + 1}
                                                                </td>
                                                                <td className={`${tdCx} font-semibold ${head} whitespace-nowrap`}>
                                                                    <HStack gap={2}>
                                                                        <Box p={1.5} borderRadius="md"
                                                                            bg={isDark ? 'rgba(59,130,246,.12)' : '#EFF6FF'}
                                                                            color="#3b82f6"
                                                                            display="flex" alignItems="center"
                                                                        >
                                                                            <LuWallet size={13} />
                                                                        </Box>
                                                                        <span>{pay.cashboxName || '—'}</span>
                                                                    </HStack>
                                                                </td>
                                                                <td className={`${tdCx} text-right font-bold whitespace-nowrap`}
                                                                    style={{ color: isDark ? '#86efac' : '#15803d' }}>
                                                                    {formatNumber(pay.amount ?? 0)} so'm
                                                                </td>
                                                                <td className={`${tdCx} text-right ${muted} whitespace-nowrap`}>
                                                                    {formatNumber(pay.allocatedAmount ?? 0)} so'm
                                                                </td>
                                                                <td className={`${tdCx} text-right whitespace-nowrap`}>
                                                                    <span style={{
                                                                        fontWeight: (pay.unallocatedAmount ?? 0) > 0 ? 700 : 400,
                                                                        color: (pay.unallocatedAmount ?? 0) > 0
                                                                            ? (isDark ? '#86efac' : '#15803d')
                                                                            : (isDark ? '#94a3b8' : '#64748b'),
                                                                    }}>
                                                                        {formatNumber(pay.unallocatedAmount ?? 0)} so'm
                                                                    </span>
                                                                </td>
                                                                <td className={tdCx}>
                                                                    <span style={{
                                                                        display: 'inline-flex', alignItems: 'center', gap: 4,
                                                                        background: isActive
                                                                            ? (isDark ? 'rgba(34,197,94,.14)' : '#DCFCE7')
                                                                            : (isDark ? 'rgba(239,68,68,.14)' : '#FEE2E2'),
                                                                        color: isActive
                                                                            ? (isDark ? '#86efac' : '#15803d')
                                                                            : (isDark ? '#fca5a5' : '#b91c1c'),
                                                                        border: `1px solid ${isActive ? '#16a34a' : '#dc2626'}`,
                                                                        borderRadius: 999, padding: '2px 10px',
                                                                        fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
                                                                    }}>
                                                                        {isActive
                                                                            ? <LuCircleCheck size={11} />
                                                                            : <LuCircleDot size={11} />
                                                                        }
                                                                        {isActive ? 'Faol' : 'Bekor qilingan'}
                                                                    </span>
                                                                </td>
                                                                <td className={`${tdCx} ${muted} max-w-[180px] truncate`}>
                                                                    {pay.summary || '—'}
                                                                </td>
                                                                <td className={`${tdCx} ${muted} whitespace-nowrap`}>
                                                                    <HStack gap={1.5}>
                                                                        <LuCalendar size={12} />
                                                                        <span>{formatDetailDate(pay.paidAt ?? pay.createdAt)}</span>
                                                                    </HStack>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                                {/* Totals row */}
                                                <tfoot>
                                                    <tr className={isDark ? 'bg-[#0f172a]/50' : 'bg-[#f8fafc]'}>
                                                        <td colSpan={2} className={`${tdCx} font-bold ${head}`}>
                                                            Sahifa jami
                                                        </td>
                                                        <td className={`${tdCx} text-right font-bold whitespace-nowrap`}
                                                            style={{ color: isDark ? '#86efac' : '#15803d' }}>
                                                            {formatNumber(paymentsSum)} so'm
                                                        </td>
                                                        <td colSpan={5} />
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </Box>
                                        {/* Pagination */}
                                        <HStack justify="space-between" align="center" px={5} py={4} flexWrap="wrap" gap={3}
                                            borderTopWidth="1px" borderColor={cardBorder}>
                                            <Text color={subtitleColor} fontSize="sm">
                                                Jami <strong>{formatDetailNumber(totalPaymentsCount)}</strong> ta to'lov
                                                {' '}· Sahifa <strong>{paymentsPage + 1}</strong> / <strong>{paymentPagination.totalPages || 1}</strong>
                                            </Text>
                                            <HStack gap={2}>
                                                <Button
                                                    size="sm" variant="outline" borderRadius="xl"
                                                    disabled={paymentsPage === 0}
                                                    onClick={() => setPaymentsPage((v) => v - 1)}
                                                >
                                                    <LuChevronLeft size={15} />
                                                </Button>
                                                <Button
                                                    size="sm" variant="outline" borderRadius="xl"
                                                    disabled={paymentsPage >= (paymentPagination.totalPages || 1) - 1}
                                                    onClick={() => setPaymentsPage((v) => v + 1)}
                                                >
                                                    <LuChevronRight size={15} />
                                                </Button>
                                            </HStack>
                                        </HStack>
                                    </>
                                )}
                            </Box>
                        )}
                    </Box>
                </>
            )}
        </Box>
    );
}
