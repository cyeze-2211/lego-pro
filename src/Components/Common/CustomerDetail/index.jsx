import { useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Badge, Box, Button, HStack, Table, Text, Spinner, Portal, Dialog, VStack, SimpleGrid, IconButton } from '@chakra-ui/react';
import {
    LuCalendar, LuChevronLeft, LuChevronRight, LuClipboardList,
    LuPhone, LuUsers, LuWallet, LuCreditCard, LuTriangleAlert, LuX,
    LuBanknote, LuCircleX, LuMapPin, LuHash, LuUserCheck, LuSend,
    LuStickyNote, LuClock, LuTrendingUp, LuTrendingDown, LuCircleCheck,
    LuCircleAlert, LuCopy, LuExternalLink,
} from 'react-icons/lu';
import { useGetCustomerByIdQuery } from '../../../store/services/customer.api';
import { useGetSalesOrdersQuery, useApproveSalesOrderMutation, useRejectSalesOrderMutation } from '../../../store/services/salesOrder.api';
import { useGetPaymentsQuery, useCancelPaymentMutation } from '../../../store/services/payment.api';
import { formatNumber } from '../../ui/number-format';
import EntityDetail, { DetailSection, formatDetailDate } from '../EntityDetail';
import PaymentModal from '../Customer/__components/PaymentModal';
import { Alert } from '../../Other/UI/Alert/Alert';
import { useAppTheme } from '../../../theme/tokens';

const PAGE_SIZE = 10;

const ORDER_STATUS_FILTERS = [
    { value: '', label: 'Barchasi' },
    { value: 'PENDING', label: 'Kutilmoqda' },
    { value: 'APPROVED', label: 'Tasdiqlangan' },
    { value: 'REJECTED', label: 'Rad etilgan' },
];

const ORDER_STATUS_LABELS = {
    PENDING: 'Kutilmoqda',
    APPROVED: 'Tasdiqlangan',
    REJECTED: 'Rad etilgan',
};

const PAYMENT_STATUS_LABELS = {
    ACTIVE: 'Faol',
    CANCELLED: 'Bekor qilingan',
};

const TABS = [
    { value: 'orders', label: 'Buyurtmalar', icon: LuClipboardList },
    { value: 'payments', label: "To'lovlar", icon: LuCreditCard },
];

// ── Yordamchi: bosh harflar ───────────────────────────────────────────────
const getInitials = (name) => {
    if (!name) return '?';
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0]?.toUpperCase())
        .join('');
};

// ── Avatar ────────────────────────────────────────────────────────────────
function Avatar({ name, size = 64, accentColor, isDark }) {
    return (
        <Box
            w={`${size}px`}
            h={`${size}px`}
            minW={`${size}px`}
            borderRadius="2xl"
            bg={isDark ? 'rgba(148,163,184,0.10)' : 'gray.100'}
            borderWidth="1px"
            borderColor={isDark ? 'whiteAlpha.200' : 'gray.200'}
            color={accentColor}
            display="flex"
            alignItems="center"
            justifyContent="center"
            fontWeight="bold"
            fontSize={`${size * 0.34}px`}
            letterSpacing="tight"
            flexShrink={0}
            userSelect="none"
        >
            {getInitials(name)}
        </Box>
    );
}

// ── Info Cell — kartochka ichidagi ma'lumot ───────────────────────────────
function InfoCell({ icon: Icon, label, value, emptyText = '—', isDark, textColor, subtitleColor, accentColor, href, mono }) {
    const isEmpty = value === null || value === undefined || value === '';
    return (
        <HStack align="start" gap={3} p={3.5} borderRadius="xl" bg={isDark ? 'rgba(148,163,184,0.06)' : 'gray.50'} borderWidth="1px" borderColor={isDark ? 'whiteAlpha.100' : 'gray.100'} _hover={{ borderColor: isDark ? 'whiteAlpha.200' : 'gray.200' }} transition="all 0.15s">
            <Box
                p={2}
                borderRadius="lg"
                bg={isDark ? 'rgba(250, 204, 21, 0.10)' : '#FEF3C7'}
                color={accentColor}
                flexShrink={0}
                display="inline-flex"
                alignItems="center"
                justifyContent="center"
                w="34px"
                h="34px"
            >
                <Icon size={16} />
            </Box>
            <VStack align="start" gap={0.5} flex="1" minW={0}>
                <Text fontSize="10px" color={subtitleColor} fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">
                    {label}
                </Text>
                {isEmpty ? (
                    <Text fontSize="sm" color={subtitleColor} fontStyle="italic">{emptyText}</Text>
                ) : href ? (
                    <Text
                        as="a"
                        href={href}
                        fontSize="sm"
                        color={textColor}
                        fontWeight="medium"
                        wordBreak="break-word"
                        _hover={{ color: accentColor }}
                        transition="color 0.15s"
                    >
                        {value}
                    </Text>
                ) : (
                    <Text fontSize="sm" color={textColor} fontWeight="medium" wordBreak="break-word" fontFamily={mono ? 'mono' : 'inherit'}>
                        {value}
                    </Text>
                )}
            </VStack>
        </HStack>
    );
}

