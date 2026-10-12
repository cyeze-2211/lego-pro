import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useParams, useLocation, useNavigate, Link as RouterLink } from 'react-router-dom';
import { Badge, Box, Button, HStack, Heading, SimpleGrid, Spinner, Table, Text, VStack } from '@chakra-ui/react';
import {
    LuArrowDownLeft, LuArrowLeft, LuArrowUpRight, LuCalendar, LuCalendarDays, LuChevronLeft, LuChevronRight,
    LuCircleAlert, LuClock3, LuExternalLink, LuFileText, LuHash, LuHistory, LuReceiptText, LuRotateCcw,
    LuScale, LuStickyNote, LuTruck, LuUndo2, LuUser, LuWallet, LuX,
} from 'react-icons/lu';
import { useGetCashboxByIdQuery, useGetCashboxTransactionsQuery } from '../../../store/services/cashbox.api';
import { ROLES } from '../../../app/permissions/roles';
import { useAppSelector } from '../../../store/hooks';
import { useAppTheme } from '../../../theme/tokens';
import { formatNumber } from '../../ui/number-format';
import { formatDate, formatDateTime, formatTime, todayIso } from '../../ui/date-format';
import Loading from '../../Other/UI/Loadings/Loading';
import Edit from '../Cashbox/__components/Edit';
import Delete from '../Cashbox/__components/Delete';

const PAGE_SIZE = 20;

/* ── Harakat turlari ───────────────────────────────────────────────────── */
const TYPE_META = {
    INCOME: { label: 'Mijoz to‘lovi', short: 'Kirim', isIncome: true, Icon: LuArrowDownLeft, tone: 'green' },
    EXPENSE: { label: 'Xarajat', short: 'Xarajat', isIncome: false, Icon: LuReceiptText, tone: 'red' },
    SUPPLIER_PAYMENT: { label: 'Ta’minotchiga to‘lov', short: 'Ta’minotchi', isIncome: false, Icon: LuTruck, tone: 'orange' },
    ORDER_RETURN: { label: 'Buyurtma qaytarish', short: 'Qaytarish', isIncome: false, Icon: LuUndo2, tone: 'violet' },
};

const getTypeMeta = (type) => TYPE_META[type] ?? { label: type || '—', short: type || '—', isIncome: false, Icon: LuFileText, tone: 'gray' };

const TYPE_FILTERS = [
    { value: '', label: 'Barchasi', Icon: LuHistory },
    { value: 'INCOME', label: 'Kirim', Icon: LuArrowDownLeft },
    { value: 'EXPENSE', label: 'Xarajat', Icon: LuReceiptText },
    { value: 'SUPPLIER_PAYMENT', label: 'Ta’minotchiga to‘lov', Icon: LuTruck },
    { value: 'ORDER_RETURN', label: 'Qaytarish', Icon: LuUndo2 },
];

const TONES = (isDark) => ({
    green: { bg: isDark ? 'rgba(34,197,94,.14)' : '#DCFCE7', color: isDark ? '#86EFAC' : '#15803D', border: isDark ? 'rgba(34,197,94,.35)' : '#BBF7D0' },
    red: { bg: isDark ? 'rgba(239,68,68,.14)' : '#FEE2E2', color: isDark ? '#FCA5A5' : '#B91C1C', border: isDark ? 'rgba(239,68,68,.35)' : '#FECACA' },
    orange: { bg: isDark ? 'rgba(249,115,22,.14)' : '#FFEDD5', color: isDark ? '#FDBA74' : '#C2410C', border: isDark ? 'rgba(249,115,22,.35)' : '#FED7AA' },
    violet: { bg: isDark ? 'rgba(139,92,246,.14)' : '#EDE9FE', color: isDark ? '#C4B5FD' : '#6D28D9', border: isDark ? 'rgba(139,92,246,.35)' : '#DDD6FE' },
    amber: { bg: isDark ? 'rgba(250,204,21,.14)' : '#FEF3C7', color: isDark ? '#FDE68A' : '#92400E', border: isDark ? 'rgba(250,204,21,.35)' : '#FDE68A' },
    sky: { bg: isDark ? 'rgba(14,165,233,.12)' : '#E0F2FE', color: isDark ? '#7DD3FC' : '#0284C7', border: isDark ? 'rgba(14,165,233,.3)' : '#BAE6FD' },
    gray: { bg: isDark ? 'rgba(148,163,184,.12)' : '#F1F5F9', color: isDark ? '#E2E8F0' : '#334155', border: isDark ? 'rgba(148,163,184,.3)' : '#E2E8F0' },
});

