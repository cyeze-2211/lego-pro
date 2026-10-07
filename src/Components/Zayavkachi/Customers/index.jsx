import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Box,
    Button,
    HStack,
    Heading,
    Table,
    Text,
    VStack,
} from '@chakra-ui/react';
import {
    LuChevronLeft, LuChevronRight, LuPhone, LuSearch,
    LuUsers, LuX, LuClock3, LuTriangleAlert, LuCalendarCheck,
    LuCalendarDays, LuStickyNote, LuSlidersHorizontal, LuChevronDown,
    LuChevronUp, LuRotateCcw, LuArrowUp, LuArrowDown, LuArrowUpDown,
} from 'react-icons/lu';
import { useGetCustomersQuery } from '../../../store/services/customer.api';
import { BRAND_COLORS, useAppTheme } from '../../../theme/tokens';
import { Alert } from '../../Other/UI/Alert/Alert';
import DeleteCustomer from '../__components/DeleteCustomer';
import CustomerCreate from '../../Common/Customer/__components/Create';
import CustomerEdit from '../../Common/Customer/__components/Edit';
import Loading from '../../Other/UI/Loadings/Loading';
import EmptyData from '../../Other/UI/NoData/EmptyData';
import { formatNumber } from '../../ui/number-format';

const DEFAULT_PAGE_SIZE = 20;
const EMPTY_CUSTOMERS = [];

/* ── Date helpers ── */
const formatShortDate = (value) => {
    if (!value) return '—';
    const [year, month, day] = value.split('-');
    return year && month && day ? `${day}.${month}.${year}` : value;
};

const daysDiff = (value) => {
    if (!value) return null;
    const target = new Date(value);
    const now = new Date();
    target.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    return Math.round((target - now) / 86400000);
};

const getStatusMeta = (paymentDate, isDark) => {
    const diff = daysDiff(paymentDate);
    if (diff === null) {
        return {
            label: '—',
            Icon: LuCalendarDays,
            color: isDark ? '#94a3b8' : '#64748b',
            bg: isDark ? 'rgba(148,163,184,.1)' : '#F1F5F9',
            border: isDark ? 'rgba(148,163,184,.25)' : '#E2E8F0',
        };
    }
    if (diff < 0) {
        return {
            label: `${Math.abs(diff)} kun o‘tgan`,
            Icon: LuTriangleAlert,
            color: isDark ? '#fca5a5' : '#dc2626',
            bg: isDark ? 'rgba(239,68,68,.12)' : '#FEF2F2',
            border: isDark ? 'rgba(239,68,68,.3)' : '#FECACA',
        };
    }
    if (diff === 0) {
        return {
            label: 'Bugun',
            Icon: LuClock3,
            color: isDark ? '#fde68a' : '#b45309',
            bg: isDark ? 'rgba(250,204,21,.14)' : '#FFFBEB',
            border: isDark ? 'rgba(250,204,21,.35)' : '#FDE68A',
        };
    }
    if (diff <= 3) {
        return {
            label: `${diff} kun qoldi`,
            Icon: LuClock3,
            color: isDark ? '#93c5fd' : '#1d4ed8',
            bg: isDark ? 'rgba(59,130,246,.14)' : '#EFF6FF',
            border: isDark ? 'rgba(59,130,246,.3)' : '#BFDBFE',
        };
    }
    return {
        label: `${diff} kun qoldi`,
        Icon: LuCalendarCheck,
        color: isDark ? '#86efac' : '#15803d',
        bg: isDark ? 'rgba(34,197,94,.12)' : '#F0FDF4',
        border: isDark ? 'rgba(34,197,94,.3)' : '#BBF7D0',
    };
};

/* ── Sort options ──
 * server: true  → уходит в API (поддерживается бэком)
 * server: false → клиентская сортировка (только текущая страница)
 */
