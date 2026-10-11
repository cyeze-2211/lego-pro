import { useState } from 'react';
import PropTypes from 'prop-types';
import { useParams, useLocation, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
    Badge, Box, Button, Dialog, HStack, Heading, Portal, SimpleGrid, Spinner, Table, Text, VStack,
} from '@chakra-ui/react';
import {
    LuArrowLeft, LuBanknote, LuCalendar, LuChevronLeft, LuChevronRight, LuCircleAlert,
    LuCircleCheck, LuCircleX, LuClipboardList, LuClock3, LuCopy, LuCreditCard, LuExternalLink,
    LuHash, LuMapPin, LuPen, LuPhone, LuScale, LuSend, LuStickyNote, LuTriangleAlert,
    LuTruck, LuUndo2, LuUserCheck, LuUsers, LuWallet, LuX,
} from 'react-icons/lu';
import { useGetCustomerByIdQuery } from '../../../store/services/customer.api';
import { useGetSalesOrdersQuery, useRejectSalesOrderMutation } from '../../../store/services/salesOrder.api';
import { useGetPaymentsQuery, useCancelPaymentMutation } from '../../../store/services/payment.api';
import { ROLES } from '../../../app/permissions/roles';
import { useAppSelector } from '../../../store/hooks';
import { useAppTheme } from '../../../theme/tokens';
import { formatNumber } from '../../ui/number-format';
import Loading from '../../Other/UI/Loadings/Loading';
import { Alert } from '../../Other/UI/Alert/Alert';
import { formatDetailDate } from '../EntityDetail';
import { STATUS_LABEL } from '../../Zayavkachi/__components/statusBadge';
import { CurrencyNote } from '../../ui/CurrencyAmountField';
import PaymentModal from '../Customer/__components/PaymentModal';
import Edit from '../Customer/__components/Edit';

const PAGE_SIZE = 10;

const ORDER_STATUS_FILTERS = [
    { value: '', label: 'Barchasi' },
    { value: 'CREATED', label: STATUS_LABEL.CREATED },
    { value: 'LOADED', label: STATUS_LABEL.LOADED },
    { value: 'CONFIRMED', label: STATUS_LABEL.CONFIRMED },
    { value: 'REJECTED', label: STATUS_LABEL.REJECTED },
    { value: 'RETURNED', label: STATUS_LABEL.RETURNED },
];

const ORDER_STATUS_META = {
    CREATED: { label: STATUS_LABEL.CREATED, icon: LuClock3, tone: 'amber' },
    LOADED: { label: STATUS_LABEL.LOADED, icon: LuTruck, tone: 'violet' },
    CONFIRMED: { label: STATUS_LABEL.CONFIRMED, icon: LuCircleCheck, tone: 'green' },
    REJECTED: { label: STATUS_LABEL.REJECTED, icon: LuCircleX, tone: 'red' },
    RETURNED: { label: STATUS_LABEL.RETURNED, icon: LuUndo2, tone: 'orange' },
};

const TONES = (isDark) => ({
    amber: { bg: isDark ? 'rgba(250,204,21,.14)' : '#FEF3C7', color: isDark ? '#FDE68A' : '#92400E', border: isDark ? 'rgba(250,204,21,.35)' : '#FDE68A' },
    green: { bg: isDark ? 'rgba(34,197,94,.14)' : '#DCFCE7', color: isDark ? '#86EFAC' : '#15803D', border: isDark ? 'rgba(34,197,94,.35)' : '#BBF7D0' },
    red: { bg: isDark ? 'rgba(239,68,68,.14)' : '#FEE2E2', color: isDark ? '#FCA5A5' : '#B91C1C', border: isDark ? 'rgba(239,68,68,.35)' : '#FECACA' },
    gray: { bg: isDark ? 'rgba(148,163,184,.12)' : '#F1F5F9', color: isDark ? '#E2E8F0' : '#334155', border: isDark ? 'rgba(148,163,184,.3)' : '#E2E8F0' },
    sky: { bg: isDark ? 'rgba(14,165,233,.12)' : '#E0F2FE', color: isDark ? '#7DD3FC' : '#0284C7', border: isDark ? 'rgba(14,165,233,.3)' : '#BAE6FD' },
    violet: { bg: isDark ? 'rgba(139,92,246,.12)' : '#EDE9FE', color: isDark ? '#C4B5FD' : '#7C3AED', border: isDark ? 'rgba(139,92,246,.3)' : '#DDD6FE' },
    orange: { bg: isDark ? 'rgba(249,115,22,.14)' : '#FFEDD5', color: isDark ? '#FDBA74' : '#C2410C', border: isDark ? 'rgba(249,115,22,.35)' : '#FED7AA' },
});

/* ── Yordamchilar ──────────────────────────────────────────────────────── */
const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]?.toUpperCase()).join('');
};

function formatDateOnly(value) {
    if (!value) return '—';
    const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value);
    return Number.isNaN(date.getTime())
        ? String(value)
        : date.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getBalanceMeta(balance) {
    if (balance < 0) {
        return {
            tone: 'red',
            label: 'Qarzdor',
            title: 'Mijoz bizga qarzdor',
            hint: 'Tasdiqlangan buyurtmalar bo‘yicha to‘lanmagan summa. To‘lov qabul qilib qarzni yoping.',
        };
    }
    if (balance > 0) {
        return {
            tone: 'green',
            label: 'Avans',
            title: 'Mijozda avans bor',
            hint: 'Mijoz oldindan to‘lab qo‘ygan. Keyingi buyurtmalar shu summadan avtomatik yopiladi.',
        };
    }
    return {
        tone: 'gray',
        label: 'Hisob tenglashgan',
        title: 'Qarz ham, avans ham yo‘q',
        hint: 'Barcha buyurtmalar to‘liq to‘langan.',
    };
}