/* ── Sana oraliqlari ───────────────────────────────────────────────────── */
const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const DATE_PRESETS = [
    { key: 'today', label: 'Bugun', range: () => [todayIso(), todayIso()] },
    { key: 'week', label: 'Shu hafta', range: () => { const d = new Date(); const from = new Date(d); from.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return [iso(from), iso(d)]; } },
    { key: 'month', label: 'Shu oy', range: () => { const d = new Date(); return [iso(new Date(d.getFullYear(), d.getMonth(), 1)), iso(d)]; } },
    { key: 'prevMonth', label: 'O‘tgan oy', range: () => { const d = new Date(); return [iso(new Date(d.getFullYear(), d.getMonth() - 1, 1)), iso(new Date(d.getFullYear(), d.getMonth(), 0))]; } },
];

/* ── Kichik UI bloklari ────────────────────────────────────────────────── */
function Card({ children, ...props }) {
    const { isDark, cardBg, cardBorder } = useAppTheme();
    return (
        <Box bg={cardBg} borderWidth="1px" borderColor={cardBorder} borderRadius="2xl" overflow="hidden" boxShadow={isDark ? '0 12px 30px rgba(0,0,0,.16)' : '0 8px 22px rgba(15,23,42,.06)'} {...props}>
            {children}
        </Box>
    );
}
Card.propTypes = { children: PropTypes.node };

function Pill({ tone = 'gray', icon: Icon, children, ...props }) {
    const { isDark } = useAppTheme();
    const t = TONES(isDark)[tone];
    return (
        <Badge borderRadius="full" px={2.5} py={1} fontSize="11px" fontWeight="semibold" bg={t.bg} color={t.color} borderWidth="1px" borderColor={t.border} whiteSpace="nowrap" {...props}>
            <HStack gap={1.5} display="inline-flex">{Icon && <Icon size={12} />}<span>{children}</span></HStack>
        </Badge>
    );
}
Pill.propTypes = { tone: PropTypes.string, icon: PropTypes.elementType, children: PropTypes.node };

function StatCard({ icon: Icon, label, value, sub, tone = 'gray', valueTone = false }) {
    const { isDark, textColor, subtitleColor } = useAppTheme();
    const t = TONES(isDark)[tone];
    return (
        <Card p={{ base: 4, md: 5 }} minW={0}>
            <HStack gap={3} align="start">
                <Box p={2.5} borderRadius="xl" bg={t.bg} color={t.color} flexShrink={0}><Icon size={20} /></Box>
                <Box minW={0} flex={1}>
                    <Text fontSize="xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider" color={subtitleColor}>{label}</Text>
                    <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight="bold" color={valueTone ? t.color : textColor} lineHeight="1.2" mt={1} truncate>{value}</Text>
                    {sub && <Text fontSize="sm" color={subtitleColor} mt={1}>{sub}</Text>}
                </Box>
            </HStack>
        </Card>
    );
}
StatCard.propTypes = { icon: PropTypes.elementType.isRequired, label: PropTypes.string.isRequired, value: PropTypes.node.isRequired, sub: PropTypes.node, tone: PropTypes.string, valueTone: PropTypes.bool };

