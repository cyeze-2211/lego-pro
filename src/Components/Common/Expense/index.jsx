import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router-dom';
import { Badge, Box, Button, HStack, Heading, SimpleGrid, Table, Text } from '@chakra-ui/react';
import {
    LuArrowDown, LuArrowDownWideNarrow, LuArrowUp, LuArrowUpDown, LuCalendarDays, LuChevronDown, LuChevronUp, LuClock3, LuExternalLink, LuLayers, LuReceiptText, LuRotateCcw, LuSearch,
    LuSlidersHorizontal, LuWallet, LuX,
} from 'react-icons/lu';
import { useGetExpensesQuery } from '../../../store/services/expense.api';
import { ROLES } from '../../../app/permissions/roles';
import { useAppSelector } from '../../../store/hooks';
import { useGetCashboxesQuery } from '../../../store/services/cashbox.api';
import { useGetExpenseCategoriesQuery } from '../../../store/services/expenseCategory.api';
import { BRAND_COLORS, useAppTheme } from '../../../theme/tokens';
import { Alert } from '../../Other/UI/Alert/Alert';
import Loading from '../../Other/UI/Loadings/Loading';
import EmptyData from '../../Other/UI/NoData/EmptyData';
import FormControl from '../../ui/FormControl';
import { formatNumber } from '../../ui/number-format';
import { formatDate, formatDateTime, formatTime } from '../../ui/date-format';
import { CurrencyNote } from '../../ui/CurrencyAmountField';
import Create from './__components/Create';
import Edit from './__components/Edit';
import Delete from './__components/Delete';
import { useInfiniteList } from '../../ui/useInfiniteList';
import InfiniteSentinel from '../../ui/InfiniteSentinel';

const PAGE_SIZE = 20;

const SORT_OPTIONS = [
    { value: 'expenseDate,DESC', label: 'Sana: yangi → eski' },
    { value: 'expenseDate,ASC', label: 'Sana: eski → yangi' },
    { value: 'amount,DESC', label: 'Summa: katta → kichik' },
    { value: 'amount,ASC', label: 'Summa: kichik → katta' },
    { value: 'name,ASC', label: 'Nomi: A → Z' },
    { value: 'name,DESC', label: 'Nomi: Z → A' },
    { value: 'category.name,ASC', label: 'Kategoriya: A → Z' },
    { value: 'category.name,DESC', label: 'Kategoriya: Z → A' },
    { value: 'cashbox.name,ASC', label: 'Kassa: A → Z' },
    { value: 'cashbox.name,DESC', label: 'Kassa: Z → A' },
    { value: 'createdAt,DESC', label: 'Kiritilgan: yangi → eski' },
    { value: 'createdAt,ASC', label: 'Kiritilgan: eski → yangi' },
];

/* Jadval ustunlari uchun: qaysi maydon bo‘yicha saralanadi va birinchi bosishda qaysi yo‘nalish */
const COLUMN_SORT = {
    name: { key: 'name', defaultDir: 'ASC' },
    category: { key: 'category.name', defaultDir: 'ASC' },
    cashbox: { key: 'cashbox.name', defaultDir: 'ASC' },
    date: { key: 'expenseDate', defaultDir: 'DESC' },
    amount: { key: 'amount', defaultDir: 'DESC' },
};

const EMPTY_FILTERS = { cashboxId: '', categoryId: '', dateFrom: '', dateTo: '' };
const DEFAULT_SORT = SORT_OPTIONS[0].value;
const sortLabel = (value) => SORT_OPTIONS.find((o) => o.value === value)?.label || value.replace(',', ' · ');

/* ── Sana yordamchilari ────────────────────────────────────────────────── */
const toIso = (date) => {
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
};