/* ── Kichik UI bloklari ────────────────────────────────────────────────── */
function Pill({ tone = 'gray', icon: Icon, children }) {
    const { isDark } = useAppTheme();
    const t = TONES(isDark)[tone];
    return (
        <Badge borderRadius="full" px={2.5} py={1} fontSize="11px" fontWeight="semibold" bg={t.bg} color={t.color} borderWidth="1px" borderColor={t.border} whiteSpace="nowrap">
            <HStack gap={1.5} display="inline-flex">{Icon && <Icon size={12} />}<span>{children}</span></HStack>
        </Badge>
    );
}
Pill.propTypes = { tone: PropTypes.string, icon: PropTypes.elementType, children: PropTypes.node };

function Card({ children, ...props }) {
    const { isDark, cardBg, cardBorder } = useAppTheme();
    return (
        <Box bg={cardBg} borderWidth="1px" borderColor={cardBorder} borderRadius="2xl" overflow="hidden" boxShadow={isDark ? '0 12px 30px rgba(0,0,0,.16)' : '0 8px 22px rgba(15,23,42,.06)'} {...props}>
            {children}
        </Box>
    );
}
Card.propTypes = { children: PropTypes.node };

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
StatCard.propTypes = {
    icon: PropTypes.elementType.isRequired, label: PropTypes.string.isRequired, value: PropTypes.node.isRequired,
    sub: PropTypes.node, tone: PropTypes.string, valueTone: PropTypes.bool,
};

function InfoCard({ icon: Icon, title, children }) {
    const { cardBorder, textColor, accentColor } = useAppTheme();
    return (
        <Card>
            <HStack gap={2} px={{ base: 4, md: 5 }} py={3.5} borderBottomWidth="1px" borderColor={cardBorder}>
                <Icon size={17} color={accentColor} />
                <Heading size="sm" color={textColor}>{title}</Heading>
            </HStack>
            <VStack align="stretch" gap={0} css={{ '& > * + *': { borderTopWidth: '1px', borderTopColor: cardBorder } }}>
                {children}
            </VStack>
        </Card>
    );
}
InfoCard.propTypes = { icon: PropTypes.elementType.isRequired, title: PropTypes.string.isRequired, children: PropTypes.node };

function InfoRow({ icon: Icon, label, value, mono = false, href, emptyText = 'Ko‘rsatilmagan', action }) {
    const { textColor, subtitleColor, accentColor } = useAppTheme();
    const empty = value === null || value === undefined || value === '';
    return (
        <HStack gap={3} px={{ base: 4, md: 5 }} py={3} align="start">
            <Box color={subtitleColor} mt="2px" flexShrink={0}><Icon size={15} /></Box>
            <Box minW={0} flex={1}>
                <Text fontSize="xs" color={subtitleColor} fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">{label}</Text>
                {empty ? (
                    <Text color={subtitleColor} fontSize="sm" mt={0.5}>{emptyText}</Text>
                ) : href ? (
                    <Text as="a" href={href} display="block" color={accentColor} fontWeight="semibold" fontSize="sm" mt={0.5} _hover={{ textDecoration: 'underline' }}>{value}</Text>
                ) : (
                    <Text color={textColor} fontWeight="medium" fontSize="sm" mt={0.5} fontFamily={mono ? 'mono' : undefined} whiteSpace="pre-wrap" wordBreak="break-word">{value}</Text>
                )}
            </Box>
            {action}
        </HStack>
    );
}
InfoRow.propTypes = {
    icon: PropTypes.elementType.isRequired, label: PropTypes.string.isRequired, value: PropTypes.node,
    mono: PropTypes.bool, href: PropTypes.string, emptyText: PropTypes.string, action: PropTypes.node,
};

function EmptyState({ icon: Icon, title, description }) {
    const { isDark, textColor, subtitleColor } = useAppTheme();
    return (
        <VStack py={12} gap={3}>
            <Box p={4} borderRadius="2xl" bg={isDark ? 'rgba(148,163,184,0.06)' : 'gray.50'} color={subtitleColor}><Icon size={28} /></Box>
            <VStack gap={1}>
                <Text fontWeight="semibold" color={textColor}>{title}</Text>
                {description && <Text fontSize="sm" color={subtitleColor} textAlign="center">{description}</Text>}
            </VStack>
        </VStack>
    );
}
EmptyState.propTypes = { icon: PropTypes.elementType.isRequired, title: PropTypes.string.isRequired, description: PropTypes.string };

