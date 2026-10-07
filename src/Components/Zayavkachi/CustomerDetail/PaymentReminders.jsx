import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
    Box,
    Button,
    Dialog,
    Field,
    HStack,
    Portal,
    Spinner,
    Table,
    Text,
    VStack,
} from '@chakra-ui/react';
import {
    CalendarClock, Pencil, Plus, Trash2, X,
    AlertCircle, CheckCircle2, Clock,
} from 'lucide-react';
import {
    LuChevronLeft, LuChevronRight, LuClock3, LuStickyNote,
    LuTriangleAlert, LuCalendarCheck, LuCalendarDays, LuWallet,
} from 'react-icons/lu';
import {
    useCreatePaymentReminderMutation,
    useDeletePaymentReminderMutation,
    useGetPaymentRemindersQuery,
    useUpdatePaymentReminderMutation,
} from '../../../store/services/paymentReminder.api';
import { useAppTheme } from '../../../theme/tokens';
import { Alert } from '../../Other/UI/Alert/Alert';
import Loading from '../../Other/UI/Loadings/Loading';
import FormControl from '../../ui/FormControl';
import { formatNumber } from '../../ui/number-format';

const PAGE_SIZE = 10;

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

/** Kunlar farqi: manfiy — o'tgan, 0 — bugun, musbat — kelajak */
const formatPriceInput = (value) => {
    const digits = value.replace(/\D/g, '');
    return digits ? digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : '';
};

const daysDiff = (value) => {
    if (!value) return null;
    const target = new Date(value);
    const now = new Date();
    target.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    return Math.round((target - now) / 86400000);
};

/** Status meta — rang, ikonka, matn */
const getStatusMeta = (paymentDate, isDark) => {
    const diff = daysDiff(paymentDate);
    if (diff === null) {
        return {
            tone: 'neutral',
            label: '—',
            Icon: LuCalendarDays,
            color: isDark ? '#94a3b8' : '#64748b',
            bg: isDark ? 'rgba(148,163,184,.1)' : '#F1F5F9',
            border: isDark ? 'rgba(148,163,184,.25)' : '#E2E8F0',
        };
    }
    if (diff < 0) {
        return {
            tone: 'danger',
            label: `${Math.abs(diff)} kun o‘tgan`,
            Icon: LuTriangleAlert,
            color: isDark ? '#fca5a5' : '#dc2626',
            bg: isDark ? 'rgba(239,68,68,.12)' : '#FEF2F2',
            border: isDark ? 'rgba(239,68,68,.3)' : '#FECACA',
        };
    }
    if (diff === 0) {
        return {
            tone: 'warning',
            label: 'Bugun',
            Icon: AlertCircle,
            color: isDark ? '#fde68a' : '#b45309',
            bg: isDark ? 'rgba(250,204,21,.14)' : '#FFFBEB',
            border: isDark ? 'rgba(250,204,21,.35)' : '#FDE68A',
        };
    }
    if (diff <= 3) {
        return {
            tone: 'soon',
            label: `${diff} kundan keyin`,
            Icon: Clock,
            color: isDark ? '#93c5fd' : '#1d4ed8',
            bg: isDark ? 'rgba(59,130,246,.14)' : '#EFF6FF',
            border: isDark ? 'rgba(59,130,246,.3)' : '#BFDBFE',
        };
    }
    return {
        tone: 'success',
        label: `${diff} kundan keyin`,
        Icon: LuCalendarCheck,
        color: isDark ? '#86efac' : '#15803d',
        bg: isDark ? 'rgba(34,197,94,.12)' : '#F0FDF4',
        border: isDark ? 'rgba(34,197,94,.3)' : '#BBF7D0',
    };
};