// ── Stat card — yuqoridagi statistika kartalari ───────────────────────────
function StatCard({ icon: Icon, label, value, suffix, tone = 'default', isDark, textColor, subtitleColor, accentColor }) {
    const tones = {
        default: {
            bg: isDark ? 'rgba(148,163,184,0.06)' : 'gray.50',
            iconBg: isDark ? 'rgba(148,163,184,0.12)' : 'gray.100',
            iconColor: subtitleColor,
            valueColor: textColor,
        },
        danger: {
            bg: isDark ? 'rgba(239,68,68,0.08)' : 'red.50',
            iconBg: isDark ? 'rgba(239,68,68,0.15)' : 'red.100',
            iconColor: isDark ? 'red.300' : 'red.600',
            valueColor: isDark ? 'red.300' : 'red.600',
        },
        success: {
            bg: isDark ? 'rgba(34,197,94,0.08)' : 'green.50',
            iconBg: isDark ? 'rgba(34,197,94,0.15)' : 'green.100',
            iconColor: isDark ? 'green.300' : 'green.700',
            valueColor: isDark ? 'green.300' : 'green.700',
        },
        accent: {
            bg: isDark ? 'rgba(250,204,21,0.08)' : '#FEFCE8',
            iconBg: isDark ? 'rgba(250,204,21,0.15)' : '#FEF3C7',
            iconColor: accentColor,
            valueColor: textColor,
        },
    };
    const t = tones[tone] || tones.default;

    return (
        <HStack
            align="center"
            gap={3}
            p={4}
            borderRadius="2xl"
            bg={t.bg}
            borderWidth="1px"
            borderColor={isDark ? 'whiteAlpha.100' : 'gray.100'}
            transition="all 0.2s"
            _hover={{ transform: 'translateY(-1px)', boxShadow: isDark ? '0 8px 20px rgba(0,0,0,0.25)' : '0 8px 20px rgba(15,23,42,0.06)' }}
        >
            <Box
                p={2.5}
                borderRadius="xl"
                bg={t.iconBg}
                color={t.iconColor}
                display="inline-flex"
                alignItems="center"
                justifyContent="center"
                flexShrink={0}
            >
                <Icon size={18} />
            </Box>
            <VStack align="start" gap={0} flex="1" minW={0}>
                <Text fontSize="10px" color={subtitleColor} fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">
                    {label}
                </Text>
                <HStack gap={1} align="baseline">
                    <Text fontSize="lg" fontWeight="bold" color={t.valueColor} lineHeight="1.2" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">
                        {value}
                    </Text>
                    {suffix && <Text fontSize="xs" color={subtitleColor} fontWeight="medium">{suffix}</Text>}
                </HStack>
            </VStack>
        </HStack>
    );
}