function Pagination({ page, totalPages, total, unit, onChange }) {
    const { textColor, subtitleColor } = useAppTheme();
    return (
        <HStack justify="space-between" mt={4} flexWrap="wrap" gap={3}>
            <Text color={subtitleColor} fontSize="sm">Jami: <Text as="span" fontWeight="bold" color={textColor}>{formatNumber(total)}</Text> {unit}</Text>
            {totalPages > 1 && (
                <HStack gap={2}>
                    <Button size="sm" variant="outline" borderRadius="lg" w="34px" h="34px" p={0} minW={0} disabled={page === 0} onClick={() => onChange(page - 1)} aria-label="Oldingi sahifa"><LuChevronLeft size={14} /></Button>
                    <Text color={subtitleColor} fontSize="sm" fontWeight="medium" px={2}>{page + 1} / {totalPages}</Text>
                    <Button size="sm" variant="outline" borderRadius="lg" w="34px" h="34px" p={0} minW={0} disabled={page >= totalPages - 1} onClick={() => onChange(page + 1)} aria-label="Keyingi sahifa"><LuChevronRight size={14} /></Button>
                </HStack>
            )}
        </HStack>
    );
}
Pagination.propTypes = {
    page: PropTypes.number.isRequired, totalPages: PropTypes.number.isRequired, total: PropTypes.number.isRequired,
    unit: PropTypes.string.isRequired, onChange: PropTypes.func.isRequired,
};