/* ── Summary pill (small stat) ── */
function StatPill({ label, value, tone, isDark }) {
    const palette = {
        danger: { color: isDark ? '#fca5a5' : '#dc2626', bg: isDark ? 'rgba(239,68,68,.1)' : '#FEF2F2', border: isDark ? 'rgba(239,68,68,.25)' : '#FECACA' },
        warning: { color: isDark ? '#fde68a' : '#b45309', bg: isDark ? 'rgba(250,204,21,.12)' : '#FFFBEB', border: isDark ? 'rgba(250,204,21,.3)' : '#FDE68A' },
        success: { color: isDark ? '#86efac' : '#15803d', bg: isDark ? 'rgba(34,197,94,.1)' : '#F0FDF4', border: isDark ? 'rgba(34,197,94,.25)' : '#BBF7D0' },
        neutral: { color: isDark ? '#cbd5e1' : '#475569', bg: isDark ? 'rgba(148,163,184,.1)' : '#F1F5F9', border: isDark ? 'rgba(148,163,184,.25)' : '#E2E8F0' },
    }[tone] || {};
    return (
        <Box
            px={3}
            py={1.5}
            borderRadius="lg"
            bg={palette.bg}
            borderWidth="1px"
            borderColor={palette.border}
        >
            <HStack gap={2}>
                <Text fontSize="lg" fontWeight="bold" color={palette.color} lineHeight="1">
                    {value}
                </Text>
                <Text fontSize="xs" fontWeight="semibold" color={palette.color} opacity={0.85}>
                    {label}
                </Text>
            </HStack>
        </Box>
    );
}

StatPill.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.number.isRequired,
    tone: PropTypes.string.isRequired,
    isDark: PropTypes.bool.isRequired,
};