const SORT_OPTIONS = [
    { key: 'name',           label: 'Nomi',           server: true,  defaultDir: 'asc'  },
    { key: 'phone',          label: 'Telefon',        server: false, defaultDir: 'asc'  },
    { key: 'balance',        label: 'Qoldiq',         server: false, defaultDir: 'asc'  },
    { key: 'createdAt',      label: 'Yaratilgan',     server: true,  defaultDir: 'desc' },
    { key: 'lastModifiedAt', label: 'O‘zgartirilgan', server: true,  defaultDir: 'desc' },
    { key: 'id',             label: 'ID',             server: true,  defaultDir: 'asc'  },
];

const DEFAULT_SORT_KEY = 'createdAt';
const DEFAULT_SORT_DIR = 'desc';

/* ── Client-side sort helper ── */
const applyClientSort = (arr, key, dir) => {
    const sorted = [...arr];
    const mult = dir === 'asc' ? 1 : -1;

    const getValue = (item) => {
        switch (key) {
            case 'phone': {
                /* Нормализуем: только цифры → строкой */
                const digits = String(item.phone ?? '').replace(/\D/g, '');
                return digits;
            }
            case 'balance':
                return Number(item.balance) || 0;
            default:
                return '';
        }
    };

    sorted.sort((a, b) => {
        const va = getValue(a);
        const vb = getValue(b);
        if (typeof va === 'number' && typeof vb === 'number') {
            return (va - vb) * mult;
        }
        return String(va).localeCompare(String(vb), 'uz', { numeric: key === 'phone' }) * mult;
    });

    return sorted;
};

