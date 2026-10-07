import { useEffect, useState } from 'react';
import {
    Badge,
    Box,
    Button,
    Dialog,
    Field,
    HStack,
    Heading,
    Portal,
    Spinner,
    Table,
    Text,
    VStack,
} from '@chakra-ui/react';
import {
    CalendarClock,
    Pencil,
    Plus,
    RotateCcw,
    Search,
    Trash2,
    X,
    AlertCircle,
    CheckCircle2,
} from 'lucide-react';
import {
    LuChevronLeft, LuChevronRight, LuClock3, LuStickyNote, LuUserRound,
    LuTriangleAlert, LuCalendarCheck, LuCalendarDays, LuFilter,
} from 'react-icons/lu';
import { ROLES } from '../../../app/permissions/roles';
import { useAppSelector } from '../../../store/hooks';
import { useGetCustomersQuery } from '../../../store/services/customer.api';
import { formatNumber } from '../../ui/number-format';
import {
    useCreatePaymentReminderMutation,
    useDeletePaymentReminderMutation,
    useGetPaymentRemindersQuery,
    useUpdatePaymentReminderMutation,
} from '../../../store/services/paymentReminder.api';
import { useAppTheme } from '../../../theme/tokens';
import { Alert } from '../../Other/UI/Alert/Alert';
import EmptyData from '../../Other/UI/NoData/EmptyData';
import Loading from '../../Other/UI/Loadings/Loading';
import FormControl from '../../ui/FormControl';

const PAGE_SIZE = 20;

const today = () => {
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
};

const formatDate = (value) => {
    if (!value) return '—';
    const [year, month, day] = value.split('-');
    return year && month && day ? `${day}.${month}.${year}` : value;
};

const dayDifference = (value) => {
    if (!value) return null;
    const now = new Date();
    const currentDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const [year, month, day] = value.split('-').map(Number);
    const targetDay = new Date(year, month - 1, day);
    return Math.round((targetDay - currentDay) / 86400000);
};