/* ── Tasdiqlash dialoglari ─────────────────────────────────────────────── */
function ConfirmDialog({ open, onClose, onConfirm, isLoading, title, body, confirmLabel, loadingLabel, tone = 'red', icon: Icon = LuTriangleAlert }) {
    const { isDark, cardBg, cardBorder, textColor, subtitleColor } = useAppTheme();
    const t = TONES(isDark)[tone];
    const solid = tone === 'red' ? 'red.500' : tone === 'green' ? 'green.600' : 'gray.600';
    const solidHover = tone === 'red' ? 'red.600' : tone === 'green' ? 'green.700' : 'gray.700';
    return (
        <Dialog.Root open={open} onOpenChange={(e) => !e.open && onClose()} size="md" placement="center">
            <Portal>
                <Dialog.Backdrop backdropFilter="blur(8px)" bg={isDark ? 'blackAlpha.700' : 'blackAlpha.400'} />
                <Dialog.Positioner>
                    <Dialog.Content bg={cardBg} borderColor={cardBorder} borderWidth="1px" borderRadius="2xl" overflow="hidden" maxW="460px" w="calc(100% - 32px)" boxShadow="2xl">
                        <Box position="absolute" top="0" left="0" right="0" h="4px" bg={t.color} />
                        <Dialog.Header color={textColor} fontSize="xl" fontWeight="bold" pt={7} pb={4} borderBottomWidth="1px" borderColor={cardBorder}>
                            <HStack gap={3}>
                                <Box p={3} borderRadius="xl" bg={t.bg} color={t.color}><Icon size={22} /></Box>
                                <span>{title}</span>
                            </HStack>
                        </Dialog.Header>
                        <Dialog.CloseTrigger asChild>
                            <Button variant="ghost" color={subtitleColor} size="sm" w="32px" h="32px" p={0} minW={0} position="absolute" top="3" right="3" aria-label="Yopish"><LuX /></Button>
                        </Dialog.CloseTrigger>
                        <Dialog.Body py={5}>
                            <Box p={4} borderRadius="xl" bg={t.bg} borderWidth="1px" borderColor={t.border}>
                                <Text fontSize="sm" color={textColor}>{body}</Text>
                            </Box>
                        </Dialog.Body>
                        <Dialog.Footer gap={3} pt={4} pb={6} borderTopWidth="1px" borderColor={cardBorder}>
                            <Button variant="ghost" onClick={onClose} color={subtitleColor} borderRadius="xl" h="40px" px={4}>Ortga</Button>
                            <Button onClick={onConfirm} disabled={isLoading} bg={solid} color="white" _hover={{ bg: solidHover }} borderRadius="xl" h="40px" px={6}>
                                {isLoading ? <HStack gap={2}><Spinner size="sm" /><span>{loadingLabel}</span></HStack> : confirmLabel}
                            </Button>
                        </Dialog.Footer>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
}
ConfirmDialog.propTypes = {
    open: PropTypes.bool.isRequired, onClose: PropTypes.func.isRequired, onConfirm: PropTypes.func.isRequired,
    isLoading: PropTypes.bool, title: PropTypes.string.isRequired, body: PropTypes.node.isRequired,
    confirmLabel: PropTypes.string.isRequired, loadingLabel: PropTypes.string.isRequired, tone: PropTypes.string, icon: PropTypes.elementType,
};

/* ── Sahifa ────────────────────────────────────────────────────────────── */
export default function CustomerDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const role = useAppSelector((state) => state.auth.role);

    const isKassirPath = pathname.startsWith('/kassir');
    const backTo = isKassirPath ? '/kassir/customers' : '/customers';
    // Kassirda buyurtmalar bo‘limi yo‘q, shuning uchun unga buyurtma sahifasiga havola ko‘rsatilmaydi
    const ordersBase = isKassirPath ? null : role === ROLES.BUXGALTER ? '/zayavkachi/orders' : '/orders';
    const canEdit = role === ROLES.MANAGER || role === ROLES.KASSIR;

    const [activeTab, setActiveTab] = useState('orders');
    const [orderStatus, setOrderStatus] = useState('');
    const [orderPage, setOrderPage] = useState(0);
    const [paymentPage, setPaymentPage] = useState(0);
    const [paymentModal, setPaymentModal] = useState({ open: false, order: null });
    const [editOpen, setEditOpen] = useState(false);
    const [cancelConfirm, setCancelConfirm] = useState(null);
    const [rejectConfirm, setRejectConfirm] = useState(null);

    const { data: customer, isLoading, isError } = useGetCustomerByIdQuery(id, { skip: !id });
    const { data: orderResult, isFetching: ordersFetching } = useGetSalesOrdersQuery(
        { customerId: id, status: orderStatus || undefined, page: orderPage, size: PAGE_SIZE },
        { skip: !id },
    );
    const { data: pendingResult } = useGetSalesOrdersQuery(
        { customerId: id, status: 'CREATED', page: 0, size: 1 },
        { skip: !id },
    );
    const { data: paymentResult, isFetching: paymentsFetching } = useGetPaymentsQuery(
        { customerId: id, page: paymentPage, size: PAGE_SIZE },
        { skip: !id },
    );

    const [rejectSalesOrder, { isLoading: rejecting }] = useRejectSalesOrderMutation();
    const [cancelPayment, { isLoading: cancelling }] = useCancelPaymentMutation();

    const { isDark, pageBg, cardBg, cardBorder, textColor, subtitleColor, accentColor, cardShadow } = useAppTheme();
    const tones = TONES(isDark);

    if (isLoading) {
        return <Box minH="60vh" display="flex" alignItems="center" justifyContent="center"><Loading /></Box>;
    }
    if (isError || !customer) {
        return (
            <Box minH="60vh" display="flex" flexDirection="column" alignItems="center" justifyContent="center" gap={4} color={isDark ? 'red.300' : 'red.600'}>
                <LuCircleAlert size={34} />
                <Text fontSize="lg">Mijoz ma&apos;lumotini yuklashda xatolik</Text>
                <Button variant="outline" borderRadius="xl" h="42px" px={4} onClick={() => navigate(backTo)}><HStack gap={2}><LuArrowLeft size={16} /><span>Mijozlar ro‘yxatiga qaytish</span></HStack></Button>
            </Box>
        );
    }

    const orders = orderResult?.items || [];
    const totalOrderPages = orderResult?.pagination?.totalPages || 0;
    const totalOrders = orderResult?.pagination?.totalElements ?? 0;
    const pendingCount = pendingResult?.pagination?.totalElements ?? 0;
    const payments = paymentResult?.items || [];
    const totalPaymentPages = paymentResult?.pagination?.totalPages || 0;
    const totalPayments = paymentResult?.pagination?.totalElements ?? 0;

    const balance = Number(customer.balance) || 0;
    const balanceMeta = getBalanceMeta(balance);
    const balanceTone = tones[balanceMeta.tone];
    const accentSoft = isDark ? 'rgba(250,204,21,.12)' : '#FEF3C7';
    const phoneHref = customer.phone ? `tel:${String(customer.phone).replace(/[^\d+]/g, '')}` : undefined;
    const tableHeaderBg = isDark ? 'rgba(148,163,184,0.06)' : '#F8FAFC';
    const th = { color: subtitleColor, fontSize: '11px', fontWeight: 'semibold', textTransform: 'uppercase', letterSpacing: 'wider', whiteSpace: 'nowrap', bg: tableHeaderBg };

    const handleReject = async () => {
        if (!rejectConfirm) return;
        try {
            await rejectSalesOrder({ id: rejectConfirm.id }).unwrap();
            Alert('Buyurtma bekor qilindi', 'success');
            setRejectConfirm(null);
        } catch (err) {
            Alert(err?.data?.message || 'Bekor qilishda xatolik', 'error');
        }
    };

    const handleCancelPayment = async () => {
        if (!cancelConfirm) return;
        try {
            await cancelPayment(cancelConfirm.id).unwrap();
            Alert('To‘lov bekor qilindi', 'success');
            setCancelConfirm(null);
        } catch (err) {
            Alert(err?.data?.message || 'Bekor qilishda xatolik', 'error');
        }
    };

    const copyId = async () => {
        try {
            await navigator.clipboard.writeText(customer.id);
            Alert('ID nusxalandi', 'success');
        } catch {
            Alert('Nusxalab bo‘lmadi', 'error');
        }
    };

    const tabs = [
        { value: 'orders', label: 'Buyurtmalar', icon: LuClipboardList, count: totalOrders },
        { value: 'payments', label: 'To‘lovlar', icon: LuCreditCard, count: totalPayments },
    ];

    return (
        <Box bg={pageBg} color={textColor} minH="100%" w="100%">
            {/* ── Sarlavha ── */}
            <Box overflow="hidden" borderWidth="1px" borderColor={cardBorder} borderRadius="2xl" boxShadow={cardShadow} mb={4}>
                <Box h="5px" bg={`linear-gradient(90deg, ${accentColor}, #FDE68A)`} />
                <Box bg={cardBg} p={{ base: 4, md: 6 }}>
                    <HStack justify="space-between" align="start" flexWrap="wrap" gap={4}>
                        <HStack gap={4} minW={0} align="start">
                            <Box w="64px" h="64px" borderRadius="2xl" bg={accentSoft} color={accentColor} display="flex" alignItems="center" justifyContent="center" fontWeight="bold" fontSize="22px" flexShrink={0} userSelect="none">
                                {getInitials(customer.name)}
                            </Box>
                            <Box minW={0}>
                                <HStack gap={2} flexWrap="wrap" mb={1}>
                                    <Text fontSize="xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider" color={subtitleColor}>Mijoz</Text>
                                    <Pill tone={balanceMeta.tone}>{balanceMeta.label}</Pill>
                                    {pendingCount > 0 && <Pill tone="amber" icon={LuClock3}>{pendingCount} ta yangi buyurtma</Pill>}
                                </HStack>
                                <Heading size={{ base: 'lg', md: 'xl' }} color={textColor} lineHeight="1.15" wordBreak="break-word">{customer.name}</Heading>
                                <HStack gap={4} mt={2} flexWrap="wrap" color={subtitleColor} fontSize="sm">
                                    {customer.phone && <HStack gap={1.5}><LuPhone size={14} /><Text as="a" href={phoneHref} _hover={{ color: accentColor }}>{customer.phone}</Text></HStack>}
                                    {customer.address && <HStack gap={1.5} minW={0}><LuMapPin size={14} /><Text noOfLines={1}>{customer.address}</Text></HStack>}
                                    {customer.agentName && <HStack gap={1.5}><LuUserCheck size={14} /><span>{customer.agentName}</span></HStack>}
                                </HStack>
                            </Box>
                        </HStack>

                        <HStack gap={2} flexWrap="wrap" flexShrink={0}>
                            <Button variant="outline" borderRadius="xl" h="42px" px={4} onClick={() => navigate(backTo)}>
                                <HStack gap={2}><LuArrowLeft size={16} /><span>Ro‘yxatga</span></HStack>
                            </Button>
                            {canEdit && (
                                <Button variant="outline" borderRadius="xl" h="42px" px={4} color={accentColor} borderColor={isDark ? 'rgba(250,204,21,.4)' : '#FDE68A'} _hover={{ bg: accentSoft }} onClick={() => setEditOpen(true)}>
                                    <HStack gap={2}><LuPen size={16} /><span>Tahrirlash</span></HStack>
                                </Button>
                            )}
                            <Button bg={accentColor} color="black" borderRadius="xl" h="42px" px={5} fontWeight="semibold" _hover={{ bg: '#EAB308' }} onClick={() => setPaymentModal({ open: true, order: null })}>
                                <HStack gap={2}><LuWallet size={16} /><span>To‘lov qabul qilish</span></HStack>
                            </Button>
                        </HStack>
                    </HStack>
                </Box>
            </Box>

            {/* ── Ko‘rsatkichlar ── */}
            <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} gap={4} mb={4}>
                <StatCard icon={LuScale} label="Joriy balans" value={`${balance < 0 ? '-' : ''}${formatNumber(Math.abs(balance))} so‘m`} sub={balanceMeta.title} tone={balanceMeta.tone} valueTone />
                <StatCard icon={LuClipboardList} label="Buyurtmalar" value={`${formatNumber(totalOrders)} ta`} sub={pendingCount > 0 ? `${pendingCount} tasi hali yangi (ortilmagan)` : 'Yangi buyurtma yo‘q'} tone="amber" />
                <StatCard icon={LuCreditCard} label="To‘lovlar" value={`${formatNumber(totalPayments)} ta`} sub="Qabul qilingan to‘lovlar soni" tone="sky" />
                <StatCard icon={LuCalendar} label="Ro‘yxatga olingan" value={formatDateOnly(customer.createdAt)} sub={customer.lastModifiedAt ? `Yangilangan: ${formatDetailDate(customer.lastModifiedAt)}` : undefined} tone="violet" />
            </SimpleGrid>

            {/* ── Balans izohi ── */}
            <Box mb={4} px={{ base: 4, md: 5 }} py={3} borderRadius="xl" borderWidth="1px" borderColor={balanceTone.border} bg={balanceTone.bg}>
                <HStack gap={2.5} align="start">
                    <Box color={balanceTone.color} mt="2px"><LuCircleAlert size={16} /></Box>
                    <Text fontSize="sm" color={textColor}>
                        <Text as="span" fontWeight="semibold" color={balanceTone.color}>{balanceMeta.title}.</Text>{' '}{balanceMeta.hint}
                    </Text>
                </HStack>
            </Box>

            {/* ── Ma'lumotlar ── */}
            <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4} mb={4}>
                <InfoCard icon={LuUsers} title="Aloqa ma’lumotlari">
                    <InfoRow icon={LuPhone} label="Telefon" value={customer.phone} href={phoneHref} />
                    <InfoRow icon={LuMapPin} label="Manzil" value={customer.address} />
                    <InfoRow icon={LuHash} label="INN / STIR" value={customer.inn} mono />
                    <InfoRow icon={LuUserCheck} label="Agent" value={customer.agentName} emptyText="Biriktirilmagan" />
                    <InfoRow icon={LuSend} label="Telegram" value={customer.telegramChatId ? String(customer.telegramChatId) : null} emptyText="Ulanmagan" mono />
                </InfoCard>
                <InfoCard icon={LuStickyNote} title="Qo‘shimcha ma’lumotlar">
                    <InfoRow icon={LuStickyNote} label="Izoh" value={customer.summary} emptyText="Izoh yo‘q" />
                    <InfoRow icon={LuCalendar} label="Yaratilgan" value={formatDetailDate(customer.createdAt)} />
                    <InfoRow icon={LuClock3} label="Oxirgi o‘zgarish" value={formatDetailDate(customer.lastModifiedAt)} />
                    <InfoRow
                        icon={LuHash}
                        label="Tizim ID"
                        value={customer.id}
                        mono
                        action={<Button size="xs" variant="ghost" color={subtitleColor} w="30px" h="30px" p={0} minW={0} onClick={copyId} aria-label="ID nusxalash"><LuCopy size={14} /></Button>}
                    />
                </InfoCard>
            </SimpleGrid>

            {/* ── Buyurtmalar / To'lovlar ── */}
            <Card>
                <HStack justify="space-between" align="center" flexWrap="wrap" gap={3} px={{ base: 4, md: 5 }} py={3} borderBottomWidth="1px" borderColor={cardBorder}>
                    <HStack gap={1} p={1} bg={isDark ? 'rgba(148,163,184,0.06)' : 'gray.100'} borderRadius="xl">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.value;
                            return (
                                <Button
                                    key={tab.value} size="sm" borderRadius="lg" px={4} h="36px" fontWeight="semibold" fontSize="sm"
                                    onClick={() => setActiveTab(tab.value)}
                                    bg={isActive ? (isDark ? 'rgba(250,204,21,0.15)' : 'white') : 'transparent'}
                                    color={isActive ? accentColor : subtitleColor}
                                    boxShadow={isActive && !isDark ? '0 1px 3px rgba(15,23,42,0.08)' : 'none'}
                                    _hover={{ bg: isActive ? (isDark ? 'rgba(250,204,21,0.18)' : 'white') : (isDark ? 'whiteAlpha.50' : 'whiteAlpha.700') }}
                                >
                                    <HStack gap={2}>
                                        <tab.icon size={14} />
                                        <span>{tab.label}</span>
                                        <Box as="span" px={1.5} borderRadius="md" fontSize="11px" bg={isActive ? accentSoft : (isDark ? 'whiteAlpha.100' : 'gray.200')} color={isActive ? accentColor : subtitleColor}>{formatNumber(tab.count)}</Box>
                                    </HStack>
                                </Button>
                            );
                        })}
                    </HStack>

                    {activeTab === 'orders' && (
                        <HStack gap={1.5} flexWrap="wrap">
                            {ORDER_STATUS_FILTERS.map((option) => {
                                const isActive = orderStatus === option.value;
                                return (
                                    <Button
                                        key={option.value || 'all'} size="sm" borderRadius="full" px={3.5} h="30px" fontSize="xs" fontWeight="semibold"
                                        onClick={() => { setOrderStatus(option.value); setOrderPage(0); }}
                                        bg={isActive ? accentColor : 'transparent'} color={isActive ? 'black' : subtitleColor}
                                        borderWidth="1px" borderColor={isActive ? accentColor : cardBorder}
                                        _hover={{ bg: isActive ? accentColor : (isDark ? 'whiteAlpha.100' : 'gray.50') }}
                                    >
                                        {option.label}
                                    </Button>
                                );
                            })}
                        </HStack>
                    )}
                </HStack>

                <Box p={{ base: 3, md: 5 }}>
                    {/* ── Buyurtmalar ── */}
                    {activeTab === 'orders' && (ordersFetching ? (
                        <VStack py={12} gap={3}><Spinner size="md" color={accentColor} /><Text color={subtitleColor} fontSize="sm">Yuklanmoqda...</Text></VStack>
                    ) : orders.length === 0 ? (
                        <EmptyState icon={LuClipboardList} title={orderStatus ? 'Bu holatdagi buyurtmalar topilmadi' : 'Hozircha buyurtmalar yo‘q'} description={orderStatus ? 'Boshqa holatni tanlab ko‘ring' : 'Yangi buyurtma yaratilganda bu yerda ko‘rinadi'} />
                    ) : (
                        <>
                            <Box overflowX="auto" borderWidth="1px" borderColor={cardBorder} borderRadius="xl">
                                <Table.Root size="sm" bg={isDark ? 'transparent' : 'white'} minW="980px">
                                    <Table.Header>
                                        <Table.Row>
                                            <Table.ColumnHeader {...th} w="44px" textAlign="center">№</Table.ColumnHeader>
                                            <Table.ColumnHeader {...th}>Sana</Table.ColumnHeader>
                                            <Table.ColumnHeader {...th}>Mahsulotlar</Table.ColumnHeader>
                                            <Table.ColumnHeader {...th} textAlign="right">Summa</Table.ColumnHeader>
                                            <Table.ColumnHeader {...th} textAlign="right">To‘langan</Table.ColumnHeader>
                                            <Table.ColumnHeader {...th} textAlign="right">Qarz</Table.ColumnHeader>
                                            <Table.ColumnHeader {...th}>Holat</Table.ColumnHeader>
                                            <Table.ColumnHeader {...th} textAlign="right">Amallar</Table.ColumnHeader>
                                        </Table.Row>
                                    </Table.Header>
                                    <Table.Body>
                                        {orders.map((order, index) => {
                                            const total = Number(order.totalAmount) || 0;
                                            const debt = Number(order.remainingDebt) || 0;
                                            const paid = Number.isFinite(Number(order.paidAmount)) && order.paidAmount != null ? Number(order.paidAmount) : Math.max(total - debt, 0);
                                            const status = ORDER_STATUS_META[order.status] || { label: order.status || '—', icon: LuClock3, tone: 'gray' };
                                            const items = order.items || [];
                                            const itemNames = items.map((i) => i.productName).filter(Boolean);
                                            return (
                                                <Table.Row key={order.id} _hover={{ bg: isDark ? 'rgba(250,204,21,.04)' : '#FFFBEB' }}>
                                                    <Table.Cell color={subtitleColor} textAlign="center" fontSize="sm">{orderPage * PAGE_SIZE + index + 1}</Table.Cell>
                                                    <Table.Cell color={textColor} fontSize="sm" whiteSpace="nowrap">
                                                        <Text fontWeight="medium">{formatDateOnly(order.createdAt)}</Text>
                                                        <Text fontSize="xs" color={subtitleColor}>{formatDetailDate(order.createdAt).split(', ')[1] || ''}</Text>
                                                    </Table.Cell>
                                                    <Table.Cell fontSize="sm" maxW="260px">
                                                        <Text color={textColor} fontWeight="semibold">{items.length} ta mahsulot</Text>
                                                        <Text color={subtitleColor} fontSize="xs" noOfLines={1} title={itemNames.join(', ')}>
                                                            {itemNames.length ? itemNames.slice(0, 2).join(', ') + (itemNames.length > 2 ? ` +${itemNames.length - 2}` : '') : (order.summary || '—')}
                                                        </Text>
                                                    </Table.Cell>
                                                    <Table.Cell color={textColor} fontWeight="bold" fontSize="sm" textAlign="right" whiteSpace="nowrap">{formatNumber(total)} so‘m</Table.Cell>
                                                    <Table.Cell color={isDark ? 'green.300' : 'green.700'} fontSize="sm" textAlign="right" whiteSpace="nowrap">{formatNumber(paid)}</Table.Cell>
                                                    <Table.Cell textAlign="right" whiteSpace="nowrap">
                                                        <Text color={debt > 0 ? (isDark ? 'red.300' : 'red.600') : subtitleColor} fontWeight={debt > 0 ? 'bold' : 'normal'} fontSize="sm">{formatNumber(debt)}</Text>
                                                    </Table.Cell>
                                                    <Table.Cell><Pill tone={status.tone} icon={status.icon}>{status.label}</Pill></Table.Cell>
                                                    <Table.Cell>
                                                        <HStack justify="flex-end" gap={1.5} flexWrap="nowrap">
                                                            {order.status === 'CREATED' && (
                                                                <Button size="xs" h="30px" px={3} borderRadius="lg" bg={tones.red.bg} color={tones.red.color} borderWidth="1px" borderColor={tones.red.border} _hover={{ opacity: 0.85 }} onClick={() => setRejectConfirm(order)}>
                                                                    <HStack gap={1}><LuX size={13} /><span>Bekor qilish</span></HStack>
                                                                </Button>
                                                            )}
                                                            {order.status === 'CONFIRMED' && debt > 0 && (
                                                                <Button size="xs" h="30px" px={3} borderRadius="lg" bg={accentColor} color="black" fontWeight="semibold" _hover={{ bg: '#EAB308' }} onClick={() => setPaymentModal({ open: true, order })}>
                                                                    <HStack gap={1}><LuBanknote size={13} /><span>To‘lov</span></HStack>
                                                                </Button>
                                                            )}
                                                            {ordersBase && (
                                                                <Button asChild size="xs" w="30px" h="30px" p={0} minW={0} borderRadius="lg" variant="outline" color={subtitleColor} aria-label="Buyurtmani ochish" title="Buyurtmani ochish">
                                                                    <RouterLink to={`${ordersBase}/${order.id}`}><LuExternalLink size={14} /></RouterLink>
                                                                </Button>
                                                            )}
                                                        </HStack>
                                                    </Table.Cell>
                                                </Table.Row>
                                            );
                                        })}
                                    </Table.Body>
                                </Table.Root>
                            </Box>
                            <Pagination page={orderPage} totalPages={totalOrderPages} total={totalOrders} unit="ta buyurtma" onChange={setOrderPage} />
                        </>
                    ))}

                    {/* ── To'lovlar ── */}
                    {activeTab === 'payments' && (paymentsFetching ? (
                        <VStack py={12} gap={3}><Spinner size="md" color={accentColor} /><Text color={subtitleColor} fontSize="sm">Yuklanmoqda...</Text></VStack>
                    ) : payments.length === 0 ? (
                        <EmptyState icon={LuCreditCard} title="Hozircha to‘lovlar yo‘q" description="To‘lov qabul qilinganda bu yerda tarix paydo bo‘ladi" />
                    ) : (
                        <>
                            <Box overflowX="auto" borderWidth="1px" borderColor={cardBorder} borderRadius="xl">
                                <Table.Root size="sm" bg={isDark ? 'transparent' : 'white'} minW="980px">
                                    <Table.Header>
                                        <Table.Row>
                                            <Table.ColumnHeader {...th} w="44px" textAlign="center">№</Table.ColumnHeader>
                                            <Table.ColumnHeader {...th}>Sana</Table.ColumnHeader>
                                            <Table.ColumnHeader {...th}>Kassa</Table.ColumnHeader>
                                            <Table.ColumnHeader {...th} textAlign="right">Summa</Table.ColumnHeader>
                                            <Table.ColumnHeader {...th} textAlign="right">Buyurtmaga yopilgan</Table.ColumnHeader>
                                            <Table.ColumnHeader {...th} textAlign="right">Avansga o‘tgan</Table.ColumnHeader>
                                            <Table.ColumnHeader {...th}>Holat</Table.ColumnHeader>
                                            <Table.ColumnHeader {...th}>Izoh</Table.ColumnHeader>
                                            <Table.ColumnHeader {...th} textAlign="right">Amal</Table.ColumnHeader>
                                        </Table.Row>
                                    </Table.Header>
                                    <Table.Body>
                                        {payments.map((payment, index) => {
                                            const cancelled = payment.status === 'CANCELLED';
                                            const advance = Number(payment.unallocatedAmount) || 0;
                                            return (
                                                <Table.Row key={payment.id} opacity={cancelled ? 0.55 : 1} _hover={{ bg: isDark ? 'rgba(250,204,21,.04)' : '#FFFBEB' }}>
                                                    <Table.Cell color={subtitleColor} textAlign="center" fontSize="sm">{paymentPage * PAGE_SIZE + index + 1}</Table.Cell>
                                                    <Table.Cell color={textColor} fontSize="sm" whiteSpace="nowrap" fontWeight="medium">{formatDateOnly(payment.paidAt)}</Table.Cell>
                                                    <Table.Cell color={textColor} fontSize="sm" whiteSpace="nowrap"><HStack gap={1.5}><LuWallet size={13} color={subtitleColor} /><span>{payment.cashboxName || '—'}</span></HStack></Table.Cell>
                                                    <Table.Cell textAlign="right" whiteSpace="nowrap">
                                                        <Text color={textColor} fontWeight="bold" fontSize="sm" textDecoration={cancelled ? 'line-through' : undefined}>{formatNumber(payment.amount ?? 0)} so‘m</Text>
                                                        <CurrencyNote currency={payment.currency} usdRate={payment.usdRate} amount={payment.amount} />
                                                    </Table.Cell>
                                                    <Table.Cell color={subtitleColor} fontSize="sm" textAlign="right" whiteSpace="nowrap">{formatNumber(payment.allocatedAmount ?? 0)}</Table.Cell>
                                                    <Table.Cell textAlign="right" whiteSpace="nowrap">
                                                        <Text color={advance > 0 ? (isDark ? 'green.300' : 'green.600') : subtitleColor} fontWeight={advance > 0 ? 'bold' : 'normal'} fontSize="sm">{formatNumber(advance)}</Text>
                                                    </Table.Cell>
                                                    <Table.Cell>
                                                        <Pill tone={cancelled ? 'red' : 'green'} icon={cancelled ? LuCircleX : LuCircleCheck}>{cancelled ? 'Bekor qilingan' : 'Faol'}</Pill>
                                                        {payment.cancelledAt && <Text color={subtitleColor} fontSize="xs" mt={1}>{formatDetailDate(payment.cancelledAt)}</Text>}
                                                    </Table.Cell>
                                                    <Table.Cell color={subtitleColor} fontSize="sm" maxW="200px"><Text noOfLines={2}>{payment.summary || '—'}</Text></Table.Cell>
                                                    <Table.Cell>
                                                        <HStack justify="flex-end">
                                                            {cancelled ? (
                                                                <Text fontSize="xs" color={subtitleColor}>—</Text>
                                                            ) : (
                                                                <Button size="xs" h="30px" px={3} borderRadius="lg" bg={tones.red.bg} color={tones.red.color} borderWidth="1px" borderColor={tones.red.border} _hover={{ opacity: 0.85 }} onClick={() => setCancelConfirm(payment)}>
                                                                    <HStack gap={1}><LuCircleX size={13} /><span>Bekor qilish</span></HStack>
                                                                </Button>
                                                            )}
                                                        </HStack>
                                                    </Table.Cell>
                                                </Table.Row>
                                            );
                                        })}
                                    </Table.Body>
                                </Table.Root>
                            </Box>
                            <Pagination page={paymentPage} totalPages={totalPaymentPages} total={totalPayments} unit="ta to‘lov" onChange={setPaymentPage} />
                        </>
                    ))}
                </Box>
            </Card>

            {/* ── Modallar ── */}
            <PaymentModal open={paymentModal.open} onClose={() => setPaymentModal({ open: false, order: null })} customerId={id} order={paymentModal.order} />
            {editOpen && <Edit customer={customer} hideTrigger openOnMount onClosed={() => setEditOpen(false)} />}
            <ConfirmDialog
                open={Boolean(cancelConfirm)}
                onClose={() => setCancelConfirm(null)}
                onConfirm={handleCancelPayment}
                isLoading={cancelling}
                title="To‘lovni bekor qilish"
                confirmLabel="Ha, bekor qilish"
                loadingLabel="Bekor qilinmoqda..."
                body={<><strong>{formatNumber(cancelConfirm?.amount ?? 0)} so‘m</strong> miqdoridagi to‘lov bekor qilinadi. Pul kassadan chiqariladi, buyurtmalar qarzi va mijoz balansi tiklanadi. Bu amalni qaytarib bo‘lmaydi.</>}
            />
            <ConfirmDialog
                open={Boolean(rejectConfirm)}
                onClose={() => setRejectConfirm(null)}
                onConfirm={handleReject}
                isLoading={rejecting}
                title="Buyurtmani bekor qilish"
                confirmLabel="Ha, bekor qilish"
                loadingLabel="Bekor qilinmoqda..."
                icon={LuCircleX}
                body={<><strong>{formatNumber(rejectConfirm?.totalAmount ?? 0)} so‘m</strong> summadagi buyurtma bekor qilinadi. Bekor qilingan buyurtma bo‘yicha to‘lov qabul qilib bo‘lmaydi.</>}
            />
        </Box>
    );
}