export default function ZayavkachiCustomers() {
    const { pathname } = useLocation();
    const base = pathname.startsWith('/kassir') ? '/kassir' : '/zayavkachi';

    /* ── Filter state ── */
    const [search, setSearch]           = useState('');
    const [query, setQuery]             = useState('');
    const [page, setPage]               = useState(0);
    const [pageSize, setPageSize]       = useState(DEFAULT_PAGE_SIZE);
    const [sortKey, setSortKey]         = useState(DEFAULT_SORT_KEY);
    const [sortDir, setSortDir]         = useState(DEFAULT_SORT_DIR);
    const [filtersOpen, setFiltersOpen] = useState(true);

    /* ── Определяем, где сортируем ── */
    const activeSortOption = SORT_OPTIONS.find((o) => o.key === sortKey) || SORT_OPTIONS[0];
    const isClientSort = !activeSortOption.server;

    /* ── API query — server-side sort только для поддерживаемых полей ── */
    const serverSortKey = activeSortOption.server ? sortKey : DEFAULT_SORT_KEY;
    const serverSortDir = activeSortOption.server ? sortDir : DEFAULT_SORT_DIR;

    const { data: customerResult, isLoading, error } = useGetCustomersQuery({
        name: query || undefined,
        page,
        size: pageSize,
        sort: [`${serverSortKey},${serverSortDir.toUpperCase()}`, 'id,DESC'],
    });

    const { isDark, pageBg, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();

    const rawCustomers = customerResult?.items ?? EMPTY_CUSTOMERS;

    /* ── Клиентская сортировка (для phone / balance) ── */
    const customers = useMemo(() => {
        if (!isClientSort) return rawCustomers;
        return applyClientSort(rawCustomers, sortKey, sortDir);
    }, [rawCustomers, isClientSort, sortKey, sortDir]);

    const pagination = customerResult?.pagination;
    const totalPages = pagination?.totalPages || 0;
    const totalElements = pagination?.totalElements ?? rawCustomers.length;
    const tableBg = isDark ? BRAND_COLORS.darkCardBg : cardBg;
    const tableHeaderBg = isDark ? tableBg : '#F8FAFC';
    const tableBorder = isDark ? cardBorder : '#CBD5E1';
    const line = isDark ? 'border-[#334155]/60' : 'border-[#f1f5f9]';

    /* ── Search ── */
    const submitSearch = (event) => {
        event?.preventDefault?.();
        const nextQuery = search.trim();
        if (nextQuery !== query) {
            setPage(0);
            setQuery(nextQuery);
        }
    };

    const clearSearch = () => {
        setSearch('');
        setQuery('');
        setPage(0);
    };

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            const nextQuery = search.trim();
            if (nextQuery !== query) {
                setPage(0);
                setQuery(nextQuery);
            }
        }, 350);

        return () => window.clearTimeout(timeoutId);
    }, [search, query]);

    /* ── Sort handler ── */
    const handleSort = (key) => {
        const option = SORT_OPTIONS.find((o) => o.key === key);
        if (sortKey === key) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDir(option?.defaultDir || 'asc');
        }
        setPage(0);
    };

    useEffect(() => {
        if (error) Alert(error?.data?.message || 'Mijozlarni yuklashda xatolik', 'error');
    }, [error]);

    /* ── Helpers ── */
    const isDefaultSort = sortKey === DEFAULT_SORT_KEY && sortDir === DEFAULT_SORT_DIR;
    const hasFilter = Boolean(query || !isDefaultSort || pageSize !== DEFAULT_PAGE_SIZE);

    const activeCount =
        (query ? 1 : 0) +
        (!isDefaultSort ? 1 : 0) +
        (pageSize !== DEFAULT_PAGE_SIZE ? 1 : 0);

    const resetFilters = () => {
        setSearch('');
        setQuery('');
        setSortKey(DEFAULT_SORT_KEY);
        setSortDir(DEFAULT_SORT_DIR);
        setPageSize(DEFAULT_PAGE_SIZE);
        setPage(0);
    };

    const renderBalance = (balance) => {
        const value = Number(balance) || 0;
        if (value < 0) {
            return <Text fontWeight="bold" whiteSpace="nowrap" color={isDark ? 'red.300' : 'red.600'}>{formatNumber(Math.abs(value))} so‘m (qarzdor)</Text>;
        }
        if (value > 0) {
            return <Text fontWeight="bold" whiteSpace="nowrap" color={isDark ? 'green.300' : 'green.700'}>{formatNumber(value)} so‘m (kredit)</Text>;
        }
        return <Text color={subtitleColor} whiteSpace="nowrap">0 so‘m</Text>;
    };

    /* ── theme ── */
    const inputCx = [
        'w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all duration-200 h-[42px]',
        isDark
            ? 'border-white/10 bg-[#1e293b]/80 text-white placeholder:text-slate-500 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'
            : 'border-[#e2e8f0] bg-white text-[#0f172a] placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20',
    ].join(' ');

    const createButton = <CustomerCreate />;

    return (
        <Box my={2} bg={pageBg} color={textColor} minH="100%">

            {/* ── Header ── */}
            <HStack justify="space-between" align="start" flexWrap="wrap" gap={4} mb={4}>
                <Box>
                    <Heading className="text-[35px] font-semibold" color={textColor}>Mijozlar</Heading>
                    <Text color={subtitleColor} fontSize="sm" mt={1}>
                        Jami: {totalElements} ta mijoz
                    </Text>
                </Box>
                {createButton}
            </HStack>

            {/* ── Accordion Filters ── */}
            <Box
                bg={cardBg}
                borderWidth="1px"
                borderColor={cardBorder}
                borderRadius="2xl"
                mb={4}
                overflow="hidden"
                boxShadow={isDark ? 'none' : '0 4px 16px rgba(15,23,42,.04)'}
            >
                <button
                    type="button"
                    onClick={() => setFiltersOpen((v) => !v)}
                    aria-expanded={filtersOpen}
                    className={`flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors ${
                        filtersOpen ? `border-b ${line}` : ''
                    } ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50/50'}`}
                >
                    <div className="flex items-center gap-2.5">
                        <span className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                            hasFilter
                                ? 'bg-amber-400/15 text-amber-500'
                                : isDark ? 'bg-white/[0.04] text-slate-400' : 'bg-slate-100 text-slate-500'
                        }`}>
                            <LuSlidersHorizontal size={14} />
                        </span>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#0f172a]'}`}>
                                    Filterlar
                                </span>
                                {activeCount > 0 && (
                                    <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-400 px-1.5 text-[10px] font-bold text-[#0f172a]">
                                        {activeCount}
                                    </span>
                                )}
                            </div>

                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {hasFilter && filtersOpen && (
                            <span
                                role="button"
                                tabIndex={0}
                                onClick={(e) => { e.stopPropagation(); resetFilters(); }}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); resetFilters(); } }}
                                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                                    isDark
                                        ? 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-amber-400/30 hover:text-amber-400'
                                        : 'border-[#e2e8f0] bg-white text-[#475569] hover:border-amber-400 hover:text-amber-600'
                                }`}
                            >
                                <LuRotateCcw size={12} />
                                <span>Tozalash</span>
                            </span>
                        )}
                        <span className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                            isDark ? 'bg-white/[0.04] text-slate-300' : 'bg-slate-100 text-slate-600'
                        }`}>
                            {filtersOpen ? <LuChevronUp size={15} /> : <LuChevronDown size={15} />}
                        </span>
                    </div>
                </button>

                <div className={`grid transition-all duration-300 ease-in-out ${
                    filtersOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}>
                    <div className="overflow-hidden">
                        <Box p={5} bg={cardBg}>

                            <form onSubmit={submitSearch} >
                                <div className="lg:col-span-5">
                                    <label className={`mb-1.5 flex items-center gap-1.5 text-xs font-semibold ${subtitleColor}`}>
                                        <LuSearch size={13} /> Mijoz nomi bo‘yicha qidirish
                                    </label>
                                    <div className="relative">
                                        <LuSearch className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 ${subtitleColor}`} />
                                        <input
                                            type="search"
                                            placeholder="Mijoz nomini kiriting..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className={`${inputCx} pl-10 pr-10`}
                                            aria-label="Mijoz qidirish"
                                        />
                                        {search && (
                                            <button
                                                type="button"
                                                onClick={clearSearch}
                                                className={`absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full transition-colors ${
                                                    isDark ? 'text-slate-400 hover:bg-white/[0.06] hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                                                }`}
                                                aria-label="Qidiruvni tozalash"
                                            >
                                                <LuX size={13} />
                                            </button>
                                        )}
                                    </div>

                                </div>
                            </form>
                        </Box>
                    </div>
                </div>
            </Box>

            {/* ── Content ── */}
            {isLoading ? (
                <Loading />
            ) : error ? (
                <Box p={8} textAlign="center" color={isDark ? 'red.300' : 'red.600'}>Ma&apos;lumotlarni yuklashda xatolik</Box>
            ) : customers.length === 0 ? (
                <EmptyData
                    text={query ? 'Qidiruv bo‘yicha mijoz topilmadi' : 'Hozircha mijozlar yo‘q'}
                    description={query ? "Boshqa nom bilan qidirib ko‘ring yoki filtrlarni tozalang." : "Yangi mijoz qo‘shib ma’lumotnomani to‘ldiring."}
                    action={hasFilter ? (
                        <Button onClick={resetFilters} variant="outline" borderColor={cardBorder} color={textColor} borderRadius="xl">
                            <HStack gap={2}><LuRotateCcw size={16} /><span>Filtrlarni tozalash</span></HStack>
                        </Button>
                    ) : createButton}
                />
            ) : (
                <>
                    <Box overflowX="auto" bg={tableBg} borderWidth="0.5px" borderColor={tableBorder} borderRadius="10px" boxShadow={isDark ? '0 16px 40px rgba(0, 0, 0, 0.22)' : '0 8px 24px rgba(15, 23, 42, 0.10)'}>
                        <Table.Root size="md" interactive bg={tableBg} borderCollapse="collapse" minW="1200px">
                            <Table.Header bg={tableHeaderBg}>
                                <Table.Row bg={tableHeaderBg}>
                                    <Table.ColumnHeader textAlign="center" bg={tableHeaderBg} borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor} w="60px">№</Table.ColumnHeader>

                                    {/* Mijoz — sortable */}
                                    <Table.ColumnHeader bg={tableHeaderBg} borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor}>
                                        <button
                                            type="button"
                                            onClick={() => handleSort('name')}
                                            className={`group inline-flex items-center gap-1.5 font-semibold uppercase tracking-wide text-[11px] transition-colors ${
                                                sortKey === 'name'
                                                    ? (isDark ? 'text-amber-300' : 'text-amber-600')
                                                    : (isDark ? 'text-slate-400 hover:text-amber-300' : 'text-slate-500 hover:text-amber-600')
                                            }`}
                                            aria-label="Nomi bo‘yicha saralash"
                                            title="Nomi bo‘yicha saralash"
                                        >
                                            <span>Mijoz</span>
                                            {sortKey === 'name'
                                                ? (sortDir === 'asc' ? <LuArrowUp size={12} /> : <LuArrowDown size={12} />)
                                                : <LuArrowUpDown size={12} className="opacity-40 group-hover:opacity-100" />}
                                        </button>
                                    </Table.ColumnHeader>

                                    {/* Telefon — sortable (client-side) */}
                                    <Table.ColumnHeader bg={tableHeaderBg} borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor}>
                                        <button
                                            type="button"
                                            onClick={() => handleSort('phone')}
                                            className={`group inline-flex items-center gap-1.5 font-semibold uppercase tracking-wide text-[11px] transition-colors ${
                                                sortKey === 'phone'
                                                    ? (isDark ? 'text-amber-300' : 'text-amber-600')
                                                    : (isDark ? 'text-slate-400 hover:text-amber-300' : 'text-slate-500 hover:text-amber-600')
                                            }`}
                                            aria-label="Telefon bo‘yicha saralash (sahifa ichida)"
                                            title="Telefon bo‘yicha saralash (sahifa ichida)"
                                        >
                                            <span>Telefon</span>
                                            {sortKey === 'phone'
                                                ? (sortDir === 'asc' ? <LuArrowUp size={12} /> : <LuArrowDown size={12} />)
                                                : <LuArrowUpDown size={12} className="opacity-40 group-hover:opacity-100" />}
                                        </button>
                                    </Table.ColumnHeader>

                                    <Table.ColumnHeader bg={tableHeaderBg} borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor}>Izoh</Table.ColumnHeader>
                                    <Table.ColumnHeader bg={tableHeaderBg} borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor} minW="230px">Eslatma</Table.ColumnHeader>

                                    {/* Qoldiq — sortable (client-side) */}
                                    <Table.ColumnHeader bg={tableHeaderBg} borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor}>
                                        <button
                                            type="button"
                                            onClick={() => handleSort('balance')}
                                            className={`group inline-flex items-center gap-1.5 font-semibold uppercase tracking-wide text-[11px] transition-colors ${
                                                sortKey === 'balance'
                                                    ? (isDark ? 'text-amber-300' : 'text-amber-600')
                                                    : (isDark ? 'text-slate-400 hover:text-amber-300' : 'text-slate-500 hover:text-amber-600')
                                            }`}
                                            aria-label="Qoldiq bo‘yicha saralash (sahifa ichida)"
                                            title="Qoldiq bo‘yicha saralash (sahifa ichida)"
                                        >
                                            <span>Qoldiq</span>
                                            {sortKey === 'balance'
                                                ? (sortDir === 'asc' ? <LuArrowUp size={12} /> : <LuArrowDown size={12} />)
                                                : <LuArrowUpDown size={12} className="opacity-40 group-hover:opacity-100" />}
                                        </button>
                                    </Table.ColumnHeader>

                                    <Table.ColumnHeader textAlign="center" bg={tableHeaderBg} borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor} w="140px">Amallar</Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body bg={tableBg}>
                                {customers.map((customer, index) => {
                                    const reminder = customer.lastReminder;
                                    const status = reminder ? getStatusMeta(reminder.paymentDate, isDark) : null;
                                    const StatusIcon = status?.Icon;

                                    return (
                                        <Table.Row key={customer.id} bg={tableBg} _hover={{ bg: isDark ? 'rgba(250, 204, 21, 0.06)' : '#FFFBEB' }}>
                                            <Table.Cell borderWidth="0.5px" borderColor={tableBorder} textAlign="center" color={subtitleColor}>
                                                {page * pageSize + index + 1}
                                            </Table.Cell>

                                            <Table.Cell borderWidth="0.5px" borderColor={tableBorder}>
                                                <HStack gap={3}>
                                                    <Box p={2} borderRadius="lg" bg={isDark ? 'rgba(250, 204, 21, 0.12)' : '#FEF3C7'} color={accentColor}><LuUsers size={18} /></Box>
                                                    <Text as={Link} to={`${base}/customers/${customer.id}`} fontWeight="semibold" color={textColor} _hover={{ color: accentColor }}>{customer.name}</Text>
                                                </HStack>
                                            </Table.Cell>

                                            <Table.Cell borderWidth="0.5px" borderColor={tableBorder}>
                                                <HStack gap={2} color={textColor} whiteSpace="nowrap"><LuPhone size={14} color={subtitleColor} /><span>{customer.phone}</span></HStack>
                                            </Table.Cell>

                                            <Table.Cell borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor} maxW="220px">
                                                <Text noOfLines={2}>{customer.summary || '—'}</Text>
                                            </Table.Cell>

                                            <Table.Cell borderWidth="0.5px" borderColor={tableBorder} minW="230px">
                                                {reminder ? (
                                                    <VStack align="start" gap={1.5}>
                                                        <HStack gap={2} flexWrap="wrap">
                                                            <Text fontSize="sm" fontWeight="bold" color={textColor} whiteSpace="nowrap">
                                                                {formatShortDate(reminder.paymentDate)}
                                                            </Text>
                                                            {status && StatusIcon && (
                                                                <HStack
                                                                    gap={1}
                                                                    px={2}
                                                                    py={0.5}
                                                                    borderRadius="full"
                                                                    bg={status.bg}
                                                                    borderWidth="1px"
                                                                    borderColor={status.border}
                                                                    color={status.color}
                                                                >
                                                                    <StatusIcon size={10} />
                                                                    <Text fontSize="10px" fontWeight="bold" lineHeight="1.3">
                                                                        {status.label}
                                                                    </Text>
                                                                </HStack>
                                                            )}
                                                        </HStack>

                                                        {reminder.price !== null && reminder.price !== undefined && (
                                                            <Text fontSize="sm" fontWeight="bold" color={isDark ? 'green.300' : 'green.700'} whiteSpace="nowrap">
                                                                {formatNumber(reminder.price)} so‘m
                                                            </Text>
                                                        )}

                                                        {reminder.note && (
                                                            <HStack gap={1.5} align="start" color={subtitleColor} maxW="230px">
                                                                <LuStickyNote size={11} style={{ flexShrink: 0, marginTop: 3 }} />
                                                                <Text fontSize="xs" noOfLines={1} title={reminder.note}>
                                                                    {reminder.note}
                                                                </Text>
                                                            </HStack>
                                                        )}
                                                    </VStack>
                                                ) : (
                                                    <Text fontSize="sm" color={subtitleColor} fontStyle="italic">—</Text>
                                                )}
                                            </Table.Cell>

                                            <Table.Cell borderWidth="0.5px" borderColor={tableBorder}>{renderBalance(customer.balance)}</Table.Cell>

                                            <Table.Cell borderWidth="0.5px" borderColor={tableBorder}>
                                                <HStack justify="center" gap={1}>
                                                    <CustomerEdit customer={customer} />
                                                    <DeleteCustomer customer={customer} />
                                                </HStack>
                                            </Table.Cell>
                                        </Table.Row>
                                    );
                                })}
                            </Table.Body>
                        </Table.Root>
                    </Box>

                    {/* ── Pagination ── */}
                    {totalPages > 1 && (
                        <HStack justify="center" mt={6} gap={3}>
                            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((v) => v - 1)} aria-label="Oldingi sahifa">
                                <LuChevronLeft />
                            </Button>
                            <Text color={subtitleColor} fontSize="sm" fontWeight="semibold">
                                {page + 1} / {totalPages}
                            </Text>
                            <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage((v) => v + 1)} aria-label="Keyingi sahifa">
                                <LuChevronRight />
                            </Button>
                        </HStack>
                    )}
                </>
            )}
        </Box>
    );
}