/** Status meta based on payment date */
const getStatusMeta = (paymentDate, isDark) => {
    const diff = dayDifference(paymentDate);
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

/* ── Small stat pill ── */
function StatPill({ label, value, tone, isDark }) {
    const palette = {
        danger:  { color: isDark ? '#fca5a5' : '#dc2626', bg: isDark ? 'rgba(239,68,68,.1)'   : '#FEF2F2', border: isDark ? 'rgba(239,68,68,.25)'   : '#FECACA' },
        warning: { color: isDark ? '#fde68a' : '#b45309', bg: isDark ? 'rgba(250,204,21,.12)' : '#FFFBEB', border: isDark ? 'rgba(250,204,21,.3)'  : '#FDE68A' },
        success: { color: isDark ? '#86efac' : '#15803d', bg: isDark ? 'rgba(34,197,94,.1)'   : '#F0FDF4', border: isDark ? 'rgba(34,197,94,.25)'  : '#BBF7D0' },
    }[tone] || {};
    return (
        <Box px={3} py={1.5} borderRadius="lg" bg={palette.bg} borderWidth="1px" borderColor={palette.border}>
            <HStack gap={2}>
                <Text fontSize="lg" fontWeight="bold" color={palette.color} lineHeight="1">{value}</Text>
                <Text fontSize="xs" fontWeight="semibold" color={palette.color} opacity={0.85}>{label}</Text>
            </HStack>
        </Box>
    );
}

export default function Reminder() {
    const [paymentDateFilter, setPaymentDateFilter] = useState(today);
    const [page, setPage] = useState(0);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingReminder, setEditingReminder] = useState(null);
    const [deletingReminder, setDeletingReminder] = useState(null);
    const [customerId, setCustomerId] = useState('');
    const [paymentDate, setPaymentDate] = useState(today);
    const [note, setNote] = useState('');
    const [price, setPrice] = useState('');

    const role = useAppSelector((state) => state.auth.role);
    const canManage = [ROLES.MANAGER, ROLES.BUXGALTER, ROLES.KASSIR].includes(role);

    const {
        data: reminderResult,
        isLoading,
        isFetching,
        error,
    } = useGetPaymentRemindersQuery({
        paymentDate: paymentDateFilter || undefined,
        page,
        size: PAGE_SIZE,
    });

    const { data: customersResult, isLoading: areCustomersLoading } = useGetCustomersQuery({ page: 0, size: 200 });
    const [createReminder, { isLoading: isCreating }] = useCreatePaymentReminderMutation();
    const [updateReminder, { isLoading: isUpdating }] = useUpdatePaymentReminderMutation();
    const [deleteReminder, { isLoading: isDeleting }] = useDeletePaymentReminderMutation();
    const { isDark, pageBg, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();

    const reminders = reminderResult?.items ?? [];
    const customers = customersResult?.items ?? [];
    const pagination = reminderResult?.pagination;
    const totalElements = pagination?.totalElements ?? reminders.length;
    const totalPages = pagination?.totalPages ?? 0;
    const isSaving = isCreating || isUpdating;
    const modalBorder = isDark ? cardBorder : '#CBD5E1';

    /* ── Filter state ── */
    const isToday = paymentDateFilter === today();
    const isAll = paymentDateFilter === '';
    const hasFilter = !isToday; // отличается от дефолтного

    /* ── Aggregate status counts (current page) ── */
    const overdueCount = reminders.filter((r) => (dayDifference(r.paymentDate) ?? 0) < 0).length;
    const todayCount = reminders.filter((r) => dayDifference(r.paymentDate) === 0).length;
    const upcomingCount = reminders.filter((r) => (dayDifference(r.paymentDate) ?? 0) > 0).length;

    useEffect(() => {
        if (error) Alert(error?.data?.message || 'Eslatmalarni yuklashda xatolik', 'error');
    }, [error]);

    const openCreate = () => {
        setEditingReminder(null);
        setCustomerId('');
        setPaymentDate(today());
        setNote('');
        setPrice('');
        setDialogOpen(true);
    };

    const openEdit = (reminder) => {
        setEditingReminder(reminder);
        setCustomerId(reminder.customerId);
        setPaymentDate(reminder.paymentDate || today());
        setNote(reminder.note || '');
        setPrice(reminder.price === null || reminder.price === undefined ? '' : String(reminder.price));
        setDialogOpen(true);
    };

    const closeForm = () => {
        if (isSaving) return;
        setDialogOpen(false);
        setEditingReminder(null);
    };

    const saveReminder = async (event) => {
        event.preventDefault();
        if (isSaving) return;
        if (!editingReminder && !customerId) {
            Alert('Mijozni tanlang', 'error');
            return;
        }
        if (!paymentDate) {
            Alert('To‘lov sanasini tanlang', 'error');
            return;
        }
        const cleanNote = note.trim();
        if (cleanNote.length > 500) {
            Alert('Izoh 500 belgidan oshmasligi kerak', 'error');
            return;
        }
        const parsedPrice = price.trim() === '' ? null : Number(price);
        if (parsedPrice !== null && (!Number.isFinite(parsedPrice) || parsedPrice < 0)) {
            Alert('Summa 0 dan kichik bo‘lmasligi kerak', 'error');
            return;
        }

        try {
            if (editingReminder) {
                await updateReminder({
                    id: editingReminder.id,
                    data: { paymentDate, note: cleanNote, price: parsedPrice },
                }).unwrap();
                Alert('Eslatma yangilandi', 'success');
            } else {
                await createReminder({
                    customerId,
                    paymentDate,
                    ...(cleanNote ? { note: cleanNote } : {}),
                    ...(parsedPrice !== null ? { price: parsedPrice } : {}),
                }).unwrap();
                Alert('Eslatma yaratildi', 'success');
            }
            setPage(0);
            closeForm();
        } catch (saveError) {
            Alert(saveError?.data?.message || 'Eslatmani saqlashda xatolik', 'error');
        }
    };

    const confirmDelete = async () => {
        if (!deletingReminder || isDeleting) return;
        try {
            await deleteReminder(deletingReminder.id).unwrap();
            Alert('Eslatma o‘chirildi', 'success');
            setDeletingReminder(null);
            if (reminders.length === 1 && page > 0) setPage(page - 1);
        } catch (deleteError) {
            Alert(deleteError?.data?.message || 'Eslatmani o‘chirishda xatolik', 'error');
        }
    };

    /* ── Filter actions ── */
    const applyToday = () => {
        setPaymentDateFilter(today());
        setPage(0);
    };

    const applyAll = () => {
        setPaymentDateFilter('');
        setPage(0);
    };

    const resetFilters = () => {
        setPaymentDateFilter(today());
        setPage(0);
    };

    return (
        <Box minH="100%" bg={pageBg} color={textColor} py={2}>

            {/* ═══ Header ═══ */}
            <Box
                bg={cardBg}
                borderWidth="1px"
                borderColor={cardBorder}
                borderRadius="2xl"
                p={5}
                mb={4}
                position="relative"
                overflow="hidden"
                boxShadow={isDark ? 'none' : '0 6px 20px rgba(15,23,42,.06)'}
            >
                <Box
                    position="absolute"
                    top={0} right={0}
                    w="40%" h="100%"
                    bgGradient={`linear(to-l, ${
                        isDark ? 'rgba(250,204,21,.04)' : 'rgba(250,204,21,.06)'
                    }, transparent)`}
                    pointerEvents="none"
                />
                <HStack justify="space-between" align="center" flexWrap="wrap" gap={4} position="relative">
                    <HStack gap={3}>
                        <Box
                            p={3}
                            borderRadius="xl"
                            bg={isDark ? 'rgba(250,204,21,.12)' : '#FEF3C7'}
                            border={`1.5px solid ${isDark ? 'rgba(250,204,21,.25)' : '#FDE047'}`}
                            color={isDark ? '#fde68a' : '#CA8A04'}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                        >
                            <CalendarClock size={23} />
                        </Box>
                        <Box>
                            <Heading size="2xl" fontWeight="bold" lineHeight="1.15">
                                To‘lov eslatmalari
                            </Heading>
                            <Text mt={1} color={subtitleColor} fontSize="sm">
                                Mijozlar bilan kelishilgan to‘lov sanalari va qaydlar
                            </Text>
                        </Box>
                    </HStack>
                    {canManage && (
                        <Button
                            onClick={openCreate}
                            bg={accentColor}
                            color="black"
                            borderRadius="xl"
                            fontWeight="bold"
                            minH="44px"
                            px={5}
                            boxShadow={`0 4px 12px ${isDark ? 'rgba(250,204,21,.15)' : 'rgba(250,204,21,.25)'}`}
                            _hover={{ bg: isDark ? '#EAB308' : '#F5B800', transform: 'translateY(-1px)', boxShadow: 'lg' }}
                            transition="all .2s"
                        >
                            <HStack gap={2}><Plus size={18} /><span>Yangi eslatma</span></HStack>
                        </Button>
                    )}
                </HStack>
            </Box>

            {/* ═══ Filters ═══ */}
            <Box
                bg={cardBg}
                borderWidth="1px"
                borderColor={cardBorder}
                borderRadius="2xl"
                p={5}
                mb={4}
                boxShadow={isDark ? 'none' : '0 4px 16px rgba(15,23,42,.04)'}
            >
                <HStack gap={2} mb={4}>
                    <LuFilter size={15} color={isDark ? '#94a3b8' : '#64748b'} />
                    <Text fontSize="sm" fontWeight="semibold" color={subtitleColor}>Filter</Text>
                    {hasFilter && (
                        <Badge colorPalette="yellow" borderRadius="full" px={2} fontSize="10px">
                            faol
                        </Badge>
                    )}
                </HStack>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto]">
                    {/* Date input */}
                    <div>
                        <Text color={subtitleColor} fontSize="xs" fontWeight="semibold" mb={1.5} textTransform="uppercase" letterSpacing="wider">
                            Sana bo‘yicha (shu sana va undan oldin)
                        </Text>
                        <FormControl
                            type="date"
                            value={paymentDateFilter}
                            onChange={(event) => {
                                setPaymentDateFilter(event.target.value);
                                setPage(0);
                            }}
                            placeholder="Sanani tanlang"
                        />
                    </div>

                    {/* Quick actions */}
                    <div className="flex flex-wrap items-end gap-2">
                        <Button
                            type="button"
                            onClick={applyToday}
                            variant={isToday ? 'solid' : 'outline'}
                            bg={isToday ? accentColor : undefined}
                            color={isToday ? 'black' : subtitleColor}
                            borderColor={cardBorder}
                            borderRadius="xl"
                            minH="48px"
                            px={4}
                            fontWeight="bold"
                            _hover={isToday ? { bg: isDark ? '#EAB308' : '#F5B800' } : { borderColor: accentColor, color: accentColor }}
                        >
                            <HStack gap={2}>
                                <LuClock3 size={15} />
                                <span>Bugun</span>
                            </HStack>
                        </Button>

                        <Button
                            type="button"
                            onClick={applyAll}
                            variant={isAll ? 'solid' : 'outline'}
                            bg={isAll ? accentColor : undefined}
                            color={isAll ? 'black' : subtitleColor}
                            borderColor={cardBorder}
                            borderRadius="xl"
                            minH="48px"
                            px={4}
                            fontWeight="bold"
                            _hover={isAll ? { bg: isDark ? '#EAB308' : '#F5B800' } : { borderColor: accentColor, color: accentColor }}
                        >
                            <HStack gap={2}>
                                <LuCalendarDays size={15} />
                                <span>Barcha sanalar</span>
                            </HStack>
                        </Button>

                        <Button
                            type="button"
                            onClick={resetFilters}
                            variant="outline"
                            borderColor={cardBorder}
                            color={subtitleColor}
                            borderRadius="xl"
                            minH="48px"
                            px={4}
                            disabled={!hasFilter && !isAll}
                            _hover={{ borderColor: accentColor, color: accentColor }}
                        >
                            <HStack gap={2}>
                                <RotateCcw size={15} />
                                <span>Tozalash</span>
                            </HStack>
                        </Button>
                    </div>
                </div>

                {/* Active filter pill */}
                <HStack gap={2} mt={4} flexWrap="wrap">
                    <Text fontSize="xs" color={subtitleColor} fontWeight="semibold">
                        Faol filter:
                    </Text>
                    <Box
                        px={2.5} py={1}
                        borderRadius="full"
                        bg={isDark ? 'rgba(250,204,21,.12)' : '#FEF3C7'}
                        border={`1px solid ${isDark ? 'rgba(250,204,21,.3)' : '#FDE047'}`}
                    >
                        <Text fontSize="xs" fontWeight="bold" color={isDark ? '#fde68a' : '#92400e'}>
                            {isAll ? 'Barcha sanalar' : `≤ ${formatDate(paymentDateFilter)}`}
                        </Text>
                    </Box>
                </HStack>
            </Box>

            {/* ═══ List card ═══ */}
            <Box
                bg={cardBg}
                borderWidth="1px"
                borderColor={cardBorder}
                borderRadius="2xl"
                overflow="hidden"
                boxShadow={isDark ? 'none' : '0 8px 24px rgba(15, 23, 42, 0.05)'}
            >
                <HStack justify="space-between" px={{ base: 4, md: 5 }} py={4} borderBottomWidth="1px" borderColor={cardBorder}>
                    <HStack gap={2}>
                        <Search size={17} color={accentColor} />
                        <Text fontWeight="semibold">Eslatmalar ro‘yxati</Text>
                        {!isLoading && (
                            <Badge colorPalette="yellow" borderRadius="full" px={2}>{totalElements}</Badge>
                        )}
                    </HStack>
                    <HStack gap={3}>
                        {/* Summary pills */}
                        {!isLoading && reminders.length > 0 && (
                            <HStack gap={2} display={{ base: 'none', md: 'flex' }}>
                                {overdueCount > 0 && <StatPill label="o‘tgan" value={overdueCount} tone="danger" isDark={isDark} />}
                                {todayCount > 0 && <StatPill label="bugun" value={todayCount} tone="warning" isDark={isDark} />}
                                {upcomingCount > 0 && <StatPill label="kelgusi" value={upcomingCount} tone="success" isDark={isDark} />}
                            </HStack>
                        )}
                        {isFetching && !isLoading && <Spinner size="sm" color={accentColor} />}
                    </HStack>
                </HStack>

                {isLoading ? (
                    <Loading />
                ) : error ? (
                    <Box py={10} px={5} textAlign="center" color={isDark ? 'red.300' : 'red.600'}>
                        <VStack gap={2}>
                            <AlertCircle size={28} />
                            <Text fontWeight="semibold">Eslatmalarni yuklab bo‘lmadi</Text>
                            <Text fontSize="sm" opacity={0.8}>Sahifani yangilab qayta urinib ko‘ring.</Text>
                        </VStack>
                    </Box>
                ) : reminders.length === 0 ? (
                    <EmptyData
                        text="Eslatmalar topilmadi"
                        description={hasFilter
                            ? 'Tanlangan sana bo‘yicha eslatma topilmadi. «Barcha sanalar» tugmasini bosing yoki sanani o‘zgartiring.'
                            : 'Hozircha eslatmalar yo‘q. Mijozning to‘lov sanasi va izohini qo‘shing.'}
                        action={canManage && (
                            <HStack gap={2}>
                                {hasFilter && (
                                    <Button onClick={applyAll} variant="outline" borderColor={cardBorder} color={textColor} borderRadius="xl">
                                        <HStack gap={2}><LuCalendarDays size={16} /><span>Barcha sanalar</span></HStack>
                                    </Button>
                                )}
                                <Button onClick={openCreate} bg={accentColor} color="black" borderRadius="xl">
                                    <Plus size={17} /> Yangi eslatma
                                </Button>
                            </HStack>
                        )}
                    />
                ) : (
                    <Box overflowX="auto">
                        <Table.Root size="sm" interactive minW="900px">
                            <Table.Header bg={isDark ? '#0f172a80' : '#F8FAFC'}>
                                <Table.Row>
                                    {['Mijoz', 'To‘lov sanasi', 'Summa', 'Izoh', ...(canManage ? ['Amallar'] : [])].map((label) => (
                                        <Table.ColumnHeader
                                            key={label}
                                            color={subtitleColor}
                                            px={4}
                                            py={3}
                                            fontSize="xs"
                                            textTransform="uppercase"
                                            letterSpacing="wider"
                                            fontWeight="bold"
                                        >
                                            {label}
                                        </Table.ColumnHeader>
                                    ))}
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {reminders.map((reminder) => {
                                    const status = getStatusMeta(reminder.paymentDate, isDark);
                                    const StatusIcon = status.Icon;

                                    return (
                                        <Table.Row key={reminder.id} _hover={{ bg: isDark ? 'whiteAlpha.50' : 'gray.50' }} transition="background .15s">
                                            {/* Mijoz */}
                                            <Table.Cell px={4} py={3.5}>
                                                <HStack gap={2.5}>
                                                    <Box
                                                        p={2}
                                                        borderRadius="lg"
                                                        bg={isDark ? 'rgba(250,204,21,.1)' : '#FEF3C7'}
                                                        color={isDark ? '#fde68a' : '#CA8A04'}
                                                        display="flex"
                                                        alignItems="center"
                                                    >
                                                        <LuUserRound size={15} />
                                                    </Box>
                                                    <VStack align="start" gap={0}>
                                                        <Text color={textColor} fontWeight="semibold">
                                                            {reminder.customerName || 'Noma’lum mijoz'}
                                                        </Text>
                                                     
                                                    </VStack>
                                                </HStack>
                                            </Table.Cell>

                                            {/* To'lov sanasi */}
                                            <Table.Cell px={4} py={3.5} whiteSpace="nowrap">
                                                <VStack align="start" gap={1}>
                                                    <HStack gap={2}>
                                                        <Box
                                                            p={1.5}
                                                            borderRadius="md"
                                                            bg={status.bg}
                                                            border={`1px solid ${status.border}`}
                                                            color={status.color}
                                                            display="flex"
                                                            alignItems="center"
                                                        >
                                                            <LuClock3 size={12} />
                                                        </Box>
                                                        <Text color={textColor} fontWeight="bold" fontSize="sm">
                                                            {formatDate(reminder.paymentDate)}
                                                        </Text>
                                                    </HStack>
                                                    <HStack
                                                        gap={1}
                                                        ml={7}
                                                        color={status.color}
                                                        fontSize="xs"
                                                        fontWeight="semibold"
                                                    >
                                                        <StatusIcon size={10} />
                                                        <span>{status.label}</span>
                                                    </HStack>
                                                </VStack>
                                            </Table.Cell>

                                            {/* Summa */}
                                            <Table.Cell px={4} py={3.5} whiteSpace="nowrap">
                                                <Text
                                                    color={reminder.price === null || reminder.price === undefined ? subtitleColor : (isDark ? 'green.300' : 'green.700')}
                                                    fontWeight="bold"
                                                    fontSize="sm"
                                                >
                                                    {reminder.price === null || reminder.price === undefined
                                                        ? '—'
                                                        : `${formatNumber(reminder.price)} so‘m`}
                                                </Text>
                                            </Table.Cell>

                                            {/* Izoh */}
                                            <Table.Cell px={4} py={3.5} minW="220px" maxW="420px">
                                                <HStack align="start" gap={2} color={reminder.note ? textColor : subtitleColor}>
                                                    <LuStickyNote
                                                        size={14}
                                                        style={{ marginTop: 3, flexShrink: 0, opacity: reminder.note ? 1 : 0.5 }}
                                                    />
                                                    <Text
                                                        fontSize="sm"
                                                        whiteSpace="pre-wrap"
                                                        wordBreak="break-word"
                                                        fontStyle={reminder.note ? 'normal' : 'italic'}
                                                    >
                                                        {reminder.note || 'Izoh yo‘q'}
                                                    </Text>
                                                </HStack>
                                            </Table.Cell>

                                            {/* Amallar */}
                                            {canManage && (
                                                <Table.Cell px={4} py={3.5}>
                                                    <HStack justify="end" gap={1}>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            color={accentColor}
                                                            borderRadius="lg"
                                                            aria-label="Eslatmani tahrirlash"
                                                            title="Tahrirlash"
                                                            onClick={() => openEdit(reminder)}
                                                            _hover={{ bg: isDark ? 'rgba(250,204,21,.12)' : '#FEF3C7' }}
                                                        >
                                                            <Pencil size={16} />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            color={isDark ? 'red.300' : 'red.600'}
                                                            borderRadius="lg"
                                                            aria-label="Eslatmani o‘chirish"
                                                            title="O‘chirish"
                                                            onClick={() => setDeletingReminder(reminder)}
                                                            _hover={{ bg: isDark ? 'rgba(239,68,68,.12)' : '#FEF2F2' }}
                                                        >
                                                            <Trash2 size={16} />
                                                        </Button>
                                                    </HStack>
                                                </Table.Cell>
                                            )}
                                        </Table.Row>
                                    );
                                })}
                            </Table.Body>
                        </Table.Root>
                    </Box>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <HStack
                        justify="space-between"
                        flexWrap="wrap"
                        gap={3}
                        px={{ base: 4, md: 5 }}
                        py={3}
                        borderTopWidth="1px"
                        borderColor={cardBorder}
                        bg={isDark ? 'rgba(255,255,255,.01)' : '#FCFDFE'}
                    >
                        <Text color={subtitleColor} fontSize="sm">
                            <Text as="span" fontWeight="bold" color={textColor}>
                                {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalElements)}
                            </Text>
                            {' '}/ {totalElements}
                        </Text>
                        <HStack gap={2}>
                            <Button
                                size="sm"
                                variant="outline"
                                borderColor={cardBorder}
                                borderRadius="lg"
                                disabled={page === 0 || isFetching}
                                onClick={() => setPage(page - 1)}
                                aria-label="Oldingi sahifa"
                            >
                                <LuChevronLeft />
                            </Button>
                            <Text color={subtitleColor} fontSize="sm" fontWeight="semibold" minW="60px" textAlign="center">
                                {page + 1} / {totalPages}
                            </Text>
                            <Button
                                size="sm"
                                variant="outline"
                                borderColor={cardBorder}
                                borderRadius="lg"
                                disabled={page >= totalPages - 1 || isFetching}
                                onClick={() => setPage(page + 1)}
                                aria-label="Keyingi sahifa"
                            >
                                <LuChevronRight />
                            </Button>
                        </HStack>
                    </HStack>
                )}
            </Box>

            {/* ═══ Create / Edit modal ═══ */}
            {canManage && (
                <Dialog.Root open={dialogOpen} onOpenChange={(event) => !event.open && closeForm()} size="md" placement="center">
                    <Portal>
                        <Dialog.Backdrop backdropFilter="blur(6px)" bg={isDark ? 'blackAlpha.700' : 'blackAlpha.400'} />
                        <Dialog.Positioner>
                            <Dialog.Content
                                bg={cardBg}
                                borderColor={modalBorder}
                                borderWidth="1px"
                                borderRadius="2xl"
                                boxShadow="2xl"
                                overflow="hidden"
                                w="calc(100% - 32px)"
                                maxW="560px"
                            >
                                <Box position="absolute" top="0" left="0" right="0" h="4px" bgGradient={`linear(to-r, ${accentColor}, yellow.300)`} />

                                <Dialog.Header color={textColor} fontSize="xl" fontWeight="bold" pt={7} pb={5} borderBottomWidth="1px" borderColor={modalBorder}>
                                    <HStack gap={3}>
                                        <Box
                                            p={2.5}
                                            borderRadius="xl"
                                            bg={isDark ? 'rgba(250,204,21,.12)' : '#FEFCE8'}
                                            border={`1px solid ${isDark ? 'rgba(250,204,21,.25)' : '#FDE047'}`}
                                            color={isDark ? '#fde68a' : '#CA8A04'}
                                            display="flex"
                                            alignItems="center"
                                            justifyContent="center"
                                        >
                                            <CalendarClock size={20} />
                                        </Box>
                                        <VStack align="start" gap={0}>
                                            <Text>{editingReminder ? 'Eslatmani tahrirlash' : 'Yangi to‘lov eslatmasi'}</Text>
                                            <Text fontSize="xs" fontWeight="normal" color={subtitleColor}>
                                                {editingReminder ? 'Ma’lumotlarni yangilang' : 'Mijoz, sana va summani kiriting'}
                                            </Text>
                                        </VStack>
                                    </HStack>
                                </Dialog.Header>

                                <Dialog.CloseTrigger asChild>
                                    <Button variant="ghost" color={subtitleColor} size="sm" position="absolute" top="3" right="3" aria-label="Yopish" disabled={isSaving}>
                                        <X />
                                    </Button>
                                </Dialog.CloseTrigger>

                                <Box as="form" onSubmit={saveReminder}>
                                    <Dialog.Body py={5}>
                                        <VStack gap={4} align="stretch">
                                            <Field.Root required={!editingReminder}>
                                                <Field.Label color={textColor} fontWeight="medium">
                                                    Mijoz{!editingReminder && <Field.RequiredIndicator />}
                                                </Field.Label>
                                                {editingReminder ? (
                                                    <FormControl
                                                        value={editingReminder.customerName || customers.find((item) => item.id === customerId)?.name || ''}
                                                        readOnly
                                                    />
                                                ) : (
                                                    <FormControl
                                                        as="select"
                                                        value={customerId}
                                                        onChange={(event) => setCustomerId(event.target.value)}
                                                        disabled={areCustomersLoading}
                                                    >
                                                        <option value="">
                                                            {areCustomersLoading ? 'Mijozlar yuklanmoqda...' : 'Mijozni tanlang'}
                                                        </option>
                                                        {customers.map((customer) => (
                                                            <option key={customer.id} value={customer.id}>
                                                                {customer.name}{customer.phone ? ` — ${customer.phone}` : ''}
                                                            </option>
                                                        ))}
                                                    </FormControl>
                                                )}
                                            </Field.Root>

                                            <Field.Root required>
                                                <Field.Label color={textColor} fontWeight="medium">
                                                    <HStack gap={2}>
                                                        <LuClock3 size={14} />
                                                        <span>To‘lov sanasi</span>
                                                    </HStack>
                                                    <Field.RequiredIndicator />
                                                </Field.Label>
                                                <FormControl type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} disabled={isSaving} minH="48px" size="lg" />
                                            </Field.Root>

                                            <Field.Root>
                                                <Field.Label color={textColor} fontWeight="medium">Kutilayotgan summa</Field.Label>
                                                <FormControl
                                                    type="number"
                                                    min="0"
                                                    step="any"
                                                    value={price}
                                                    onChange={(event) => setPrice(event.target.value)}
                                                    placeholder="Masalan: 5 000 000"
                                                    disabled={isSaving}
                                                />
                                                <Text color={subtitleColor} fontSize="xs">Ixtiyoriy. Bo‘sh qoldirsangiz, summa ko‘rsatilmaydi.</Text>
                                            </Field.Root>

                                            <Field.Root>
                                                <Field.Label color={textColor} fontWeight="medium">
                                                    <HStack gap={2}>
                                                        <LuStickyNote size={14} />
                                                        <span>Izoh</span>
                                                    </HStack>
                                                </Field.Label>
                                                <FormControl
                                                    as="textarea"
                                                    rows={4}
                                                    value={note}
                                                    onChange={(event) => setNote(event.target.value)}
                                                    placeholder="Kelishuv tafsilotlarini yozing"
                                                    maxLength={500}
                                                    disabled={isSaving}
                                                    resize="vertical"
                                                />
                                                <Text color={subtitleColor} fontSize="xs" textAlign="right">{note.length}/500</Text>
                                            </Field.Root>

                                            <Text color={subtitleColor} fontSize="sm" bg={isDark ? 'whiteAlpha.50' : 'gray.50'} p={3} borderRadius="lg">
                                                Eslatma o‘zi mijoz balansini o‘zgartirmaydi. Haqiqiy to‘lovni alohida kiriting.
                                            </Text>
                                        </VStack>
                                    </Dialog.Body>

                                    <Dialog.Footer gap={3} pt={5} pb={6} borderTopWidth="1px" borderColor={modalBorder}>
                                        <Button
                                            variant="ghost"
                                            onClick={closeForm}
                                            disabled={isSaving}
                                            size="lg"
                                            px={6}
                                            borderRadius="xl"
                                            color={subtitleColor}
                                            borderWidth="1px"
                                            borderStyle="solid"
                                            borderColor={isDark ? 'transparent' : '#CBD5E1'}
                                            _hover={{ bg: isDark ? 'rgba(148,163,184,.16)' : 'gray.100', color: textColor }}
                                        >
                                            Bekor qilish
                                        </Button>
                                        <Button
                                            type="submit"
                                            bg={accentColor}
                                            color="black"
                                            disabled={isSaving || (!editingReminder && !customerId) || !paymentDate}
                                            size="lg"
                                            px={8}
                                            borderRadius="xl"
                                            fontWeight="bold"
                                            _hover={{ bg: isDark ? '#EAB308' : '#F5B800', transform: 'scale(1.02)' }}
                                            _active={{ transform: 'scale(0.98)' }}
                                            _disabled={{ opacity: 0.6, cursor: 'not-allowed' }}
                                        >
                                            {isSaving ? (
                                                <HStack gap={2}><Spinner size="sm" color="black" /><span>Saqlanmoqda...</span></HStack>
                                            ) : editingReminder ? (
                                                <HStack gap={2}><CheckCircle2 size={18} /><span>Saqlash</span></HStack>
                                            ) : (
                                                <HStack gap={2}><Plus size={18} /><span>Yaratish</span></HStack>
                                            )}
                                        </Button>
                                    </Dialog.Footer>
                                </Box>
                            </Dialog.Content>
                        </Dialog.Positioner>
                    </Portal>
                </Dialog.Root>
            )}

            {/* ═══ Delete modal ═══ */}
            {canManage && (
                <Dialog.Root
                    open={Boolean(deletingReminder)}
                    onOpenChange={(event) => !event.open && !isDeleting && setDeletingReminder(null)}
                    size="sm"
                    placement="center"
                >
                    <Portal>
                        <Dialog.Backdrop backdropFilter="blur(6px)" bg={isDark ? 'blackAlpha.700' : 'blackAlpha.400'} />
                        <Dialog.Positioner>
                            <Dialog.Content
                                bg={cardBg}
                                borderColor={modalBorder}
                                borderWidth="1px"
                                borderRadius="2xl"
                                boxShadow="2xl"
                                overflow="hidden"
                                maxW="460px"
                                w="calc(100% - 32px)"
                            >
                                <Box position="absolute" top="0" left="0" right="0" h="4px" bgGradient="linear(to-r, red.400, red.600)" />

                                <Dialog.Header color={textColor} fontSize="xl" fontWeight="bold" pt={7} pb={5} borderBottomWidth="1px" borderColor={modalBorder}>
                                    <HStack gap={3}>
                                        <Box
                                            p={2.5}
                                            borderRadius="xl"
                                            bg={isDark ? 'rgba(239,68,68,.12)' : '#FEF2F2'}
                                            border={`1px solid ${isDark ? 'rgba(239,68,68,.3)' : '#FECACA'}`}
                                            color={isDark ? 'red.300' : 'red.600'}
                                            display="flex"
                                            alignItems="center"
                                            justifyContent="center"
                                        >
                                            <Trash2 size={20} />
                                        </Box>
                                        <VStack align="start" gap={0}>
                                            <Text>Eslatmani o‘chirish</Text>
                                            <Text fontSize="xs" fontWeight="normal" color={subtitleColor}>Bu amalni qaytarib bo‘lmaydi</Text>
                                        </VStack>
                                    </HStack>
                                </Dialog.Header>

                                <Dialog.CloseTrigger asChild>
                                    <Button variant="ghost" color={subtitleColor} size="sm" position="absolute" top="3" right="3" aria-label="Yopish" disabled={isDeleting}>
                                        <X />
                                    </Button>
                                </Dialog.CloseTrigger>

                                <Dialog.Body py={6}>
                                    <Box
                                        p={4}
                                        borderRadius="xl"
                                        borderWidth="1px"
                                        borderColor={isDark ? 'rgba(239,68,68,.3)' : '#FECACA'}
                                        bg={isDark ? 'rgba(239,68,68,.06)' : '#FEF2F2'}
                                    >
                                        <HStack gap={3} align="start">
                                            <Box
                                                p={2}
                                                borderRadius="lg"
                                                bg={isDark ? 'rgba(239,68,68,.15)' : '#FEE2E2'}
                                                color={isDark ? 'red.300' : 'red.600'}
                                                flexShrink={0}
                                            >
                                                <AlertCircle size={16} />
                                            </Box>
                                            <VStack align="start" gap={1} minW={0}>
                                                <Text fontSize="sm" color={textColor} fontWeight="medium">
                                                    <Text as="span" fontWeight="bold">
                                                        {deletingReminder?.customerName || 'Mijoz'}
                                                    </Text>
                                                    {' '}uchun{' '}
                                                    <Text as="span" fontWeight="bold">
                                                        {formatDate(deletingReminder?.paymentDate)}
                                                    </Text>
                                                    {' '}sanasidagi eslatma o‘chirilsinmi?
                                                </Text>
                                                {deletingReminder?.note && (
                                                    <Text fontSize="xs" color={subtitleColor} noOfLines={2}>
                                                        “{deletingReminder.note}”
                                                    </Text>
                                                )}
                                            </VStack>
                                        </HStack>
                                    </Box>
                                </Dialog.Body>

                                <Dialog.Footer gap={3} pt={5} pb={6} borderTopWidth="1px" borderColor={modalBorder}>
                                    <Button
                                        variant="ghost"
                                        onClick={() => setDeletingReminder(null)}
                                        disabled={isDeleting}
                                        size="lg"
                                        px={6}
                                        borderRadius="xl"
                                        color={subtitleColor}
                                        borderWidth="1px"
                                        borderStyle="solid"
                                        borderColor={isDark ? 'transparent' : '#CBD5E1'}
                                        _hover={{ bg: isDark ? 'rgba(148,163,184,.16)' : 'gray.100', color: textColor }}
                                    >
                                        Bekor qilish
                                    </Button>
                                    <Button
                                        colorPalette="red"
                                        onClick={confirmDelete}
                                        disabled={isDeleting}
                                        size="lg"
                                        px={8}
                                        borderRadius="xl"
                                        fontWeight="bold"
                                        _hover={{ transform: 'scale(1.02)' }}
                                        _active={{ transform: 'scale(0.98)' }}
                                    >
                                        {isDeleting ? (
                                            <HStack gap={2}><Spinner size="sm" /><span>O‘chirilmoqda...</span></HStack>
                                        ) : (
                                            <HStack gap={2}><Trash2 size={18} /><span>O‘chirish</span></HStack>
                                        )}
                                    </Button>
                                </Dialog.Footer>
                            </Dialog.Content>
                        </Dialog.Positioner>
                    </Portal>
                </Dialog.Root>
            )}
        </Box>
    );
}