// ── To'lovni bekor qilish confirm dialogi ─────────────────────────────────
function CancelPaymentDialog({ open, onClose, onConfirm, isLoading, amount }) {
    const { isDark, cardBg, cardBorder, textColor, subtitleColor } = useAppTheme();
    return (
        <Dialog.Root open={open} onOpenChange={(e) => !e.open && onClose()} size="md" placement="center">
            <Portal>
                <Dialog.Backdrop backdropFilter="blur(8px)" bg={isDark ? 'blackAlpha.700' : 'blackAlpha.400'} />
                <Dialog.Positioner>
                    <Dialog.Content bg={cardBg} borderColor={cardBorder} borderWidth="1px" borderRadius="2xl" overflow="hidden" maxW="460px" w="calc(100% - 32px)" boxShadow="2xl">
                        <Box position="absolute" top="0" left="0" right="0" h="4px" bgGradient="linear(to-r, red.500, red.300)" />
                        <Dialog.Header color={textColor} fontSize="xl" fontWeight="bold" pt={7} pb={4} borderBottomWidth="1px" borderColor={cardBorder}>
                            <HStack gap={3}>
                                <Box p={3} borderRadius="xl" bg={isDark ? 'rgba(239,68,68,.15)' : 'red.50'} color="red.500">
                                    <LuTriangleAlert size={22} />
                                </Box>
                                <span>To&apos;lovni bekor qilish</span>
                            </HStack>
                        </Dialog.Header>
                        <Dialog.CloseTrigger asChild>
                            <Button variant="ghost" color={subtitleColor} size="sm" position="absolute" top="3" right="3" aria-label="Yopish"><LuX /></Button>
                        </Dialog.CloseTrigger>
                        <Dialog.Body py={5}>
                            <Box p={4} borderRadius="xl" bg={isDark ? 'rgba(239,68,68,.08)' : 'red.50'} borderWidth="1px" borderColor={isDark ? 'rgba(239,68,68,.2)' : 'red.200'}>
                                <HStack gap={3} align="start">
                                    <LuTriangleAlert size={18} color={isDark ? '#f87171' : '#dc2626'} style={{ flexShrink: 0, marginTop: 2 }} />
                                    <Text fontSize="sm" color={isDark ? 'red.300' : 'red.700'}>
                                        <strong>{formatNumber(amount ?? 0)} so&apos;m</strong> miqdoridagi to&apos;lovni bekor qilmoqchisiz.
                                        Pul kassadan chiqariladi, zayavkalar va mijoz balansi tiklanadi. Bu amalni qaytarib bo&apos;lmaydi.
                                    </Text>
                                </HStack>
                            </Box>
                        </Dialog.Body>
                        <Dialog.Footer gap={3} pt={4} pb={6} borderTopWidth="1px" borderColor={cardBorder}>
                            <Button variant="ghost" onClick={onClose} color={subtitleColor} borderRadius="xl">
                                <HStack gap={2}><LuX size={15} /><span>Yo&apos;q, qoldirish</span></HStack>
                            </Button>
                            <Button onClick={onConfirm} disabled={isLoading} bg="red.500" color="white" _hover={{ bg: 'red.600' }} borderRadius="xl" px={6}>
                                {isLoading
                                    ? <HStack gap={2}><Spinner size="sm" /><span>Bekor qilinmoqda...</span></HStack>
                                    : <HStack gap={2}><LuCircleX size={15} /><span>Ha, bekor qilish</span></HStack>
                                }
                            </Button>
                        </Dialog.Footer>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
}

// ── Status select ─────────────────────────────────────────────────────────
function OrderStatusSelect({ orderId, currentStatus, onApprove, onReject, isLoading, isDark }) {
    const styleMap = {
        PENDING: { bg: isDark ? 'rgba(250,204,21,.14)' : '#FEF3C7', color: isDark ? '#fde68a' : '#92400E', border: isDark ? '#ca8a04' : '#d97706' },
        APPROVED: { bg: isDark ? 'rgba(34,197,94,.14)' : '#DCFCE7', color: isDark ? '#86efac' : '#15803d', border: isDark ? '#16a34a' : '#16a34a' },
        REJECTED: { bg: isDark ? 'rgba(239,68,68,.14)' : '#FEE2E2', color: isDark ? '#fca5a5' : '#b91c1c', border: isDark ? '#dc2626' : '#dc2626' },
    };
    const style = styleMap[currentStatus] || styleMap.PENDING;

    if (currentStatus !== 'PENDING') {
        const Icon = currentStatus === 'APPROVED' ? LuCircleCheck : LuCircleX;
        return (
            <Badge borderRadius="full" px={2.5} py={1} bg={style.bg} color={style.color} whiteSpace="nowrap" fontSize="11px" fontWeight="semibold">
                <HStack gap={1.5} display="inline-flex"><Icon size={12} /><span>{ORDER_STATUS_LABELS[currentStatus] || currentStatus}</span></HStack>
            </Badge>
        );
    }

    if (isLoading) {
        return (
            <Badge borderRadius="full" px={3} py={1} bg={style.bg} color={style.color} whiteSpace="nowrap">
                <HStack gap={1} display="inline-flex"><Spinner size="xs" /><span>...</span></HStack>
            </Badge>
        );
    }

    return (
        <Box
            as="select"
            value="PENDING"
            onChange={(e) => {
                const val = e.target.value;
                if (val === 'APPROVED') onApprove(orderId);
                else if (val === 'REJECTED') onReject(orderId);
                e.target.value = 'PENDING';
            }}
            bg={style.bg}
            color={style.color}
            borderColor={style.border}
            borderWidth="1px"
            borderRadius="full"
            px={3}
            py={1}
            fontSize="11px"
            fontWeight="semibold"
            cursor="pointer"
            outline="none"
            _focus={{ outline: 'none', boxShadow: 'none' }}
        >
            <option value="PENDING">{ORDER_STATUS_LABELS.PENDING}</option>
            <option value="APPROVED">✓ Tasdiqlash</option>
            <option value="REJECTED">✗ Rad etish</option>
        </Box>
    );
}

// ── Empty state ───────────────────────────────────────────────────────────
function EmptyState({ icon: Icon, title, description, isDark, subtitleColor }) {
    return (
        <VStack py={12} gap={3}>
            <Box
                p={4}
                borderRadius="2xl"
                bg={isDark ? 'rgba(148,163,184,0.06)' : 'gray.50'}
                color={subtitleColor}
            >
                <Icon size={32} />
            </Box>
            <VStack gap={1}>
                <Text fontWeight="semibold" color={subtitleColor}>{title}</Text>
                {description && <Text fontSize="sm" color={subtitleColor} opacity={0.7}>{description}</Text>}
            </VStack>
        </VStack>
    );
}

// ── Section wrapper ───────────────────────────────────────────────────────
function Section({ title, subtitle, action, children, isDark, textColor, subtitleColor, cardBorder }) {
    return (
        <Box
            bg={isDark ? 'rgba(15,23,42,0.35)' : 'white'}
            borderWidth="1px"
            borderColor={cardBorder}
            borderRadius="2xl"
            overflow="hidden"
            boxShadow={isDark ? 'none' : '0 1px 3px rgba(15,23,42,0.04)'}
            gridColumn={{ base: 'auto', lg: '1 / -1' }}
        >
            {(title || action) && (
                <HStack justify="space-between" align="center" px={5} py={3.5} borderBottomWidth="1px" borderColor={cardBorder}>
                    <VStack align="start" gap={0}>
                        {title && <Text fontWeight="bold" fontSize="md" color={textColor}>{title}</Text>}
                        {subtitle && <Text fontSize="xs" color={subtitleColor}>{subtitle}</Text>}
                    </VStack>
                    {action}
                </HStack>
            )}
            <Box p={5}>{children}</Box>
        </Box>
    );
}

// ── Asosiy komponent ───────────────────────────────────────────────────────
export default function CustomerDetail() {
    const { id } = useParams();
    const { pathname } = useLocation();
    const backTo = pathname.startsWith('/kassir') ? '/kassir/customers' : '/customers';

    const [activeTab, setActiveTab] = useState('orders');
    const [orderStatus, setOrderStatus] = useState('');
    const [orderPage, setOrderPage] = useState(0);
    const [paymentPage, setPaymentPage] = useState(0);
    const [paymentModal, setPaymentModal] = useState({ open: false, order: null });
    const [cancelConfirm, setCancelConfirm] = useState({ open: false, paymentId: null, amount: 0 });
    const [actionId, setActionId] = useState(null);

    const { data: customer, isLoading, isError } = useGetCustomerByIdQuery(id, { skip: !id });

    const { data: orderResult, isFetching: ordersFetching } = useGetSalesOrdersQuery(
        { customerId: id, status: orderStatus || undefined, page: orderPage, size: PAGE_SIZE },
        { skip: !id }
    );

    const { data: paymentResult, isFetching: paymentsFetching } = useGetPaymentsQuery(
        { customerId: id, page: paymentPage, size: PAGE_SIZE },
        { skip: !id || activeTab !== 'payments' }
    );

    const orders = orderResult?.items || [];
    const totalOrderPages = orderResult?.pagination?.totalPages || 0;
    const totalOrders = orderResult?.pagination?.totalElements ?? 0;

    const payments = paymentResult?.items || [];
    const totalPaymentPages = paymentResult?.pagination?.totalPages || 0;
    const totalPayments = paymentResult?.pagination?.totalElements ?? 0;

    const [approveSalesOrder] = useApproveSalesOrderMutation();
    const [rejectSalesOrder] = useRejectSalesOrderMutation();
    const [cancelPayment, { isLoading: cancelling }] = useCancelPaymentMutation();

    const openGeneralPayment = () => setPaymentModal({ open: true, order: null });
    const openOrderPayment = (order) => setPaymentModal({ open: true, order });
    const closePayment = () => setPaymentModal({ open: false, order: null });

    const handleApprove = async (orderId) => {
        setActionId(orderId);
        try {
            await approveSalesOrder(orderId).unwrap();
            Alert('Buyurtma muvaffaqiyatli tasdiqlandi', 'success');
        } catch (err) {
            Alert(err?.data?.message || 'Tasdiqlashda xatolik', 'error');
        } finally { setActionId(null); }
    };

    const handleReject = async (orderId) => {
        setActionId(orderId);
        try {
            await rejectSalesOrder({ id: orderId }).unwrap();
            Alert('Buyurtma rad etildi', 'success');
        } catch (err) {
            Alert(err?.data?.message || 'Rad etishda xatolik', 'error');
        } finally { setActionId(null); }
    };

    const handleCancelPayment = async () => {
        try {
            await cancelPayment(cancelConfirm.paymentId).unwrap();
            Alert("To'lov bekor qilindi", 'success');
            setCancelConfirm({ open: false, paymentId: null, amount: 0 });
        } catch (err) {
            Alert(err?.data?.message || "Bekor qilishda xatolik", 'error');
        }
    };

    const copyId = () => {
        if (customer?.id) {
            navigator.clipboard.writeText(customer.id);
            Alert('ID nusxalandi', 'success');
        }
    };

    return (
        <EntityDetail
            payment="To'lov qilish"
            onPayment={openGeneralPayment}
            title={customer?.name || 'Mijoz'}
            icon={LuUsers}
            backTo={backTo}
            backLabel="Mijozlar"
            loading={isLoading}
            error={isError || !customer}
        >
            {({ isDark, textColor, subtitleColor, accentColor, cardBorder, cardBg }) => {
                const balanceValue = Number(customer.balance) || 0;
                const balanceTone = balanceValue < 0 ? 'danger' : balanceValue > 0 ? 'success' : 'default';
                const balanceLabel = balanceValue < 0 ? 'Qarzdor' : balanceValue > 0 ? 'Kredit' : 'Balans';

                return (
                    <>
                        {/* ══ HERO: Avatar + ism + asosiy info ══ */}
                        <Box
                            gridColumn={{ base: 'auto', lg: '1 / -1' }}
                            bg={isDark ? 'rgba(15,23,42,0.35)' : 'white'}
                            borderWidth="1px"
                            borderColor={cardBorder}
                            borderRadius="2xl"
                            overflow="hidden"
                            boxShadow={isDark ? 'none' : '0 1px 3px rgba(15,23,42,0.04)'}
                        >
                            {/* Banner */}
                            <Box
                                h="52px"
                                bgGradient={
                                    isDark
                                        ? 'linear(135deg, rgba(250,204,21,0.15) 0%, rgba(250,204,21,0.02) 100%)'
                                        : 'linear(135deg, #FEF3C7 0%, #FFFBEB 100%)'
                                }
                                borderColor={cardBorder}
                            />

                            {/* Avatar + info */}
                            <Box px={{ base: 5, md: 6 }} pb={5}>
                                <HStack align="flex-start" gap={4} mt="-38px" flexWrap={{ base: 'wrap', md: 'nowrap' }}>
                                    <Avatar name={customer.name} size={76} accentColor={accentColor} isDark={isDark} />

                                    <VStack align="start" gap={2} flex="1" minW={0} pt={{ base: 0, md: 10 }}>
                                        <HStack gap={2.5} flexWrap="wrap" align="center">
                                            <Text
                                                fontSize={{ base: 'xl', md: '2xl' }}
                                                fontWeight="bold"
                                                color={textColor}
                                                lineHeight="1.2"
                                                letterSpacing="-0.01em"
                                            >
                                                {customer.name}
                                            </Text>
                                            <Badge
                                                borderRadius="full"
                                                px={2.5}
                                                py={0.5}
                                                bg={isDark ? 'rgba(34,197,94,0.15)' : 'green.50'}
                                                color={isDark ? 'green.300' : 'green.700'}
                                                fontSize="10px"
                                                fontWeight="semibold"
                                                textTransform="uppercase"
                                                letterSpacing="wide"
                                                lineHeight="1.4"
                                            >
                                                Faol mijoz
                                            </Badge>
                                        </HStack>

                                        <HStack gap={4} flexWrap="wrap" color={subtitleColor} fontSize="sm" rowGap={1}>
                                            <HStack gap={1.5} align="center">
                                                <LuPhone size={13} style={{ flexShrink: 0 }} />
                                                <Text
                                                    as="a"
                                                    href={`tel:${customer.phone}`}
                                                    _hover={{ color: accentColor }}
                                                    transition="color 0.15s"
                                                    fontWeight="medium"
                                                >
                                                    {customer.phone}
                                                </Text>
                                            </HStack>
                                            {customer.address && (
                                                <HStack gap={1.5} align="center" minW={0}>
                                                    <LuMapPin size={13} style={{ flexShrink: 0 }} />
                                                    <Text noOfLines={1} fontWeight="medium">{customer.address}</Text>
                                                </HStack>
                                            )}
                                        </HStack>
                                    </VStack>
                                </HStack>
                            </Box>
                        </Box>

                        {/* ══ STATISTIKA KARTALARI ══ */}
                        <Box gridColumn={{ base: 'auto', lg: '1 / -1' }}>
                            <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={3}>
                                <StatCard
                                    icon={balanceValue < 0 ? LuTrendingDown : LuTrendingUp}
                                    label={balanceLabel}
                                    value={formatNumber(Math.abs(balanceValue))}
                                    suffix="so'm"
                                    tone={balanceTone}
                                    isDark={isDark}
                                    textColor={textColor}
                                    subtitleColor={subtitleColor}
                                    accentColor={accentColor}
                                />
                                <StatCard
                                    icon={LuClipboardList}
                                    label="Buyurtmalar"
                                    value={formatNumber(totalOrders)}
                                    suffix="ta"
                                    tone="accent"
                                    isDark={isDark}
                                    textColor={textColor}
                                    subtitleColor={subtitleColor}
                                    accentColor={accentColor}
                                />
                                <StatCard
                                    icon={LuCreditCard}
                                    label="To'lovlar"
                                    value={formatNumber(totalPayments)}
                                    suffix="ta"
                                    tone="default"
                                    isDark={isDark}
                                    textColor={textColor}
                                    subtitleColor={subtitleColor}
                                    accentColor={accentColor}
                                />
                                <StatCard
                                    icon={LuCalendar}
                                    label="Ro'yxatga olingan"
                                    value={formatDetailDate(customer.createdAt)?.split(',')[0] || '—'}
                                    tone="default"
                                    isDark={isDark}
                                    textColor={textColor}
                                    subtitleColor={subtitleColor}
                                    accentColor={accentColor}
                                />
                            </SimpleGrid>
                        </Box>

                        {/* ══ MIJOZ MA'LUMOTLARI ══ */}
                        <Section
                            title="Mijoz ma'lumotlari"
                            subtitle="Shaxsiy va aloqa ma'lumotlari"
                            isDark={isDark}
                            textColor={textColor}
                            subtitleColor={subtitleColor}
                            cardBorder={cardBorder}
                        >
                            <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
                                <InfoCell icon={LuUsers} label="To‘liq nomi" value={customer.name} isDark={isDark} textColor={textColor} subtitleColor={subtitleColor} accentColor={accentColor} />
                                <InfoCell icon={LuPhone} label="Telefon" value={customer.phone} href={`tel:${customer.phone}`} isDark={isDark} textColor={textColor} subtitleColor={subtitleColor} accentColor={accentColor} />
                                <InfoCell icon={LuHash} label="INN / STIR" value={customer.inn} emptyText="Kiritilmagan" mono isDark={isDark} textColor={textColor} subtitleColor={subtitleColor} accentColor={accentColor} />
                                <InfoCell icon={LuUserCheck} label="Agent" value={customer.agentName} emptyText="Biriktirilmagan" isDark={isDark} textColor={textColor} subtitleColor={subtitleColor} accentColor={accentColor} />
                                <InfoCell
                                    icon={LuSend}
                                    label="Telegram"
                                    value={customer.telegramChatId ? `Chat ID: ${customer.telegramChatId}` : null}
                                    emptyText="Ulanmagan"
                                    mono={!!customer.telegramChatId}
                                    isDark={isDark}
                                    textColor={textColor}
                                    subtitleColor={subtitleColor}
                                    accentColor={accentColor}
                                />
                                <InfoCell icon={LuCalendar} label="Yaratilgan" value={formatDetailDate(customer.createdAt)} isDark={isDark} textColor={textColor} subtitleColor={subtitleColor} accentColor={accentColor} />
                                <InfoCell icon={LuMapPin} label="Manzil" value={customer.address} emptyText="Kiritilmagan" isDark={isDark} textColor={textColor} subtitleColor={subtitleColor} accentColor={accentColor} />
                                <InfoCell icon={LuClock} label="Yangilangan" value={formatDetailDate(customer.lastModifiedAt)} isDark={isDark} textColor={textColor} subtitleColor={subtitleColor} accentColor={accentColor} />
                                <Box gridColumn={{ base: 'auto', md: 'span 2' }}>
                                    <InfoCell icon={LuStickyNote} label="Izoh" value={customer.summary} emptyText="Izoh yo‘q" isDark={isDark} textColor={textColor} subtitleColor={subtitleColor} accentColor={accentColor} />
                                </Box>

                            </SimpleGrid>
                        </Section>

                        {/* ══ BUYURTMALAR / TO'LOVLAR ══ */}
                        <Section
                            isDark={isDark}
                            textColor={textColor}
                            subtitleColor={subtitleColor}
                            cardBorder={cardBorder}
                        >
                            {/* Tabs */}
                            <HStack gap={1} mb={5} p={1} bg={isDark ? 'rgba(148,163,184,0.06)' : 'gray.100'} borderRadius="xl" w="fit-content">
                                {TABS.map((tab) => {
                                    const isActive = activeTab === tab.value;
                                    const Icon = tab.icon;
                                    return (
                                        <Button
                                            key={tab.value}
                                            size="sm"
                                            borderRadius="lg"
                                            px={5}
                                            h="36px"
                                            fontWeight="semibold"
                                            fontSize="sm"
                                            onClick={() => setActiveTab(tab.value)}
                                            bg={isActive ? (isDark ? 'rgba(250,204,21,0.15)' : 'white') : 'transparent'}
                                            color={isActive ? accentColor : subtitleColor}
                                            boxShadow={isActive && !isDark ? '0 1px 3px rgba(15,23,42,0.08)' : 'none'}
                                            _hover={{ bg: isActive ? (isDark ? 'rgba(250,204,21,0.18)' : 'white') : (isDark ? 'whiteAlpha.50' : 'whiteAlpha.700') }}
                                            transition="all 0.15s"
                                        >
                                            <HStack gap={2}><Icon size={14} /><span>{tab.label}</span></HStack>
                                        </Button>
                                    );
                                })}
                            </HStack>

                            {/* ══ BUYURTMALAR ══ */}
                            {activeTab === 'orders' && (
                                <>
                                    <HStack gap={1.5} flexWrap="wrap" mb={4}>
                                        {ORDER_STATUS_FILTERS.map((option) => {
                                            const isActive = orderStatus === option.value;
                                            return (
                                                <Button
                                                    key={option.value || 'all'}
                                                    size="sm"
                                                    borderRadius="full"
                                                    px={4}
                                                    h="30px"
                                                    fontSize="xs"
                                                    fontWeight="semibold"
                                                    onClick={() => { setOrderStatus(option.value); setOrderPage(0); }}
                                                    bg={isActive ? accentColor : 'transparent'}
                                                    color={isActive ? 'black' : subtitleColor}
                                                    borderWidth="1px"
                                                    borderColor={isActive ? accentColor : cardBorder}
                                                    _hover={{ bg: isActive ? accentColor : (isDark ? 'whiteAlpha.100' : 'gray.50') }}
                                                    transition="all 0.15s"
                                                >
                                                    {option.label}
                                                </Button>
                                            );
                                        })}
                                    </HStack>

                                    {ordersFetching ? (
                                        <VStack py={12} gap={3}>
                                            <Spinner size="md" color={accentColor} thickness="3px" />
                                            <Text color={subtitleColor} fontSize="sm">Yuklanmoqda...</Text>
                                        </VStack>
                                    ) : orders.length === 0 ? (
                                        <EmptyState
                                            icon={LuClipboardList}
                                            title={orderStatus ? 'Bu holatdagi buyurtmalar topilmadi' : "Hozircha buyurtmalar yo'q"}
                                            description={orderStatus ? 'Boshqa holatni tanlab ko‘ring' : 'Yangi buyurtma yaratilganda bu yerda ko‘rinadi'}
                                            isDark={isDark}
                                            subtitleColor={subtitleColor}
                                        />
                                    ) : (
                                        <>
                                            <Box overflowX="auto" borderWidth="1px" borderColor={cardBorder} borderRadius="xl">
                                                <Table.Root size="sm" bg={isDark ? 'transparent' : 'white'} borderCollapse="collapse">
                                                    <Table.Header bg={isDark ? 'rgba(148,163,184,0.06)' : 'gray.50'}>
                                                        <Table.Row>
                                                            <Table.ColumnHeader color={subtitleColor} w="50px" textAlign="center" fontSize="11px" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">№</Table.ColumnHeader>
                                                            <Table.ColumnHeader color={subtitleColor} fontSize="11px" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">Mahsulotlar</Table.ColumnHeader>
                                                            <Table.ColumnHeader color={subtitleColor} fontSize="11px" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">Izoh</Table.ColumnHeader>
                                                            <Table.ColumnHeader color={subtitleColor} textAlign="right" fontSize="11px" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">Summa</Table.ColumnHeader>
                                                            <Table.ColumnHeader color={subtitleColor} textAlign="right" fontSize="11px" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">Qarz</Table.ColumnHeader>
                                                            <Table.ColumnHeader color={subtitleColor} fontSize="11px" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">Holati</Table.ColumnHeader>
                                                            <Table.ColumnHeader color={subtitleColor} fontSize="11px" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">Sana</Table.ColumnHeader>
                                                            <Table.ColumnHeader color={subtitleColor} textAlign="center" fontSize="11px" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">Amal</Table.ColumnHeader>
                                                        </Table.Row>
                                                    </Table.Header>
                                                    <Table.Body>
                                                        {orders.map((order, index) => (
                                                            <Table.Row key={order.id} _hover={{ bg: isDark ? 'rgba(250,204,21,.04)' : '#FFFBEB' }} transition="background 0.15s">
                                                                <Table.Cell color={subtitleColor} textAlign="center" fontSize="sm">{orderPage * PAGE_SIZE + index + 1}</Table.Cell>
                                                                <Table.Cell color={textColor} fontWeight="semibold" fontSize="sm" whiteSpace="nowrap">{order.items?.length ?? 0} ta</Table.Cell>
                                                                <Table.Cell color={subtitleColor} fontSize="sm" maxW="200px">{order.summary || '—'}</Table.Cell>
                                                                <Table.Cell color={textColor} fontWeight="bold" fontSize="sm" textAlign="right" whiteSpace="nowrap">
                                                                    {formatNumber(order.totalAmount ?? 0)} <Text as="span" fontSize="xs" color={subtitleColor}>so&apos;m</Text>
                                                                </Table.Cell>
                                                                <Table.Cell textAlign="right" whiteSpace="nowrap">
                                                                    <Text
                                                                        color={(order.remainingDebt ?? 0) > 0 ? (isDark ? 'red.300' : 'red.600') : subtitleColor}
                                                                        fontWeight={(order.remainingDebt ?? 0) > 0 ? 'bold' : 'normal'}
                                                                        fontSize="sm"
                                                                    >
                                                                        {formatNumber(order.remainingDebt ?? 0)}
                                                                    </Text>
                                                                </Table.Cell>
                                                                <Table.Cell>
                                                                    <OrderStatusSelect
                                                                        orderId={order.id}
                                                                        currentStatus={order.status}
                                                                        onApprove={handleApprove}
                                                                        onReject={handleReject}
                                                                        isLoading={actionId === order.id}
                                                                        isDark={isDark}
                                                                    />
                                                                </Table.Cell>
                                                                <Table.Cell color={subtitleColor} fontSize="sm" whiteSpace="nowrap">{formatDetailDate(order.createdAt)}</Table.Cell>
                                                                <Table.Cell textAlign="center">
                                                                    <Button
                                                                        size="xs"
                                                                        height="30px"
                                                                        borderRadius="lg"
                                                                        px={3}
                                                                        gap={1.5}
                                                                        fontSize="xs"
                                                                        fontWeight="semibold"
                                                                        bg={order.status === 'APPROVED' ? accentColor : (isDark ? 'whiteAlpha.100' : 'gray.100')}
                                                                        color={order.status === 'APPROVED' ? 'black' : subtitleColor}
                                                                        cursor={order.status === 'APPROVED' ? 'pointer' : 'not-allowed'}
                                                                        opacity={order.status === 'APPROVED' ? 1 : 0.5}
                                                                        _hover={order.status === 'APPROVED' ? { opacity: 0.9, transform: 'translateY(-1px)' } : {}}
                                                                        transition="all 0.15s"
                                                                        onClick={() => order.status === 'APPROVED' && openOrderPayment(order)}
                                                                        title={order.status !== 'APPROVED' ? "Avval buyurtmani tasdiqlang" : "To'lov qilish"}
                                                                    >
                                                                        <LuBanknote size={13} />
                                                                        <span>To&apos;lov</span>
                                                                    </Button>
                                                                </Table.Cell>
                                                            </Table.Row>
                                                        ))}
                                                    </Table.Body>
                                                </Table.Root>
                                            </Box>
                                            <HStack justify="space-between" mt={4} flexWrap="wrap" gap={3}>
                                                <Text color={subtitleColor} fontSize="sm">
                                                    Jami: <Text as="span" fontWeight="bold" color={textColor}>{formatNumber(totalOrders)}</Text> ta buyurtma
                                                </Text>
                                                {totalOrderPages > 1 && (
                                                    <HStack gap={2}>
                                                        <Button size="sm" variant="outline" borderRadius="lg" disabled={orderPage === 0} onClick={() => setOrderPage((v) => v - 1)}><LuChevronLeft size={14} /></Button>
                                                        <Text color={subtitleColor} fontSize="sm" fontWeight="medium" px={2}>{orderPage + 1} / {totalOrderPages}</Text>
                                                        <Button size="sm" variant="outline" borderRadius="lg" disabled={orderPage >= totalOrderPages - 1} onClick={() => setOrderPage((v) => v + 1)}><LuChevronRight size={14} /></Button>
                                                    </HStack>
                                                )}
                                            </HStack>
                                        </>
                                    )}
                                </>
                            )}

                            {/* ══ TO'LOVLAR ══ */}
                            {activeTab === 'payments' && (
                                <>
                                    {paymentsFetching ? (
                                        <VStack py={12} gap={3}>
                                            <Spinner size="md" color={accentColor} thickness="3px" />
                                            <Text color={subtitleColor} fontSize="sm">Yuklanmoqda...</Text>
                                        </VStack>
                                    ) : payments.length === 0 ? (
                                        <EmptyState
                                            icon={LuCreditCard}
                                            title="Hozircha to'lovlar yo'q"
                                            description="To'lov qilinganda bu yerda tarix paydo bo'ladi"
                                            isDark={isDark}
                                            subtitleColor={subtitleColor}
                                        />
                                    ) : (
                                        <>
                                            <Box overflowX="auto" borderWidth="1px" borderColor={cardBorder} borderRadius="xl">
                                                <Table.Root size="sm" bg={isDark ? 'transparent' : 'white'} borderCollapse="collapse">
                                                    <Table.Header bg={isDark ? 'rgba(148,163,184,0.06)' : 'gray.50'}>
                                                        <Table.Row>
                                                            <Table.ColumnHeader color={subtitleColor} w="50px" textAlign="center" fontSize="11px" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">№</Table.ColumnHeader>
                                                            <Table.ColumnHeader color={subtitleColor} fontSize="11px" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">Kassa</Table.ColumnHeader>
                                                            <Table.ColumnHeader color={subtitleColor} textAlign="right" fontSize="11px" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">Summa</Table.ColumnHeader>
                                                            <Table.ColumnHeader color={subtitleColor} textAlign="right" fontSize="11px" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">Taqsimlangan</Table.ColumnHeader>
                                                            <Table.ColumnHeader color={subtitleColor} textAlign="right" fontSize="11px" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">Avans</Table.ColumnHeader>
                                                            <Table.ColumnHeader color={subtitleColor} fontSize="11px" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">Holati</Table.ColumnHeader>
                                                            <Table.ColumnHeader color={subtitleColor} fontSize="11px" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">Izoh</Table.ColumnHeader>
                                                            <Table.ColumnHeader color={subtitleColor} fontSize="11px" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">Sana</Table.ColumnHeader>
                                                            <Table.ColumnHeader color={subtitleColor} textAlign="center" fontSize="11px" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">Amal</Table.ColumnHeader>
                                                        </Table.Row>
                                                    </Table.Header>
                                                    <Table.Body>
                                                        {payments.map((payment, index) => (
                                                            <Table.Row
                                                                key={payment.id}
                                                                opacity={payment.status === 'CANCELLED' ? 0.5 : 1}
                                                                _hover={{ bg: isDark ? 'rgba(250,204,21,.04)' : '#FFFBEB' }}
                                                                transition="background 0.15s"
                                                            >
                                                                <Table.Cell color={subtitleColor} textAlign="center" fontSize="sm">{paymentPage * PAGE_SIZE + index + 1}</Table.Cell>
                                                                <Table.Cell color={textColor} fontSize="sm" whiteSpace="nowrap" fontWeight="medium">{payment.cashboxName}</Table.Cell>
                                                                <Table.Cell color={textColor} fontWeight="bold" fontSize="sm" textAlign="right" whiteSpace="nowrap">
                                                                    {formatNumber(payment.amount ?? 0)} <Text as="span" fontSize="xs" color={subtitleColor}>so&apos;m</Text>
                                                                </Table.Cell>
                                                                <Table.Cell color={subtitleColor} fontSize="sm" textAlign="right" whiteSpace="nowrap">
                                                                    {formatNumber(payment.allocatedAmount ?? 0)}
                                                                </Table.Cell>
                                                                <Table.Cell textAlign="right" whiteSpace="nowrap">
                                                                    <Text
                                                                        color={(payment.unallocatedAmount ?? 0) > 0 ? (isDark ? 'green.300' : 'green.600') : subtitleColor}
                                                                        fontWeight={(payment.unallocatedAmount ?? 0) > 0 ? 'bold' : 'normal'}
                                                                        fontSize="sm"
                                                                    >
                                                                        {formatNumber(payment.unallocatedAmount ?? 0)}
                                                                    </Text>
                                                                </Table.Cell>
                                                                <Table.Cell>
                                                                    <Badge
                                                                        borderRadius="full"
                                                                        px={2.5}
                                                                        py={1}
                                                                        fontSize="11px"
                                                                        fontWeight="semibold"
                                                                        bg={payment.status === 'ACTIVE'
                                                                            ? (isDark ? 'rgba(34,197,94,.14)' : '#DCFCE7')
                                                                            : (isDark ? 'rgba(239,68,68,.14)' : '#FEE2E2')}
                                                                        color={payment.status === 'ACTIVE'
                                                                            ? (isDark ? 'green.300' : 'green.700')
                                                                            : (isDark ? 'red.300' : 'red.700')}
                                                                        whiteSpace="nowrap"
                                                                    >
                                                                        {PAYMENT_STATUS_LABELS[payment.status] || payment.status}
                                                                    </Badge>
                                                                </Table.Cell>
                                                                <Table.Cell color={subtitleColor} fontSize="sm" maxW="160px">{payment.summary || '—'}</Table.Cell>
                                                                <Table.Cell color={subtitleColor} fontSize="sm" whiteSpace="nowrap">{payment.paidAt}</Table.Cell>
                                                                <Table.Cell textAlign="center">
                                                                    {payment.status === 'ACTIVE' ? (
                                                                        <Button
                                                                            size="xs"
                                                                            height="28px"
                                                                            borderRadius="lg"
                                                                            px={3}
                                                                            gap={1.5}
                                                                            fontSize="xs"
                                                                            fontWeight="semibold"
                                                                            bg={isDark ? 'rgba(239,68,68,.15)' : 'red.50'}
                                                                            color={isDark ? 'red.300' : 'red.600'}
                                                                            borderWidth="1px"
                                                                            borderColor={isDark ? 'rgba(239,68,68,.3)' : 'red.200'}
                                                                            _hover={{ bg: isDark ? 'rgba(239,68,68,.25)' : 'red.100' }}
                                                                            onClick={() => setCancelConfirm({ open: true, paymentId: payment.id, amount: payment.amount })}
                                                                            transition="all 0.15s"
                                                                        >
                                                                            <LuCircleX size={12} />
                                                                            <span>Bekor</span>
                                                                        </Button>
                                                                    ) : (
                                                                        <Text fontSize="xs" color={subtitleColor}>—</Text>
                                                                    )}
                                                                </Table.Cell>
                                                            </Table.Row>
                                                        ))}
                                                    </Table.Body>
                                                </Table.Root>
                                            </Box>
                                            <HStack justify="space-between" mt={4} flexWrap="wrap" gap={3}>
                                                <Text color={subtitleColor} fontSize="sm">
                                                    Jami: <Text as="span" fontWeight="bold" color={textColor}>{formatNumber(totalPayments)}</Text> ta to&apos;lov
                                                </Text>
                                                {totalPaymentPages > 1 && (
                                                    <HStack gap={2}>
                                                        <Button size="sm" variant="outline" borderRadius="lg" disabled={paymentPage === 0} onClick={() => setPaymentPage((v) => v - 1)}><LuChevronLeft size={14} /></Button>
                                                        <Text color={subtitleColor} fontSize="sm" fontWeight="medium" px={2}>{paymentPage + 1} / {totalPaymentPages}</Text>
                                                        <Button size="sm" variant="outline" borderRadius="lg" disabled={paymentPage >= totalPaymentPages - 1} onClick={() => setPaymentPage((v) => v + 1)}><LuChevronRight size={14} /></Button>
                                                    </HStack>
                                                )}
                                            </HStack>
                                        </>
                                    )}
                                </>
                            )}
                        </Section>

                        {/* ── Modals ── */}
                        <PaymentModal
                            open={paymentModal.open}
                            onClose={closePayment}
                            customerId={id}
                            order={paymentModal.order}
                        />
                        <CancelPaymentDialog
                            open={cancelConfirm.open}
                            onClose={() => setCancelConfirm({ open: false, paymentId: null, amount: 0 })}
                            onConfirm={handleCancelPayment}
                            isLoading={cancelling}
                            amount={cancelConfirm.amount}
                        />
                    </>
                );
            }}
        </EntityDetail>
    );
}