export default function PaymentReminders({ customerId }) {
    const [page, setPage] = useState(0);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingReminder, setEditingReminder] = useState(null);
    const [deletingReminder, setDeletingReminder] = useState(null);
    const [paymentDate, setPaymentDate] = useState(today);
    const [note, setNote] = useState('');
    const [price, setPrice] = useState('');

    const { isDark, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();
    const modalBorder = isDark ? cardBorder : '#94A3B8';

    const {
        data: result,
        isLoading,
        isFetching,
        error,
    } = useGetPaymentRemindersQuery(
        { customerId, page, size: PAGE_SIZE },
        { skip: !customerId }
    );

    const [createReminder, { isLoading: isCreating }] = useCreatePaymentReminderMutation();
    const [updateReminder, { isLoading: isUpdating }] = useUpdatePaymentReminderMutation();
    const [deleteReminder, { isLoading: isDeleting }] = useDeletePaymentReminderMutation();

    const reminders = result?.items ?? [];
    const totalReminders = result?.pagination?.totalElements ?? reminders.length;
    const totalPages = result?.pagination?.totalPages ?? 0;
    const isSaving = isCreating || isUpdating;

    /* ── Aggregate stats (from current page) ── */
    const overdueCount = reminders.filter((r) => (daysDiff(r.paymentDate) ?? 0) < 0).length;
    const todayCount = reminders.filter((r) => daysDiff(r.paymentDate) === 0).length;
    const upcomingCount = reminders.filter((r) => (daysDiff(r.paymentDate) ?? 0) > 0).length;

    useEffect(() => {
        if (error) Alert(error?.data?.message || 'To‘lov eslatmalarini yuklashda xatolik', 'error');
    }, [error]);

    const openCreate = () => {
        setEditingReminder(null);
        setPaymentDate(today());
        setNote('');
        setPrice('');
        setDialogOpen(true);
    };

    const openEdit = (reminder) => {
        setEditingReminder(reminder);
        setPaymentDate(reminder.paymentDate || today());
        setNote(reminder.note || '');
        setPrice(reminder.price === null || reminder.price === undefined ? '' : formatNumber(reminder.price));
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
        if (!paymentDate) {
            Alert('Eslatma sanasini tanlang', 'error');
            return;
        }
        if (note.trim().length > 500) {
            Alert('Izoh 500 belgidan oshmasligi kerak', 'error');
            return;
        }
        const parsedPrice = price.trim() === '' ? null : Number(price.replace(/\s/g, ''));
        if (parsedPrice !== null && (!Number.isFinite(parsedPrice) || parsedPrice < 0)) {
            Alert('Summa 0 dan kichik bo‘lmasligi kerak', 'error');
            return;
        }

        try {
            if (editingReminder) {
                await updateReminder({
                    id: editingReminder.id,
                    data: {
                        paymentDate,
                        note: note.trim(),
                        price: parsedPrice,
                        approved: Boolean(editingReminder.approved),
                    },
                }).unwrap();
                Alert('To‘lov eslatmasi yangilandi', 'success');
            } else {
                await createReminder({
                    customerId,
                    paymentDate,
                    ...(note.trim() ? { note: note.trim() } : {}),
                    ...(parsedPrice !== null ? { price: parsedPrice } : {}),
                }).unwrap();
                Alert('To‘lov eslatmasi yaratildi', 'success');
            }
            closeForm();
        } catch (saveError) {
            Alert(saveError?.data?.message || 'To‘lov eslatmasini saqlashda xatolik', 'error');
        }
    };

    const confirmDelete = async () => {
        if (!deletingReminder || isDeleting) return;
        try {
            await deleteReminder(deletingReminder.id).unwrap();
            Alert('To‘lov eslatmasi o‘chirildi', 'success');
            setDeletingReminder(null);
        } catch (deleteError) {
            Alert(deleteError?.data?.message || 'Eslatmani o‘chirishda xatolik', 'error');
        }
    };

    return (
        <Box
            bg={cardBg}
            borderWidth="1px"
            borderColor={cardBorder}
            borderRadius="2xl"
            overflow="hidden"
            boxShadow={isDark ? 'none' : '0 8px 24px rgba(15, 23, 42, 0.06)'}
        >
            {/* ═══ Header ═══ */}
            <Box
                px={{ base: 4, md: 6 }}
                py={5}
                borderBottomWidth="1px"
                borderColor={cardBorder}
                position="relative"
                overflow="hidden"
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
                    <HStack gap={3} align="center">
                        <Box
                            p={2.5}
                            borderRadius="xl"
                            bg={isDark ? 'rgba(250,204,21,.12)' : '#FEF3C7'}
                            border={`1.5px solid ${isDark ? 'rgba(250,204,21,.25)' : '#FDE047'}`}
                            color={isDark ? '#fde68a' : '#CA8A04'}
                            flexShrink={0}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                        >
                            <CalendarClock size={20} />
                        </Box>
                        <Box>
                            <HStack gap={2} flexWrap="wrap">
                                <Text fontSize="lg" fontWeight="bold" color={textColor}>
                                     Eslatmalar
                                </Text>
                                {!isLoading && totalReminders > 0 && (
                                    <Text
                                        as="span"
                                        fontSize="xs"
                                        fontWeight="bold"
                                        color={isDark ? '#0f172a' : 'white'}
                                        bg={accentColor}
                                        px={2}
                                        py={0.5}
                                        borderRadius="full"
                                        lineHeight="1.4"
                                    >
                                        {totalReminders}
                                    </Text>
                                )}
                            </HStack>
                        
                        </Box>
                    </HStack>

                    <Button
                        onClick={openCreate}
                        bg={accentColor}
                        color="black"
                        borderRadius="xl"
                        fontWeight="bold"
                        px={5}
                        minH="44px"
                        boxShadow={`0 4px 12px ${isDark ? 'rgba(250,204,21,.15)' : 'rgba(250, 204, 21, 0.25)'}`}
                        _hover={{ bg: isDark ? '#EAB308' : '#F5B800', transform: 'translateY(-1px)', boxShadow: 'lg' }}
                        _active={{ transform: 'translateY(0)' }}
                        transition="all .2s"
                        flexShrink={0}
                    >
                        <HStack gap={2}>
                            <Plus size={18} />
                            <span>Yangi eslatma</span>
                        </HStack>
                    </Button>
                </HStack>

                {/* Summary pills */}
                {!isLoading && reminders.length > 0 && (
                    <HStack gap={2} mt={4} flexWrap="wrap" position="relative">
                        {overdueCount > 0 && <StatPill label="o‘tgan" value={overdueCount} tone="danger" isDark={isDark} />}
                        {todayCount > 0 && <StatPill label="bugun" value={todayCount} tone="warning" isDark={isDark} />}
                        {upcomingCount > 0 && <StatPill label="kelgusi" value={upcomingCount} tone="success" isDark={isDark} />}
                    </HStack>
                )}
            </Box>

            {/* ═══ Body ═══ */}
            {isLoading ? (
                <Loading />
            ) : error ? (
                <VStack gap={3} py={12} px={6} textAlign="center" role="alert">
                    <Box
                        p={3}
                        borderRadius="2xl"
                        bg={isDark ? 'rgba(239,68,68,.1)' : '#FEF2F2'}
                        color={isDark ? 'red.300' : 'red.600'}
                    >
                        <AlertCircle size={26} />
                    </Box>
                    <Box>
                        <Text color={textColor} fontWeight="semibold">Yuklashda xatolik</Text>
                        <Text color={subtitleColor} fontSize="sm" mt={1}>
                            Eslatmalarni yuklab bo‘lmadi. Qayta urinib ko‘ring.
                        </Text>
                    </Box>
                </VStack>
            ) : reminders.length === 0 ? (
                <VStack gap={4} px={6} py={12} textAlign="center">
                    <Box
                        p={5}
                        borderRadius="2xl"
                        bg={isDark ? 'rgba(250,204,21,.06)' : '#FEF9C3'}
                        border={`2px dashed ${isDark ? 'rgba(250,204,21,.2)' : '#FDE047'}`}
                        color={isDark ? '#fde68a' : '#CA8A04'}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                    >
                        <CalendarClock size={32} strokeWidth={1.5} />
                    </Box>
                    <VStack gap={1} textAlign="center">
                        <Text color={textColor} fontWeight="bold" fontSize="lg">
                            Hozircha eslatmalar yo‘q
                        </Text>
                        <Text color={subtitleColor} fontSize="sm" maxW="380px">
                            Kelishilgan to‘lov sanasi yoki izohini yozib, birinchi eslatmani qo‘shing
                        </Text>
                    </VStack>
                    <Button
                        onClick={openCreate}
                        bg={accentColor}
                        color="black"
                        borderRadius="xl"
                        fontWeight="bold"
                        px={5}
                        mt={1}
                        _hover={{ bg: isDark ? '#EAB308' : '#F5B800', transform: 'translateY(-1px)' }}
                        transition="all .2s"
                    >
                        <HStack gap={2}>
                            <Plus size={16} />
                            <span>Eslatma qo‘shish</span>
                        </HStack>
                    </Button>
                </VStack>
            ) : (
                <Box overflowX="auto">
                    <Table.Root size="sm" interactive>
                        <Table.Header bg={isDark ? '#0f172a80' : '#F8FAFC'}>
                            <Table.Row>
                                <Table.ColumnHeader color={subtitleColor} px={6} py={3} fontSize="xs" textTransform="uppercase" letterSpacing="wider" fontWeight="bold" w="220px">
                                    To‘lov sanasi
                                </Table.ColumnHeader>
                                <Table.ColumnHeader color={subtitleColor} px={6} py={3} fontSize="xs" textTransform="uppercase" letterSpacing="wider" fontWeight="bold" textAlign="right" w="160px">
                                    Summa
                                </Table.ColumnHeader>
                                <Table.ColumnHeader color={subtitleColor} px={6} py={3} fontSize="xs" textTransform="uppercase" letterSpacing="wider" fontWeight="bold">
                                    Eslatma / izoh
                                </Table.ColumnHeader>
                                <Table.ColumnHeader color={subtitleColor} px={6} py={3} fontSize="xs" textTransform="uppercase" letterSpacing="wider" fontWeight="bold" textAlign="right" w="120px">
                                    Amallar
                                </Table.ColumnHeader>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {reminders.map((reminder) => {
                                const status = getStatusMeta(reminder.paymentDate, isDark);
                                const StatusIcon = status.Icon;
                                return (
                                    <Table.Row
                                        key={reminder.id}
                                        _hover={{ bg: isDark ? 'whiteAlpha.50' : 'gray.50' }}
                                        transition="background .15s"
                                    >
                                        <Table.Cell px={6} py={4} whiteSpace="nowrap">
                                            <HStack gap={3}>
                                                <Box
                                                    p={2}
                                                    borderRadius="lg"
                                                    bg={status.bg}
                                                    border={`1px solid ${status.border}`}
                                                    color={status.color}
                                                    display="flex"
                                                    alignItems="center"
                                                    justifyContent="center"
                                                    flexShrink={0}
                                                >
                                                    <LuClock3 size={15} />
                                                </Box>
                                                <VStack align="start" gap={0.5}>
                                                    <Text color={textColor} fontWeight="bold" fontSize="sm">
                                                        {formatDate(reminder.paymentDate)}
                                                    </Text>
                                                    <HStack gap={1} color={status.color}>
                                                        <StatusIcon size={11} />
                                                        <Text fontSize="xs" fontWeight="semibold">
                                                            {status.label}
                                                        </Text>
                                                    </HStack>
                                                </VStack>
                                            </HStack>
                                        </Table.Cell>

                                        <Table.Cell px={6} py={4} textAlign="right" whiteSpace="nowrap">
                                            <Text
                                                color={reminder.price === null || reminder.price === undefined ? subtitleColor : textColor}
                                                fontWeight="semibold"
                                                fontSize="sm"
                                            >
                                                {reminder.price === null || reminder.price === undefined
                                                    ? '—'
                                                    : `${formatNumber(reminder.price)} so‘m`}
                                            </Text>
                                        </Table.Cell>

                                        <Table.Cell
                                            color={reminder.note ? textColor : subtitleColor}
                                            minW="220px"
                                            maxW="520px"
                                            px={6}
                                            py={4}
                                        >
                                            <HStack gap={2.5} align="start">
                                                <LuStickyNote
                                                    className="mt-1 shrink-0"
                                                    size={14}
                                                    style={{ opacity: reminder.note ? 1 : 0.5 }}
                                                />
                                                <Text
                                                    fontSize="sm"
                                                    whiteSpace="pre-wrap"
                                                    wordBreak="break-word"
                                                    fontStyle={reminder.note ? 'normal' : 'italic'}
                                                >
                                                    {reminder.note || 'Izoh qo‘shilmagan'}
                                                </Text>
                                            </HStack>
                                        </Table.Cell>

                                        <Table.Cell px={6} py={4}>
                                            <HStack gap={1} justify="end">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    color={accentColor}
                                                    borderRadius="lg"
                                                    aria-label="Eslatmani tahrirlash"
                                                    title="Tahrirlash"
                                                    onClick={() => openEdit(reminder)}
                                                    _hover={{
                                                        bg: isDark ? 'rgba(250,204,21,.12)' : '#FEF3C7',
                                                    }}
                                                >
                                                    <Pencil size={15} />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    color={isDark ? 'red.300' : 'red.600'}
                                                    borderRadius="lg"
                                                    aria-label="Eslatmani o‘chirish"
                                                    title="O‘chirish"
                                                    onClick={() => setDeletingReminder(reminder)}
                                                    _hover={{
                                                        bg: isDark ? 'rgba(239,68,68,.12)' : '#FEF2F2',
                                                    }}
                                                >
                                                    <Trash2 size={15} />
                                                </Button>
                                            </HStack>
                                        </Table.Cell>
                                    </Table.Row>
                                );
                            })}
                        </Table.Body>
                    </Table.Root>
                </Box>
            )}

            {/* ═══ Pagination ═══ */}
            {totalPages > 1 && (
                <HStack
                    justify="space-between"
                    px={{ base: 4, md: 6 }}
                    py={3}
                    borderTopWidth="1px"
                    borderColor={cardBorder}
                    bg={isDark ? 'rgba(255,255,255,.01)' : '#FCFDFE'}
                >
                    <Text color={subtitleColor} fontSize="sm">
                        <Text as="span" fontWeight="bold" color={textColor}>
                            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalReminders)}
                        </Text>
                        {' '}/ {totalReminders}
                    </Text>
                    <HStack gap={2}>
                        <Button
                            size="sm"
                            variant="outline"
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

            {/* ═══ CREATE / EDIT MODAL ═══ */}
            <Dialog.Root
                open={dialogOpen}
                onOpenChange={(event) => !event.open && closeForm()}
                size="md"
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
                            w="calc(100% - 32px)"
                            maxW="540px"
                        >
                            <Box
                                position="absolute"
                                top="0" left="0" right="0"
                                h="4px"
                                bgGradient={`linear(to-r, ${accentColor}, yellow.300)`}
                            />

                            <Dialog.Header
                                color={textColor}
                                fontSize="xl"
                                fontWeight="bold"
                                pt={7}
                                pb={5}
                                borderBottomWidth="1px"
                                borderColor={modalBorder}
                            >
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
                                        <Text>{editingReminder ? 'Eslatmani tahrirlash' : 'Yangi eslatma'}</Text>
                                        <Text fontSize="xs" fontWeight="normal" color={subtitleColor}>
                                            {editingReminder
                                                ? 'Ma’lumotlarni yangilang'
                                                : 'To‘lov sanasi va izohni kiriting'}
                                        </Text>
                                    </VStack>
                                </HStack>
                            </Dialog.Header>

                            <Dialog.CloseTrigger asChild>
                                <Button
                                    variant="ghost"
                                    color={subtitleColor}
                                    size="sm"
                                    position="absolute"
                                    top="3"
                                    right="3"
                                    aria-label="Yopish"
                                    disabled={isSaving}
                                >
                                    <X />
                                </Button>
                            </Dialog.CloseTrigger>

                            <Box as="form" onSubmit={saveReminder}>
                                <Dialog.Body py={6}>
                                    <VStack gap={5} align="stretch">
                                        <Field.Root required>
                                            <Field.Label color={textColor} fontWeight="medium">
                                                <HStack gap={2}>
                                                    <LuClock3 size={14} />
                                                    <span>To‘lov kutilayotgan sana</span>
                                                </HStack>
                                                <Field.RequiredIndicator />
                                            </Field.Label>
                                            <FormControl
                                                type="date"
                                                value={paymentDate}
                                                onChange={(event) => setPaymentDate(event.target.value)}
                                                disabled={isSaving}
                                                minH="48px"
                                                size="lg"
                                            />
                                            {paymentDate && (
                                                <Field.HelperText color={subtitleColor}>
                                                    {(() => {
                                                        const d = daysDiff(paymentDate);
                                                        if (d === null) return null;
                                                        if (d < 0) return `⚠ ${Math.abs(d)} kun oldin o‘tgan`;
                                                        if (d === 0) return '✓ Bugun';
                                                        return `${d} kundan keyin`;
                                                    })()}
                                                </Field.HelperText>
                                            )}
                                        </Field.Root>

                                        <Field.Root>
                                            <Field.Label color={textColor} fontWeight="medium">
                                                <HStack gap={2}>
                                                    <LuWallet size={14} />
                                                    <span>Kutilayotgan summa</span>
                                                </HStack>
                                            </Field.Label>
                                            <FormControl
                                                type="text"
                                                inputMode="numeric"
                                                value={price}
                                                onChange={(event) => setPrice(formatPriceInput(event.target.value))}
                                                placeholder="Masalan: 5 000 000"
                                                disabled={isSaving}
                                                minH="48px"
                                                size="lg"
                                            />
                                            <Field.HelperText color={subtitleColor}>
                                                Ixtiyoriy. Summasiz eslatma ham saqlash mumkin.
                                            </Field.HelperText>
                                        </Field.Root>

                                        <Field.Root>
                                            <Field.Label color={textColor} fontWeight="medium">
                                                <HStack gap={2}>
                                                    <LuStickyNote size={14} />
                                                    <span>Eslatma / izoh</span>
                                                </HStack>
                                            </Field.Label>
                                            <FormControl
                                                as="textarea"
                                                rows={4}
                                                value={note}
                                                onChange={(event) => setNote(event.target.value)}
                                                placeholder="Masalan: 5 000 000 so‘m olib kelishini aytdi"
                                                maxLength={500}
                                                disabled={isSaving}
                                                resize="vertical"
                                                minH="100px"
                                            />
                                 
                                        </Field.Root>
                                    </VStack>
                                </Dialog.Body>

                                <Dialog.Footer
                                    gap={3}
                                    pt={5}
                                    pb={6}
                                    borderTopWidth="1px"
                                    borderColor={modalBorder}
                                >
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
                                        _hover={{
                                            bg: isDark ? 'rgba(148,163,184,.16)' : 'gray.100',
                                            color: textColor,
                                        }}
                                    >
                                        Bekor qilish
                                    </Button>
                                    <Button
                                        type="submit"
                                        bg={accentColor}
                                        color="black"
                                        disabled={isSaving || !paymentDate}
                                        size="lg"
                                        px={8}
                                        borderRadius="xl"
                                        fontWeight="bold"
                                        _hover={{ bg: isDark ? '#EAB308' : '#F5B800', transform: 'scale(1.02)' }}
                                        _active={{ transform: 'scale(0.98)' }}
                                        _disabled={{ opacity: 0.6, cursor: 'not-allowed' }}
                                    >
                                        {isSaving ? (
                                            <HStack gap={2}>
                                                <Spinner size="sm" color="black" />
                                                <span>Saqlanmoqda...</span>
                                            </HStack>
                                        ) : (
                                            <HStack gap={2}>
                                                {editingReminder ? <CheckCircle2 size={18} /> : <Plus size={18} />}
                                                <span>{editingReminder ? 'Saqlash' : 'Qo‘shish'}</span>
                                            </HStack>
                                        )}
                                    </Button>
                                </Dialog.Footer>
                            </Box>
                        </Dialog.Content>
                    </Dialog.Positioner>
                </Portal>
            </Dialog.Root>

            {/* ═══ DELETE MODAL ═══ */}
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
                            <Box
                                position="absolute"
                                top="0" left="0" right="0"
                                h="4px"
                                bgGradient="linear(to-r, red.400, red.600)"
                            />

                            <Dialog.Header
                                color={textColor}
                                fontSize="xl"
                                fontWeight="bold"
                                pt={7}
                                pb={5}
                                borderBottomWidth="1px"
                                borderColor={modalBorder}
                            >
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
                                        <Text fontSize="xs" fontWeight="normal" color={subtitleColor}>
                                            Bu amalni qaytarib bo‘lmaydi
                                        </Text>
                                    </VStack>
                                </HStack>
                            </Dialog.Header>

                            <Dialog.CloseTrigger asChild>
                                <Button
                                    variant="ghost"
                                    color={subtitleColor}
                                    size="sm"
                                    position="absolute"
                                    top="3"
                                    right="3"
                                    aria-label="Yopish"
                                    disabled={isDeleting}
                                >
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
                                                    {formatDate(deletingReminder?.paymentDate)}
                                                </Text>
                                                {' '}sanasidagi eslatmani o‘chirmoqchimisiz?
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

                            <Dialog.Footer
                                gap={3}
                                pt={5}
                                pb={6}
                                borderTopWidth="1px"
                                borderColor={modalBorder}
                            >
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
                                    _hover={{
                                        bg: isDark ? 'rgba(148,163,184,.16)' : 'gray.100',
                                        color: textColor,
                                    }}
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
                                        <HStack gap={2}>
                                            <Spinner size="sm" />
                                            <span>O‘chirilmoqda...</span>
                                        </HStack>
                                    ) : (
                                        <HStack gap={2}>
                                            <Trash2 size={18} />
                                            <span>O‘chirish</span>
                                        </HStack>
                                    )}
                                </Button>
                            </Dialog.Footer>
                        </Dialog.Content>
                    </Dialog.Positioner>
                </Portal>
            </Dialog.Root>
        </Box>
    );
}

PaymentReminders.propTypes = {
    customerId: PropTypes.string.isRequired,
};