function InfoRow({ icon: Icon, label, value, mono = false, emptyText = 'Ko‘rsatilmagan' }) {
    const { textColor, subtitleColor } = useAppTheme();
    const empty = value === null || value === undefined || value === '';
    return (
        <HStack gap={3} px={{ base: 4, md: 5 }} py={3} align="start">
            <Box color={subtitleColor} mt="2px" flexShrink={0}><Icon size={15} /></Box>
            <Box minW={0} flex={1}>
                <Text fontSize="xs" color={subtitleColor} fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">{label}</Text>
                {empty
                    ? <Text color={subtitleColor} fontSize="sm" mt={0.5}>{emptyText}</Text>
                    : <Text color={textColor} fontWeight="medium" fontSize="sm" mt={0.5} fontFamily={mono ? 'mono' : undefined} whiteSpace="pre-wrap" wordBreak="break-word">{value}</Text>}
            </Box>
        </HStack>
    );
}
InfoRow.propTypes = { icon: PropTypes.elementType.isRequired, label: PropTypes.string.isRequired, value: PropTypes.node, mono: PropTypes.bool, emptyText: PropTypes.string };

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
export default function CashboxDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { pathname } = useLocation();

    const isKassir = pathname.startsWith('/kassir');
    const isZayavkachi = pathname.startsWith('/zayavkachi');
    const base = isKassir ? '/kassir' : isZayavkachi ? '/zayavkachi' : '';
    const backTo = `${base}/cashboxes`;
    const role = useAppSelector((state) => state.auth.role);
    const canManage = !isZayavkachi && role !== ROLES.XIMIK;
    const customerPath = (cid) => (isZayavkachi || isKassir ? `${base}/customers/${cid}` : `/customers/${cid}`);
    const supplierPath = (sid) => (isZayavkachi ? null : `${base}/suppliers/${sid}`);
    const expensePath = (eid) => (isZayavkachi ? null : `${base}/expenses/${eid}`);

    const { data: cashbox, isLoading, isError } = useGetCashboxByIdQuery(id, { skip: !id });

    const [page, setPage] = useState(0);
    const [typeFilter, setTypeFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const { data: txnData, isLoading: txnLoading, isFetching: txnFetching } = useGetCashboxTransactionsQuery(
        { id, type: typeFilter || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, page, size: PAGE_SIZE },
        { skip: !id },
    );
    const { data: latestData } = useGetCashboxTransactionsQuery({ id, page: 0, size: 1 }, { skip: !id });

    const { isDark, pageBg, cardBg, cardBorder, textColor, subtitleColor, accentColor, cardShadow, inputBg, inputBorder } = useAppTheme();
    const tones = TONES(isDark);

    const transactions = useMemo(() => txnData?.items ?? [], [txnData]);
    const pagination = txnData?.pagination ?? {};
    const totalPages = pagination.totalPages ?? 0;
    const totalElements = pagination.totalElements ?? 0;
    const allCount = latestData?.pagination?.totalElements ?? 0;
    const lastTx = latestData?.items?.[0] ?? null;

    const pageTotals = useMemo(() => transactions.reduce((acc, tx) => {
        const amount = Number(tx.amount) || 0;
        if (getTypeMeta(tx.type).isIncome) acc.income += amount; else acc.outcome += amount;
        return acc;
    }, { income: 0, outcome: 0 }), [transactions]);

    const hasFilter = Boolean(typeFilter || dateFrom || dateTo);
    const activePreset = DATE_PRESETS.find((p) => { const [f, t] = p.range(); return dateFrom === f && dateTo === t; })?.key;

    const resetFilters = () => { setTypeFilter(''); setDateFrom(''); setDateTo(''); setPage(0); };
    const applyPreset = (preset) => { const [f, t] = preset.range(); setDateFrom(f); setDateTo(t); setPage(0); };

    if (isLoading) {
        return <Box minH="60vh" display="flex" alignItems="center" justifyContent="center"><Loading /></Box>;
    }
    if (isError || !cashbox) {
        return (
            <Box minH="60vh" display="flex" flexDirection="column" alignItems="center" justifyContent="center" gap={4} color={isDark ? 'red.300' : 'red.600'}>
                <LuCircleAlert size={34} />
                <Text fontSize="lg">Kassa ma&apos;lumotini yuklashda xatolik</Text>
                <Button variant="outline" borderRadius="xl" h="42px" px={4} onClick={() => navigate(backTo)}><HStack gap={2}><LuArrowLeft size={16} /><span>Kassalar ro‘yxatiga qaytish</span></HStack></Button>
            </Box>
        );
    }

    const balance = Number(cashbox.balance) || 0;
    const balanceTone = balance < 0 ? 'red' : balance > 0 ? 'green' : 'gray';
    const balanceLabel = balance < 0 ? 'Qoldiq manfiy' : balance > 0 ? 'Qoldiq musbat' : 'Qoldiq nol';
    const accentSoft = isDark ? 'rgb(var(--accent-400) / .12)' : 'rgb(var(--accent-warm-100))';
    const inputCx = { h: '42px', px: 3, borderRadius: 'xl', borderWidth: '1px', borderColor: inputBorder, bg: inputBg, color: textColor, fontSize: 'sm', outline: 'none', _focus: { borderColor: accentColor, boxShadow: `0 0 0 3px ${accentColor}44` } };
    const th = { color: subtitleColor, fontSize: '11px', fontWeight: 'semibold', textTransform: 'uppercase', letterSpacing: 'wider', whiteSpace: 'nowrap', bg: isDark ? 'rgba(148,163,184,0.06)' : '#F8FAFC' };

    return (
        <Box bg={pageBg} color={textColor} minH="100%" w="100%">
            {/* ── Sarlavha ── */}
            <Box overflow="hidden" borderWidth="1px" borderColor={cardBorder} borderRadius="2xl" boxShadow={cardShadow} mb={4}>
                <Box h="5px" bg={`linear-gradient(90deg, ${accentColor}, rgb(var(--accent-warm-200)))`} />
                <Box bg={cardBg} p={{ base: 4, md: 6 }}>
                    <HStack justify="space-between" align="start" flexWrap="wrap" gap={4}>
                        <HStack gap={4} minW={0} align="start">
                            <Box p={3.5} borderRadius="xl" bg={accentSoft} color={accentColor} flexShrink={0}><LuWallet size={28} /></Box>
                            <Box minW={0}>
                                <HStack gap={2} flexWrap="wrap" mb={1}>
                                    <Text fontSize="xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider" color={subtitleColor}>Kassa</Text>
                                    <Pill tone={balanceTone}>{balanceLabel}</Pill>
                                </HStack>
                                <Heading size={{ base: 'lg', md: 'xl' }} color={textColor} lineHeight="1.15" wordBreak="break-word">{cashbox.name}</Heading>
                                <HStack gap={4} mt={2} flexWrap="wrap" color={subtitleColor} fontSize="sm">
                                    {cashbox.summary && <HStack gap={1.5} minW={0}><LuStickyNote size={14} /><Text noOfLines={1}>{cashbox.summary}</Text></HStack>}
                                    <HStack gap={1.5}><LuCalendar size={14} /><span>Ochilgan: {formatDate(cashbox.createdAt)}</span></HStack>
                                </HStack>
                            </Box>
                        </HStack>
                        <HStack gap={2} flexWrap="wrap" flexShrink={0}>
                            <Button variant="outline" borderRadius="xl" h="42px" px={4} onClick={() => navigate(backTo)}><HStack gap={2}><LuArrowLeft size={16} /><span>Ro‘yxatga</span></HStack></Button>
                            {canManage && <Edit cashbox={cashbox} label="Tahrirlash" />}
                            {canManage && <Delete cashbox={cashbox} label="O‘chirish" onDeleted={() => navigate(backTo)} />}
                        </HStack>
                    </HStack>
                </Box>
            </Box>

            {/* ── Ko‘rsatkichlar ── */}
            <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} gap={4} mb={4}>
                <StatCard icon={LuScale} label="Joriy qoldiq" value={`${balance < 0 ? '-' : ''}${formatNumber(Math.abs(balance))} so‘m`} sub={balanceLabel} tone={balanceTone} valueTone />
                <StatCard icon={LuHistory} label="Harakatlar" value={`${formatNumber(allCount)} ta`} sub="Barcha kirim-chiqimlar soni" tone="sky" />
                <StatCard
                    icon={lastTx ? getTypeMeta(lastTx.type).Icon : LuClock3}
                    label="Oxirgi harakat"
                    value={lastTx ? `${getTypeMeta(lastTx.type).isIncome ? '+' : '-'}${formatNumber(lastTx.amount)} so‘m` : '—'}
                    sub={lastTx ? `${formatDate(lastTx.operationDate)} · ${getTypeMeta(lastTx.type).label}` : 'Hali harakat yo‘q'}
                    tone={lastTx ? getTypeMeta(lastTx.type).tone : 'gray'}
                    valueTone={Boolean(lastTx)}
                />
                <StatCard icon={LuCalendarDays} label="Oxirgi o‘zgarish" value={cashbox.lastModifiedAt ? formatDate(cashbox.lastModifiedAt) : 'O‘zgartirilmagan'} sub={cashbox.lastModifiedAt ? formatTime(cashbox.lastModifiedAt) : `Yaratilgan: ${formatDateTime(cashbox.createdAt)}`} tone="amber" />
            </SimpleGrid>

            {/* ── Kirim-chiqim tarixi ── */}
            <Card mb={4}>
                <HStack justify="space-between" align="center" flexWrap="wrap" gap={3} px={{ base: 4, md: 5 }} py={3.5} borderBottomWidth="1px" borderColor={cardBorder}>
                    <HStack gap={2}>
                        <LuHistory size={17} color={accentColor} />
                        <Heading size="sm" color={textColor}>Kirim-chiqim tarixi</Heading>
                        <Badge borderRadius="full" px={2} fontSize="11px" bg={accentSoft} color={accentColor}>{formatNumber(totalElements)}</Badge>
                    </HStack>
                    {hasFilter && (
                        <Button variant="ghost" size="sm" h="32px" px={3} borderRadius="xl" color={subtitleColor} onClick={resetFilters} _hover={{ color: accentColor }}>
                            <HStack gap={1.5}><LuRotateCcw size={13} /><span>Tozalash</span></HStack>
                        </Button>
                    )}
                </HStack>

                {/* Filtrlar */}
                <Box px={{ base: 4, md: 5 }} py={4} borderBottomWidth="1px" borderColor={cardBorder} bg={isDark ? 'rgba(255,255,255,.02)' : '#FAFAFA'}>
                    <VStack align="stretch" gap={3}>
                        <HStack gap={1.5} flexWrap="wrap">
                            {TYPE_FILTERS.map(({ value, label, Icon }) => {
                                const isActive = typeFilter === value;
                                return (
                                    <Button
                                        key={value || 'all'} size="sm" h="34px" px={3.5} borderRadius="full" fontSize="xs" fontWeight="semibold"
                                        onClick={() => { setTypeFilter(value); setPage(0); }}
                                        bg={isActive ? accentColor : 'transparent'} color={isActive ? 'black' : subtitleColor}
                                        borderWidth="1px" borderColor={isActive ? accentColor : cardBorder}
                                        _hover={{ bg: isActive ? accentColor : (isDark ? 'whiteAlpha.100' : 'gray.100') }}
                                    >
                                        <HStack gap={1.5}><Icon size={13} /><span>{label}</span></HStack>
                                    </Button>
                                );
                            })}
                        </HStack>
                        <HStack gap={3} flexWrap="wrap" align="end">
                            <Box>
                                <Text fontSize="xs" fontWeight="semibold" color={subtitleColor} mb={1}>Sanadan</Text>
                                <Box as="input" type="date" value={dateFrom} max={dateTo || undefined} onChange={(e) => { setDateFrom(e.target.value); setPage(0); }} aria-label="Boshlanish sanasi" {...inputCx} />
                            </Box>
                            <Box>
                                <Text fontSize="xs" fontWeight="semibold" color={subtitleColor} mb={1}>Sanagacha</Text>
                                <Box as="input" type="date" value={dateTo} min={dateFrom || undefined} onChange={(e) => { setDateTo(e.target.value); setPage(0); }} aria-label="Tugash sanasi" {...inputCx} />
                            </Box>
                            <HStack gap={1.5} flexWrap="wrap" pb="1px">
                                {DATE_PRESETS.map((preset) => {
                                    const isActive = activePreset === preset.key;
                                    return (
                                        <Button
                                            key={preset.key} size="sm" h="34px" px={3} borderRadius="lg" fontSize="xs" fontWeight="semibold"
                                            onClick={() => applyPreset(preset)}
                                            bg={isActive ? accentSoft : 'transparent'} color={isActive ? accentColor : subtitleColor}
                                            borderWidth="1px" borderColor={isActive ? accentColor : cardBorder}
                                            _hover={{ bg: accentSoft, color: accentColor }}
                                        >
                                            {preset.label}
                                        </Button>
                                    );
                                })}
                            </HStack>
                        </HStack>
                        {hasFilter && (
                            <HStack gap={2} flexWrap="wrap" fontSize="sm" color={subtitleColor}>
                                <Text>Filtr:</Text>
                                {typeFilter && <FilterChip icon={getTypeMeta(typeFilter).Icon} onRemove={() => { setTypeFilter(''); setPage(0); }}>{getTypeMeta(typeFilter).label}</FilterChip>}
                                {(dateFrom || dateTo) && <FilterChip icon={LuCalendarDays} onRemove={() => { setDateFrom(''); setDateTo(''); setPage(0); }}>{dateFrom ? formatDate(dateFrom) : '…'} — {dateTo ? formatDate(dateTo) : '…'}</FilterChip>}
                                <Text>· {formatNumber(totalElements)} ta natija</Text>
                            </HStack>
                        )}
                    </VStack>
                </Box>

                {/* Jadval */}
                <Box p={{ base: 3, md: 5 }}>
                    {txnLoading ? (
                        <VStack py={12} gap={3}><Spinner size="md" color={accentColor} /><Text color={subtitleColor} fontSize="sm">Yuklanmoqda...</Text></VStack>
                    ) : transactions.length === 0 ? (
                        <VStack py={12} gap={3}>
                            <Box p={4} borderRadius="2xl" bg={isDark ? 'rgba(148,163,184,0.06)' : 'gray.50'} color={subtitleColor}><LuHistory size={28} /></Box>
                            <Text fontWeight="semibold" color={textColor}>{hasFilter ? 'Filtr bo‘yicha harakat topilmadi' : 'Hozircha harakat yo‘q'}</Text>
                            <Text fontSize="sm" color={subtitleColor} textAlign="center">{hasFilter ? 'Boshqa tur yoki sana oralig‘ini tanlab ko‘ring.' : 'Kirim yoki chiqim bo‘lganda bu yerda ko‘rinadi.'}</Text>
                            {hasFilter && <Button variant="outline" borderRadius="xl" h="40px" px={4} onClick={resetFilters}><HStack gap={2}><LuX size={15} /><span>Filtrlarni tozalash</span></HStack></Button>}
                        </VStack>
                    ) : (
                        <>
                            <Box overflowX="auto" borderWidth="1px" borderColor={cardBorder} borderRadius="xl" opacity={txnFetching ? 0.6 : 1} transition="opacity .15s">
                                <Table.Root size="sm" bg={isDark ? 'transparent' : 'white'} minW="960px">
                                    <Table.Header>
                                        <Table.Row>
                                            <Table.ColumnHeader {...th} w="44px" textAlign="center">№</Table.ColumnHeader>
                                            <Table.ColumnHeader {...th}>Sana</Table.ColumnHeader>
                                            <Table.ColumnHeader {...th}>Tur</Table.ColumnHeader>
                                            <Table.ColumnHeader {...th}>Kim / Nima</Table.ColumnHeader>
                                            <Table.ColumnHeader {...th}>Izoh</Table.ColumnHeader>
                                            <Table.ColumnHeader {...th} textAlign="right">Summa</Table.ColumnHeader>
                                            <Table.ColumnHeader {...th} textAlign="center" w="64px">Ochish</Table.ColumnHeader>
                                        </Table.Row>
                                    </Table.Header>
                                    <Table.Body>
                                        {transactions.map((tx, idx) => {
                                            const meta = getTypeMeta(tx.type);
                                            const t = tones[meta.tone];
                                            const amountColor = meta.isIncome ? tones.green.color : tones.red.color;
                                            let who = { Icon: LuFileText, title: tx.name || '—', sub: '' , to: null };
                                            if (tx.type === 'INCOME' || tx.type === 'ORDER_RETURN') {
                                                who = { Icon: LuUser, title: tx.customerName || '—', sub: 'Mijoz', to: tx.customerId ? customerPath(tx.customerId) : null };
                                            } else if (tx.type === 'SUPPLIER_PAYMENT') {
                                                who = { Icon: LuTruck, title: tx.supplierName || '—', sub: 'Ta’minotchi', to: tx.supplierId ? supplierPath(tx.supplierId) : null };
                                            } else if (tx.type === 'EXPENSE') {
                                                who = { Icon: LuReceiptText, title: tx.name || '—', sub: 'Xarajat', to: expensePath(tx.id) };
                                            }
                                            return (
                                                <Table.Row key={`${tx.type}-${tx.id}`} _hover={{ bg: isDark ? 'rgb(var(--accent-400) / .04)' : 'rgb(var(--accent-warm-50))' }}>
                                                    <Table.Cell color={subtitleColor} textAlign="center" fontSize="sm">{page * PAGE_SIZE + idx + 1}</Table.Cell>
                                                    <Table.Cell whiteSpace="nowrap">
                                                        <Text color={textColor} fontSize="sm" fontWeight="medium">{formatDate(tx.operationDate)}</Text>
                                                        <HStack gap={1} color={subtitleColor} fontSize="xs" title={`Kiritilgan: ${formatDateTime(tx.createdAt)}`}><LuClock3 size={11} /><span>{formatTime(tx.createdAt)}</span></HStack>
                                                    </Table.Cell>
                                                    <Table.Cell><Pill tone={meta.tone} icon={meta.Icon} title={meta.label}>{meta.short}</Pill></Table.Cell>
                                                    <Table.Cell maxW="260px">
                                                        <HStack gap={2} minW={0}>
                                                            <Box p={1.5} borderRadius="md" bg={t.bg} color={t.color} flexShrink={0}><who.Icon size={13} /></Box>
                                                            <Box minW={0}>
                                                                {who.to
                                                                    ? <Text as={RouterLink} to={who.to} fontSize="sm" fontWeight="semibold" color={textColor} display="block" noOfLines={1} _hover={{ color: accentColor }}>{who.title}</Text>
                                                                    : <Text fontSize="sm" fontWeight="semibold" color={textColor} noOfLines={1}>{who.title}</Text>}
                                                                {who.sub && <Text fontSize="10px" color={subtitleColor} fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">{who.sub}</Text>}
                                                            </Box>
                                                        </HStack>
                                                    </Table.Cell>
                                                    <Table.Cell color={subtitleColor} fontSize="sm" maxW="240px"><Text noOfLines={2}>{tx.summary || '—'}</Text></Table.Cell>
                                                    <Table.Cell textAlign="right" whiteSpace="nowrap">
                                                        <HStack justify="flex-end" gap={1} color={amountColor}>
                                                            {meta.isIncome ? <LuArrowDownLeft size={13} /> : <LuArrowUpRight size={13} />}
                                                            <Text fontWeight="bold" fontSize="sm">{meta.isIncome ? '+' : '-'}{formatNumber(tx.amount)} so‘m</Text>
                                                        </HStack>
                                                    </Table.Cell>
                                                    <Table.Cell textAlign="center">
                                                        {who.to ? (
                                                            <Button asChild size="xs" w="30px" h="30px" p={0} minW={0} borderRadius="lg" variant="outline" color={subtitleColor} aria-label="Ochish" title="Ochish">
                                                                <RouterLink to={who.to}><LuExternalLink size={14} /></RouterLink>
                                                            </Button>
                                                        ) : <Text fontSize="xs" color={subtitleColor}>—</Text>}
                                                    </Table.Cell>
                                                </Table.Row>
                                            );
                                        })}
                                    </Table.Body>
                                </Table.Root>
                            </Box>

                            <HStack justify="space-between" mt={4} flexWrap="wrap" gap={3}>
                                <HStack gap={4} flexWrap="wrap" fontSize="sm" color={subtitleColor}>
                                    <Text>Jami: <Text as="span" fontWeight="bold" color={textColor}>{formatNumber(totalElements)}</Text> ta harakat</Text>
                                    <Text>Shu sahifa kirim: <Text as="span" fontWeight="bold" color={tones.green.color}>+{formatNumber(pageTotals.income)}</Text></Text>
                                    <Text>chiqim: <Text as="span" fontWeight="bold" color={tones.red.color}>-{formatNumber(pageTotals.outcome)}</Text></Text>
                                </HStack>
                                {totalPages > 1 && (
                                    <HStack gap={2}>
                                        <Button size="sm" variant="outline" borderRadius="lg" w="34px" h="34px" p={0} minW={0} disabled={page === 0} onClick={() => setPage((p) => p - 1)} aria-label="Oldingi sahifa"><LuChevronLeft size={14} /></Button>
                                        <Text color={subtitleColor} fontSize="sm" fontWeight="medium" px={2}>{page + 1} / {totalPages}</Text>
                                        <Button size="sm" variant="outline" borderRadius="lg" w="34px" h="34px" p={0} minW={0} disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} aria-label="Keyingi sahifa"><LuChevronRight size={14} /></Button>
                                    </HStack>
                                )}
                            </HStack>
                        </>
                    )}
                </Box>
            </Card>

            {/* ── Kassa ma'lumotlari ── */}
            <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4}>
                <Card>
                    <HStack gap={2} px={{ base: 4, md: 5 }} py={3.5} borderBottomWidth="1px" borderColor={cardBorder}><LuWallet size={17} color={accentColor} /><Heading size="sm" color={textColor}>Kassa ma’lumotlari</Heading></HStack>
                    <VStack align="stretch" gap={0} css={{ '& > * + *': { borderTopWidth: '1px', borderTopColor: cardBorder } }}>
                        <InfoRow icon={LuWallet} label="Nomi" value={cashbox.name} />
                        <InfoRow icon={LuStickyNote} label="Izoh" value={cashbox.summary} emptyText="Izoh yo‘q" />
                        <InfoRow icon={LuScale} label="Joriy qoldiq" value={`${formatNumber(balance)} so‘m`} />
                    </VStack>
                </Card>
                <Card>
                    <HStack gap={2} px={{ base: 4, md: 5 }} py={3.5} borderBottomWidth="1px" borderColor={cardBorder}><LuClock3 size={17} color={accentColor} /><Heading size="sm" color={textColor}>Tizim ma’lumotlari</Heading></HStack>
                    <VStack align="stretch" gap={0} css={{ '& > * + *': { borderTopWidth: '1px', borderTopColor: cardBorder } }}>
                        <InfoRow icon={LuCalendar} label="Yaratilgan" value={formatDateTime(cashbox.createdAt)} />
                        <InfoRow icon={LuClock3} label="Oxirgi o‘zgarish" value={cashbox.lastModifiedAt ? formatDateTime(cashbox.lastModifiedAt) : null} emptyText="O‘zgartirilmagan" />
                        <InfoRow icon={LuHash} label="Tizim ID" value={cashbox.id} mono />
                    </VStack>
                </Card>
            </SimpleGrid>
        </Box>
    );
}