const DATE_PRESETS = [
    { key: 'today', label: 'Bugun', range: () => { const d = new Date(); return [toIso(d), toIso(d)]; } },
    { key: 'week', label: 'Shu hafta', range: () => { const d = new Date(); const day = (d.getDay() + 6) % 7; const from = new Date(d); from.setDate(d.getDate() - day); return [toIso(from), toIso(d)]; } },
    { key: 'month', label: 'Shu oy', range: () => { const d = new Date(); return [toIso(new Date(d.getFullYear(), d.getMonth(), 1)), toIso(d)]; } },
    { key: 'prevMonth', label: 'O‘tgan oy', range: () => { const d = new Date(); return [toIso(new Date(d.getFullYear(), d.getMonth() - 1, 1)), toIso(new Date(d.getFullYear(), d.getMonth(), 0))]; } },
];


/* ── Saralanadigan ustun sarlavhasi ────────────────────────────────────── */
function SortableHeader({ column, label, sort, onSort, align = 'left', ...props }) {
    const { accentColor, subtitleColor, textColor } = useAppTheme();
    const meta = COLUMN_SORT[column];
    const [activeKey, activeDir] = sort.split(',');
    const isActive = activeKey === meta.key;
    const Icon = !isActive ? LuArrowUpDown : activeDir === 'ASC' ? LuArrowUp : LuArrowDown;
    const title = !isActive
        ? 'Saralash'
        : activeDir === 'ASC' ? 'O‘sish bo‘yicha (ASC) — teskarisiga o‘tkazish' : 'Kamayish bo‘yicha (DESC) — teskarisiga o‘tkazish';
    return (
        <Table.ColumnHeader {...props} cursor="pointer" userSelect="none" onClick={() => onSort(column)} title={title} aria-sort={isActive ? (activeDir === 'ASC' ? 'ascending' : 'descending') : 'none'} _hover={{ color: textColor }}>
            <HStack gap={1.5} justify={align === 'right' ? 'flex-end' : 'flex-start'} display="inline-flex" w="100%" color={isActive ? accentColor : undefined}>
                <span>{label}</span>
                <Box as="span" color={isActive ? accentColor : subtitleColor} opacity={isActive ? 1 : 0.6} display="inline-flex"><Icon size={13} /></Box>
                {isActive && <Text as="span" fontSize="9px" fontWeight="bold" letterSpacing="wider">{activeDir}</Text>}
            </HStack>
        </Table.ColumnHeader>
    );
}
SortableHeader.propTypes = {
    column: PropTypes.oneOf(Object.keys(COLUMN_SORT)).isRequired, label: PropTypes.string.isRequired,
    sort: PropTypes.string.isRequired, onSort: PropTypes.func.isRequired, align: PropTypes.oneOf(['left', 'right']),
};

/* ── Filtr chipi ───────────────────────────────────────────────────────── */
function FilterChip({ icon: Icon, children, onRemove }) {
    const { cardBg, cardBorder, textColor, subtitleColor } = useAppTheme();
    return (
        <HStack gap={1.5} px={3} py={1} borderRadius="full" borderWidth="1px" borderColor={cardBorder} bg={cardBg} color={textColor} fontSize="sm">
            <Icon size={12} /><span>{children}</span>
            <Button variant="ghost" size="xs" minW={0} w="18px" h="18px" p={0} borderRadius="full" color={subtitleColor} onClick={onRemove} aria-label="Filtrni olib tashlash"><LuX size={12} /></Button>
        </HStack>
    );
}
FilterChip.propTypes = { icon: PropTypes.elementType.isRequired, children: PropTypes.node, onRemove: PropTypes.func.isRequired };

/* ── Sahifa ────────────────────────────────────────────────────────────── */
export default function Expense() {
    const { pathname } = useLocation();
    const base = pathname.startsWith('/kassir') ? '/kassir' : '';
    const role = useAppSelector((state) => state.auth.role);
    const canManage = role !== ROLES.XIMIK;

    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const [applied, setApplied] = useState(EMPTY_FILTERS);
    const [sort, setSort] = useState(DEFAULT_SORT);
    const [page, setPage] = useState(0);
    const [filtersOpen, setFiltersOpen] = useState(true);

    const { data: result, isLoading, isFetching, error } = useGetExpensesQuery({
        ...applied,
        page,
        size: PAGE_SIZE,
        sort: [sort, 'id,DESC'],
    });
    const { data: cashboxes = [] } = useGetCashboxesQuery();
    const { data: categoryResult } = useGetExpenseCategoriesQuery({ page: 0, size: 200 });
    const categories = categoryResult?.items ?? [];

    const { isDark, pageBg, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();

    const { items: expenses, hasMore, sentinelRef, loadingMore, loadMore } = useInfiniteList({
        items: result?.items,
        pagination: result?.pagination,
        page,
        setPage,
        isFetching,
        resetKey: JSON.stringify({ ...applied, sort: [sort, 'id,DESC'] }),
    });
    const pagination = result?.pagination;
    const totalElements = pagination?.totalElements ?? 0;
    const pageSum = useMemo(() => expenses.reduce((acc, item) => acc + (Number(item.amount) || 0), 0), [expenses]);

    const tableBg = isDark ? BRAND_COLORS.darkCardBg : cardBg;
    const tableHeaderBg = isDark ? tableBg : '#F8FAFC';
    const tableBorder = isDark ? cardBorder : '#CBD5E1';
    const cellBorder = { borderWidth: '0.5px', borderColor: tableBorder, verticalAlign: 'middle', px: 3, py: 2.5 };
    const headerCell = { ...cellBorder, bg: tableHeaderBg, color: subtitleColor, fontSize: 'xs', fontWeight: 'semibold', textTransform: 'uppercase', letterSpacing: 'wider', whiteSpace: 'nowrap' };
    const accentSoft = isDark ? 'rgb(var(--accent-400) / .12)' : 'rgb(var(--accent-warm-100))';
    const dangerColor = isDark ? 'red.300' : 'red.600';

    useEffect(() => { if (error) Alert(error?.data?.message || 'Xarajatlarni yuklashda xatolik', 'error'); }, [error]);

    const appliedCount = Object.values(applied).filter(Boolean).length + (sort !== DEFAULT_SORT ? 1 : 0);
    const hasPending = JSON.stringify(filters) !== JSON.stringify(applied);
    const hasApplied = appliedCount > 0;

    const selectedCashbox = cashboxes.find((c) => c.id === applied.cashboxId);
    const selectedCategory = categories.find((c) => c.id === applied.categoryId);
    const activePreset = DATE_PRESETS.find((p) => { const [from, to] = p.range(); return filters.dateFrom === from && filters.dateTo === to; })?.key;

    const applyFilters = (event) => {
        event?.preventDefault?.();
        if (filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo) {
            Alert('Boshlanish sanasi tugash sanasidan katta bo‘lmasligi kerak', 'error');
            return;
        }
        setApplied(filters);
        setPage(0);
    };

    const clearFilters = () => {
        setFilters(EMPTY_FILTERS);
        setApplied(EMPTY_FILTERS);
        setSort(DEFAULT_SORT);
        setPage(0);
    };

    const removeApplied = (key) => {
        const next = { ...applied, [key]: '' };
        if (key === 'date') { next.dateFrom = ''; next.dateTo = ''; }
        setFilters(next);
        setApplied(next);
        setPage(0);
    };

    const applyPreset = (preset) => {
        const [from, to] = preset.range();
        const next = { ...filters, dateFrom: from, dateTo: to };
        setFilters(next);
        setApplied(next);
        setPage(0);
    };

    const setField = (key) => (event) => setFilters((prev) => ({ ...prev, [key]: event.target.value }));

    const handleColumnSort = (column) => {
        const meta = COLUMN_SORT[column];
        const [activeKey, activeDir] = sort.split(',');
        const nextDir = activeKey === meta.key ? (activeDir === 'ASC' ? 'DESC' : 'ASC') : meta.defaultDir;
        setSort(`${meta.key},${nextDir}`);
        setPage(0);
    };

    return (
        <Box my={2} bg={pageBg} color={textColor} minH="100%">
            {/* ── Sarlavha ── */}
            <HStack justify="space-between" align="start" flexWrap="wrap" gap={4} mb={4}>
                <Box>
                    <Heading className="text-[35px] font-semibold" color={textColor}>Xarajatlar</Heading>
                    <Text color={subtitleColor} fontSize="sm" mt={1}>Jami: {formatNumber(totalElements)} ta xarajat</Text>
                </Box>
                {canManage && <Create cashboxes={cashboxes} />}
            </HStack>

            {/* ── Filtrlar ── */}
            <Box bg={cardBg} borderWidth="1px" borderColor={cardBorder} borderRadius="2xl" mb={4} overflow="hidden" boxShadow={isDark ? 'none' : '0 4px 16px rgba(15,23,42,.04)'}>
                <HStack
                    as="button"
                    type="button"
                    w="100%"
                    justify="space-between"
                    px={5}
                    py={3.5}
                    textAlign="left"
                    onClick={() => setFiltersOpen((v) => !v)}
                    aria-expanded={filtersOpen}
                    borderBottomWidth={filtersOpen ? '1px' : 0}
                    borderColor={cardBorder}
                    _hover={{ bg: isDark ? 'whiteAlpha.50' : 'gray.50' }}
                >
                    <HStack gap={2.5}>
                        <Box w="32px" h="32px" borderRadius="xl" display="flex" alignItems="center" justifyContent="center" bg={hasApplied ? accentSoft : (isDark ? 'whiteAlpha.100' : 'gray.100')} color={hasApplied ? accentColor : subtitleColor}>
                            <LuSlidersHorizontal size={14} />
                        </Box>
                        <Text fontWeight="bold" fontSize="sm" color={textColor}>Filtrlar</Text>
                        {appliedCount > 0 && (
                            <Badge borderRadius="full" bg={accentColor} color="black" fontSize="10px" fontWeight="bold" px={1.5} minW="20px" h="20px" display="inline-flex" alignItems="center" justifyContent="center">{appliedCount}</Badge>
                        )}
                    </HStack>
                    <HStack gap={2}>
                        {hasApplied && (
                            <Box
                                as="span"
                                role="button"
                                tabIndex={0}
                                onClick={(e) => { e.stopPropagation(); clearFilters(); }}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); clearFilters(); } }}
                                display="inline-flex"
                                alignItems="center"
                                gap={1.5}
                                px={3}
                                py={1.5}
                                borderRadius="xl"
                                borderWidth="1px"
                                borderColor={cardBorder}
                                fontSize="xs"
                                fontWeight="semibold"
                                color={subtitleColor}
                                _hover={{ borderColor: accentColor, color: accentColor }}
                            >
                                <LuRotateCcw size={12} /><span>Tozalash</span>
                            </Box>
                        )}
                        <Box w="32px" h="32px" borderRadius="xl" display="flex" alignItems="center" justifyContent="center" bg={isDark ? 'whiteAlpha.100' : 'gray.100'} color={subtitleColor}>
                            {filtersOpen ? <LuChevronUp size={15} /> : <LuChevronDown size={15} />}
                        </Box>
                    </HStack>
                </HStack>

                {filtersOpen && (
                    <Box as="form" onSubmit={applyFilters} p={5}>
                        <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap={4} alignItems="end">
                            <Box>
                                <HStack gap={1.5} mb={1.5} fontSize="xs" fontWeight="semibold" color={subtitleColor}><LuWallet size={13} /><span>Kassa</span></HStack>
                                <FormControl as="select" value={filters.cashboxId} onChange={setField('cashboxId')} minH="44px" aria-label="Kassa bo‘yicha filtrlash">
                                    <option value="">Barcha kassalar</option>
                                    {cashboxes.map((cashbox) => <option key={cashbox.id} value={cashbox.id}>{cashbox.name}</option>)}
                                </FormControl>
                            </Box>
                            <Box>
                                <HStack gap={1.5} mb={1.5} fontSize="xs" fontWeight="semibold" color={subtitleColor}><LuLayers size={13} /><span>Kategoriya</span></HStack>
                                <FormControl as="select" value={filters.categoryId} onChange={setField('categoryId')} minH="44px" aria-label="Kategoriya bo‘yicha filtrlash">
                                    <option value="">Barcha kategoriyalar</option>
                                    {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                                </FormControl>
                            </Box>
                            <Box>
                                <HStack gap={1.5} mb={1.5} fontSize="xs" fontWeight="semibold" color={subtitleColor}><LuCalendarDays size={13} /><span>Sanadan</span></HStack>
                                <FormControl type="date" value={filters.dateFrom} max={filters.dateTo || undefined} onChange={setField('dateFrom')} minH="44px" aria-label="Boshlanish sanasi" />
                            </Box>
                            <Box>
                                <HStack gap={1.5} mb={1.5} fontSize="xs" fontWeight="semibold" color={subtitleColor}><LuCalendarDays size={13} /><span>Sanagacha</span></HStack>
                                <FormControl type="date" value={filters.dateTo} min={filters.dateFrom || undefined} onChange={setField('dateTo')} minH="44px" aria-label="Tugash sanasi" />
                            </Box>
                        </SimpleGrid>

                        <HStack justify="space-between" align="center" flexWrap="wrap" gap={3} mt={4}>
                            <HStack gap={1.5} flexWrap="wrap">
                                <Text fontSize="xs" color={subtitleColor} mr={1}>Tez tanlash:</Text>
                                {DATE_PRESETS.map((preset) => {
                                    const isActive = activePreset === preset.key;
                                    return (
                                        <Button
                                            key={preset.key} type="button" size="sm" h="30px" px={3.5} borderRadius="full" fontSize="xs" fontWeight="semibold"
                                            onClick={() => applyPreset(preset)}
                                            bg={isActive ? accentColor : 'transparent'} color={isActive ? 'black' : subtitleColor}
                                            borderWidth="1px" borderColor={isActive ? accentColor : cardBorder}
                                            _hover={{ bg: isActive ? accentColor : (isDark ? 'whiteAlpha.100' : 'gray.50') }}
                                        >
                                            {preset.label}
                                        </Button>
                                    );
                                })}
                            </HStack>
                            <HStack gap={2}>
                                {(hasPending || hasApplied) && (
                                    <Button type="button" variant="ghost" color={subtitleColor} borderRadius="xl" h="42px" px={4} onClick={clearFilters}>
                                        <HStack gap={2}><LuX size={16} /><span>Tozalash</span></HStack>
                                    </Button>
                                )}
                                <Button type="submit" bg={accentColor} color="black" borderRadius="xl" h="42px" px={6} fontWeight="semibold" _hover={{ bg: 'rgb(var(--accent-500))' }} position="relative">
                                    <HStack gap={2}><LuSearch size={16} /><span>Qo‘llash</span></HStack>
                                    {hasPending && <Box position="absolute" top="-3px" right="-3px" w="10px" h="10px" borderRadius="full" bg="red.500" borderWidth="2px" borderColor={cardBg} />}
                                </Button>
                            </HStack>
                        </HStack>
                    </Box>
                )}
            </Box>

            {/* ── Faol filtrlar ── */}
            {hasApplied && (
                <HStack gap={2} mb={4} flexWrap="wrap" fontSize="sm" color={subtitleColor}>
                    <Text>Filtr:</Text>
                    {selectedCashbox && <FilterChip icon={LuWallet} onRemove={() => removeApplied('cashboxId')}>{selectedCashbox.name}</FilterChip>}
                    {selectedCategory && <FilterChip icon={LuLayers} onRemove={() => removeApplied('categoryId')}>{selectedCategory.name}</FilterChip>}
                    {(applied.dateFrom || applied.dateTo) && (
                        <FilterChip icon={LuCalendarDays} onRemove={() => removeApplied('date')}>
                            {applied.dateFrom ? formatDate(applied.dateFrom) : '…'} — {applied.dateTo ? formatDate(applied.dateTo) : '…'}
                        </FilterChip>
                    )}
                    {sort !== DEFAULT_SORT && <FilterChip icon={LuArrowDownWideNarrow} onRemove={() => { setSort(DEFAULT_SORT); setPage(0); }}>{sortLabel(sort)}</FilterChip>}
                    <Text>· {formatNumber(totalElements)} ta natija</Text>
                </HStack>
            )}

            {/* ── Jadval ── */}
            {(isLoading || (isFetching && expenses.length === 0)) ? (
                <Loading />
            ) : error ? (
                <Box p={8} textAlign="center" color={dangerColor}>Ma&apos;lumotlarni yuklashda xatolik</Box>
            ) : expenses.length === 0 ? (
                <EmptyData
                    text={hasApplied ? 'Filtr bo‘yicha xarajat topilmadi' : 'Hozircha xarajatlar yo‘q'}
                    description={hasApplied ? 'Boshqa kassa, kategoriya yoki sana oralig‘ini tanlab ko‘ring.' : 'Yangi xarajat qo‘shib boshlang.'}
                    action={hasApplied
                        ? <Button variant="outline" borderRadius="xl" h="42px" px={4} onClick={clearFilters}><HStack gap={2}><LuX size={16} /><span>Filtrlarni tozalash</span></HStack></Button>
                        : canManage ? <Create cashboxes={cashboxes} /> : undefined}
                />
            ) : (
                <>
                    <Box overflowX="auto" bg={tableBg} borderWidth="1px" borderColor={tableBorder} borderRadius="2xl" opacity={isFetching ? 0.6 : 1} transition="opacity .15s" boxShadow={isDark ? '0 16px 40px rgba(0, 0, 0, 0.22)' : '0 8px 24px rgba(15, 23, 42, 0.08)'}>
                        <Table.Root size="md" bg={tableBg} borderCollapse="collapse" minW="960px">
                            <Table.Header bg={tableHeaderBg}>
                                <Table.Row bg={tableHeaderBg}>
                                    <Table.ColumnHeader {...headerCell} textAlign="center" w="48px">№</Table.ColumnHeader>
                                    <SortableHeader {...headerCell} minW="260px" column="name" label="Xarajat" sort={sort} onSort={handleColumnSort} />
                                    <SortableHeader {...headerCell} column="category" label="Kategoriya" sort={sort} onSort={handleColumnSort} />
                                    <SortableHeader {...headerCell} column="cashbox" label="Kassa" sort={sort} onSort={handleColumnSort} />
                                    <SortableHeader {...headerCell} column="date" label="Sana" sort={sort} onSort={handleColumnSort} />
                                    <SortableHeader {...headerCell} textAlign="right" column="amount" label="Summa" sort={sort} onSort={handleColumnSort} align="right" />
                                    <Table.ColumnHeader {...headerCell} textAlign="center" w="130px">Amallar</Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body bg={tableBg}>
                                {expenses.map((expense, index) => (
                                    <Table.Row key={expense.id} bg={tableBg} _hover={{ bg: isDark ? 'rgb(var(--accent-400) / 0.06)' : 'rgb(var(--accent-warm-50))' }}>
                                        <Table.Cell {...cellBorder} textAlign="center" color={subtitleColor} fontSize="sm">{index + 1}</Table.Cell>
                                        <Table.Cell {...cellBorder}>
                                            <HStack gap={3}>
                                                <Box p={2} borderRadius="lg" bg={accentSoft} color={accentColor} flexShrink={0}><LuReceiptText size={16} /></Box>
                                                <Box minW={0}>
                                                    <Text as={Link} to={`${base}/expenses/${expense.id}`} fontWeight="semibold" color={textColor} _hover={{ color: accentColor }} display="block" noOfLines={1}>{expense.name}</Text>
                                                    <Text fontSize="xs" color={subtitleColor} noOfLines={1}>{expense.summary || 'Izoh yo‘q'}</Text>
                                                </Box>
                                            </HStack>
                                        </Table.Cell>
                                        <Table.Cell {...cellBorder}>
                                            {expense.categoryName
                                                ? <Badge borderRadius="full" px={2.5} py={1} fontSize="11px" fontWeight="semibold" bg={isDark ? 'rgba(139,92,246,.14)' : '#EDE9FE'} color={isDark ? '#C4B5FD' : '#6D28D9'} whiteSpace="nowrap">{expense.categoryName}</Badge>
                                                : <Text color={subtitleColor} fontSize="sm">—</Text>}
                                        </Table.Cell>
                                        <Table.Cell {...cellBorder} color={textColor} fontSize="sm" whiteSpace="nowrap">
                                            <HStack gap={1.5}><LuWallet size={13} color={subtitleColor} /><span>{expense.cashboxName || '—'}</span></HStack>
                                        </Table.Cell>
                                        <Table.Cell {...cellBorder} whiteSpace="nowrap">
                                            <Text color={textColor} fontSize="sm" fontWeight="medium">{formatDate(expense.expenseDate)}</Text>
                                            {formatTime(expense.createdAt) && (
                                                <HStack gap={1} color={subtitleColor} fontSize="xs" title={`Kiritilgan: ${formatDateTime(expense.createdAt)}`}>
                                                    <LuClock3 size={11} /><span>{formatTime(expense.createdAt)}</span>
                                                </HStack>
                                            )}
                                        </Table.Cell>
                                        <Table.Cell {...cellBorder} textAlign="right" whiteSpace="nowrap">
                                            <Text fontWeight="bold" color={dangerColor}>-{formatNumber(expense.amount)} so‘m</Text>
                                            <CurrencyNote currency={expense.currency} usdRate={expense.usdRate} amount={expense.amount} />
                                        </Table.Cell>
                                        <Table.Cell {...cellBorder}>
                                            <HStack justify="center" gap={1}>
                                                <Button asChild size="sm" variant="ghost" w="34px" h="34px" p={0} minW={0} borderRadius="lg" color={subtitleColor} aria-label="Batafsil" _hover={{ bg: isDark ? 'whiteAlpha.100' : 'gray.100', color: textColor }}>
                                                    <Link to={`${base}/expenses/${expense.id}`}><LuExternalLink size={15} /></Link>
                                                </Button>
                                                {canManage && <Edit expense={expense} />}
                                                {canManage && <Delete expense={expense} />}
                                            </HStack>
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table.Root>
                    </Box>

                    <HStack justify="space-between" mt={4} flexWrap="wrap" gap={3}>
                        <HStack gap={4} flexWrap="wrap" fontSize="sm" color={subtitleColor}>
                            <Text>Jami: <Text as="span" fontWeight="bold" color={textColor}>{formatNumber(totalElements)}</Text> ta xarajat</Text>
                            <Text>Shu sahifa: <Text as="span" fontWeight="bold" color={dangerColor}>-{formatNumber(pageSum)} so‘m</Text></Text>
                        </HStack>
                        <InfiniteSentinel sentinelRef={sentinelRef} hasMore={hasMore} loadingMore={loadingMore} loaded={expenses.length} total={result?.pagination?.totalElements ?? expenses.length} unit="ta xarajat" onLoadMore={loadMore} />
                    </HStack>
                </>
            )}
        </Box>
    );
}
