import { useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Badge, Box, Button, HStack, Table, Text, Spinner, Portal, Dialog, VStack } from '@chakra-ui/react';
import {
    LuCalendar, LuChevronLeft, LuChevronRight, LuClipboardList,
    LuPhone, LuUsers, LuWallet, LuCreditCard, LuTriangleAlert, LuX,
    LuBanknote, LuCircleX,
} from 'react-icons/lu';
import { useGetCustomerByIdQuery } from '../../../store/services/customer.api';
import { useGetSalesOrdersQuery, useApproveSalesOrderMutation, useRejectSalesOrderMutation } from '../../../store/services/salesOrder.api';
import { useGetPaymentsQuery, useCancelPaymentMutation } from '../../../store/services/payment.api';
import { formatNumber } from '../../ui/number-format';
import EntityDetail, { DetailRow, DetailSection, formatDetailDate } from '../EntityDetail';
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
    { value: 'payments', label: "To'lovlar tarixi", icon: LuCreditCard },
];

// ── To'lovni bekor qilish confirm dialogi ─────────────────────────────────
function CancelPaymentDialog({ open, onClose, onConfirm, isLoading, amount }) {
    const { isDark, cardBg, cardBorder, textColor, subtitleColor } = useAppTheme();
    return (
        <Dialog.Root open={open} onOpenChange={(e) => !e.open && onClose()} size="md" placement="center">
            <Portal>
                <Dialog.Backdrop backdropFilter="blur(6px)" bg={isDark ? 'blackAlpha.700' : 'blackAlpha.400'} />
                <Dialog.Positioner>
                    <Dialog.Content bg={cardBg} borderColor={cardBorder} borderWidth="1px" borderRadius="2xl" overflow="hidden" maxW="440px" w="calc(100% - 32px)">
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

// ── Status select — PENDING uchun ─────────────────────────────────────────
function OrderStatusSelect({ orderId, currentStatus, onApprove, onReject, isLoading, isDark }) {
    const styleMap = {
        PENDING:  { bg: isDark ? 'rgba(250,204,21,.14)' : '#FEF3C7',  color: isDark ? '#fde68a' : '#92400E',  border: isDark ? '#ca8a04' : '#d97706' },
        APPROVED: { bg: isDark ? 'rgba(34,197,94,.14)'  : '#DCFCE7',  color: isDark ? '#86efac' : '#15803d',  border: isDark ? '#16a34a' : '#16a34a' },
        REJECTED: { bg: isDark ? 'rgba(239,68,68,.14)'  : '#FEE2E2',  color: isDark ? '#fca5a5' : '#b91c1c',  border: isDark ? '#dc2626' : '#dc2626' },
    };
    const style = styleMap[currentStatus] || styleMap.PENDING;

    if (currentStatus !== 'PENDING') {
        return (
            <Badge borderRadius="full" px={3} py={1} bg={style.bg} color={style.color} whiteSpace="nowrap">
                {ORDER_STATUS_LABELS[currentStatus] || currentStatus}
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
            fontSize="xs"
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
    const [rejectSalesOrder]  = useRejectSalesOrderMutation();
    const [cancelPayment, { isLoading: cancelling }] = useCancelPaymentMutation();

    const openGeneralPayment = () => setPaymentModal({ open: true, order: null });
    const openOrderPayment   = (order) => setPaymentModal({ open: true, order });
    const closePayment       = () => setPaymentModal({ open: false, order: null });

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
            {({ isDark, textColor, subtitleColor, accentColor, cardBorder, cardBg }) => (
                <>
                    <DetailSection title="Mijoz ma'lumotlari" icon={LuUsers}>
                        <DetailRow label="Nomi" value={customer.name} emphasize />
                        <DetailRow
                            label="Telefon"
                            value={<span><LuPhone size={15} style={{ display: 'inline', marginRight: 7 }} />{customer.phone}</span>}
                        />
                        <DetailRow label="Izoh" value={customer.summary} />
                    </DetailSection>

                    <DetailSection title="Hisob-kitob" icon={LuWallet}>
                        <DetailRow
                            label="Qoldiq"
                            value={`${formatNumber(Math.abs(Number(customer.balance) || 0))} so'm ${
                                (Number(customer.balance) || 0) < 0 ? '(qarzdor)'
                                : (Number(customer.balance) || 0) > 0 ? '(kredit)' : ''
                            }`}
                            emphasize
                        />
                        <DetailRow label="Buyurtmalar soni" value={formatNumber(totalOrders)} />
                    </DetailSection>

                    <DetailSection title="Tizim ma'lumotlari" icon={LuCalendar}>
                        <DetailRow label="Yaratilgan" value={formatDetailDate(customer.createdAt)} />
                        <DetailRow label="Yangilangan" value={formatDetailDate(customer.lastModifiedAt)} />
                    </DetailSection>

                    {/* ── Tab blok ── */}
                    <DetailSection
                        title=""
                        icon={activeTab === 'orders' ? LuClipboardList : LuCreditCard}
                        gridColumn={{ base: 'auto', lg: '1 / -1' }}
                    >
                        {/* tab tugmalari */}
                        <HStack gap={2} mb={4} borderBottomWidth="1px" borderColor={cardBorder} pb={3}>
                            {TABS.map((tab) => {
                                const isActive = activeTab === tab.value;
                                const Icon = tab.icon;
                                return (
                                    <Button
                                        key={tab.value}
                                        size="sm"
                                        borderRadius="full"
                                        px={5}
                                        fontWeight="semibold"
                                        onClick={() => setActiveTab(tab.value)}
                                        bg={isActive ? accentColor : 'transparent'}
                                        color={isActive ? 'black' : subtitleColor}
                                        borderWidth="1px"
                                        borderColor={isActive ? accentColor : cardBorder}
                                        _hover={{ bg: isActive ? accentColor : (isDark ? 'whiteAlpha.100' : 'gray.50') }}
                                    >
                                        <HStack gap={2}><Icon size={14} /><span>{tab.label}</span></HStack>
                                    </Button>
                                );
                            })}
                        </HStack>

                        {/* ══ BUYURTMALAR TAB ══ */}
                        {activeTab === 'orders' && (
                            <>
                                <HStack gap={1} flexWrap="wrap" mb={3}>
                                    {ORDER_STATUS_FILTERS.map((option) => {
                                        const isActive = orderStatus === option.value;
                                        return (
                                            <Button
                                                key={option.value || 'all'}
                                                size="sm"
                                                borderRadius="full"
                                                px={4}
                                                fontWeight="medium"
                                                onClick={() => { setOrderStatus(option.value); setOrderPage(0); }}
                                                bg={isActive ? (isDark ? 'whiteAlpha.200' : 'gray.100') : 'transparent'}
                                                color={isActive ? textColor : subtitleColor}
                                                borderWidth="1px"
                                                borderColor={isActive ? (isDark ? 'whiteAlpha.300' : 'gray.300') : cardBorder}
                                                _hover={{ bg: isDark ? 'whiteAlpha.100' : 'gray.50' }}
                                            >
                                                {option.label}
                                            </Button>
                                        );
                                    })}
                                </HStack>

                                {ordersFetching ? (
                                    <Text color={subtitleColor} py={6} textAlign="center">Yuklanmoqda...</Text>
                                ) : orders.length === 0 ? (
                                    <VStack py={8} gap={2}>
                                        <LuClipboardList size={36} color={subtitleColor} opacity={0.4} />
                                        <Text color={subtitleColor}>
                                            {orderStatus ? 'Bu holatdagi buyurtmalar topilmadi' : "Bu mijozda hozircha buyurtmalar yo'q"}
                                        </Text>
                                    </VStack>
                                ) : (
                                    <>
                                        <Box overflowX="auto" borderWidth="1px" borderColor={cardBorder} borderRadius="xl">
                                            <Table.Root size="md" bg={cardBg} borderCollapse="collapse">
                                                <Table.Header>
                                                    <Table.Row>
                                                        <Table.ColumnHeader color={subtitleColor} w="50px" textAlign="center">№</Table.ColumnHeader>
                                                        <Table.ColumnHeader color={subtitleColor}>Mahsulotlar</Table.ColumnHeader>
                                                        <Table.ColumnHeader color={subtitleColor}>Izoh</Table.ColumnHeader>
                                                        <Table.ColumnHeader color={subtitleColor} textAlign="right">Summa</Table.ColumnHeader>
                                                        <Table.ColumnHeader color={subtitleColor} textAlign="right">Qolgan qarz</Table.ColumnHeader>
                                                        <Table.ColumnHeader color={subtitleColor}>Holati</Table.ColumnHeader>
                                                        <Table.ColumnHeader color={subtitleColor}>Sana</Table.ColumnHeader>
                                                        <Table.ColumnHeader color={subtitleColor} textAlign="center">Amal</Table.ColumnHeader>
                                                    </Table.Row>
                                                </Table.Header>
                                                <Table.Body>
                                                    {orders.map((order, index) => (
                                                        <Table.Row key={order.id} _hover={{ bg: isDark ? 'rgba(250,204,21,.06)' : '#FFFBEB' }}>
                                                            <Table.Cell color={subtitleColor} textAlign="center">{orderPage * PAGE_SIZE + index + 1}</Table.Cell>
                                                            <Table.Cell color={textColor} fontWeight="semibold" whiteSpace="nowrap">{order.items?.length ?? 0} ta</Table.Cell>
                                                            <Table.Cell color={subtitleColor} maxW="200px">{order.summary || '—'}</Table.Cell>
                                                            <Table.Cell color={textColor} fontWeight="bold" textAlign="right" whiteSpace="nowrap">
                                                                {formatNumber(order.totalAmount ?? 0)} so&apos;m
                                                            </Table.Cell>
                                                            <Table.Cell textAlign="right" whiteSpace="nowrap">
                                                                <Text
                                                                    color={(order.remainingDebt ?? 0) > 0 ? (isDark ? 'red.300' : 'red.600') : subtitleColor}
                                                                    fontWeight={(order.remainingDebt ?? 0) > 0 ? 'bold' : 'normal'}
                                                                >
                                                                    {formatNumber(order.remainingDebt ?? 0)} so&apos;m
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
                                                            <Table.Cell color={subtitleColor} whiteSpace="nowrap">{formatDetailDate(order.createdAt)}</Table.Cell>
                                                            <Table.Cell textAlign="center">
                                                                <Button
                                                                    size="sm"
                                                                    borderRadius="xl"
                                                                    px={4}
                                                                    gap={1}
                                                                    bg={order.status === 'APPROVED' ? accentColor : (isDark ? 'whiteAlpha.100' : 'gray.100')}
                                                                    color={order.status === 'APPROVED' ? 'black' : subtitleColor}
                                                                    cursor={order.status === 'APPROVED' ? 'pointer' : 'not-allowed'}
                                                                    opacity={order.status === 'APPROVED' ? 1 : 0.5}
                                                                    _hover={order.status === 'APPROVED' ? { opacity: 0.85 } : {}}
                                                                    onClick={() => order.status === 'APPROVED' && openOrderPayment(order)}
                                                                    title={order.status !== 'APPROVED' ? "Avval buyurtmani tasdiqlang" : "To'lov qilish"}
                                                                >
                                                                    <LuBanknote size={15} />
                                                                    <span>To&apos;lov</span>
                                                                </Button>
                                                            </Table.Cell>
                                                        </Table.Row>
                                                    ))}
                                                </Table.Body>
                                            </Table.Root>
                                        </Box>
                                        <HStack justify="space-between" mt={4} flexWrap="wrap" gap={3}>
                                            <Text color={subtitleColor} fontSize="sm">Jami: {formatNumber(totalOrders)} ta buyurtma</Text>
                                            {totalOrderPages > 1 && (
                                                <HStack gap={3}>
                                                    <Button size="sm" variant="outline" disabled={orderPage === 0} onClick={() => setOrderPage((v) => v - 1)}><LuChevronLeft /></Button>
                                                    <Text color={subtitleColor} fontSize="sm">{orderPage + 1} / {totalOrderPages}</Text>
                                                    <Button size="sm" variant="outline" disabled={orderPage >= totalOrderPages - 1} onClick={() => setOrderPage((v) => v + 1)}><LuChevronRight /></Button>
                                                </HStack>
                                            )}
                                        </HStack>
                                    </>
                                )}
                            </>
                        )}

                        {/* ══ TO'LOVLAR TAB ══ */}
                        {activeTab === 'payments' && (
                            <>
                                {paymentsFetching ? (
                                    <Text color={subtitleColor} py={6} textAlign="center">Yuklanmoqda...</Text>
                                ) : payments.length === 0 ? (
                                    <VStack py={8} gap={2}>
                                        <LuCreditCard size={36} color={subtitleColor} opacity={0.4} />
                                        <Text color={subtitleColor}>Bu mijoz uchun hozircha to&apos;lovlar yo&apos;q</Text>
                                    </VStack>
                                ) : (
                                    <>
                                        <Box overflowX="auto" borderWidth="1px" borderColor={cardBorder} borderRadius="xl">
                                            <Table.Root size="md" bg={cardBg} borderCollapse="collapse">
                                                <Table.Header>
                                                    <Table.Row>
                                                        <Table.ColumnHeader color={subtitleColor} w="50px" textAlign="center">№</Table.ColumnHeader>
                                                        <Table.ColumnHeader color={subtitleColor}>Kassa</Table.ColumnHeader>
                                                        <Table.ColumnHeader color={subtitleColor} textAlign="right">Summa</Table.ColumnHeader>
                                                        <Table.ColumnHeader color={subtitleColor} textAlign="right">Taqsimlangan</Table.ColumnHeader>
                                                        <Table.ColumnHeader color={subtitleColor} textAlign="right">Avans</Table.ColumnHeader>
                                                        <Table.ColumnHeader color={subtitleColor}>Holati</Table.ColumnHeader>
                                                        <Table.ColumnHeader color={subtitleColor}>Izoh</Table.ColumnHeader>
                                                        <Table.ColumnHeader color={subtitleColor}>Sana</Table.ColumnHeader>
                                                        <Table.ColumnHeader color={subtitleColor} textAlign="center">Amal</Table.ColumnHeader>
                                                    </Table.Row>
                                                </Table.Header>
                                                <Table.Body>
                                                    {payments.map((payment, index) => (
                                                        <Table.Row
                                                            key={payment.id}
                                                            opacity={payment.status === 'CANCELLED' ? 0.5 : 1}
                                                            _hover={{ bg: isDark ? 'rgba(250,204,21,.06)' : '#FFFBEB' }}
                                                        >
                                                            <Table.Cell color={subtitleColor} textAlign="center">{paymentPage * PAGE_SIZE + index + 1}</Table.Cell>
                                                            <Table.Cell color={textColor} whiteSpace="nowrap">{payment.cashboxName}</Table.Cell>
                                                            <Table.Cell color={textColor} fontWeight="bold" textAlign="right" whiteSpace="nowrap">
                                                                {formatNumber(payment.amount ?? 0)} so&apos;m
                                                            </Table.Cell>
                                                            <Table.Cell color={subtitleColor} textAlign="right" whiteSpace="nowrap">
                                                                {formatNumber(payment.allocatedAmount ?? 0)} so&apos;m
                                                            </Table.Cell>
                                                            <Table.Cell textAlign="right" whiteSpace="nowrap">
                                                                <Text
                                                                    color={(payment.unallocatedAmount ?? 0) > 0 ? (isDark ? 'green.300' : 'green.600') : subtitleColor}
                                                                    fontWeight={(payment.unallocatedAmount ?? 0) > 0 ? 'semibold' : 'normal'}
                                                                >
                                                                    {formatNumber(payment.unallocatedAmount ?? 0)} so&apos;m
                                                                </Text>
                                                            </Table.Cell>
                                                            <Table.Cell>
                                                                <Badge
                                                                    borderRadius="full"
                                                                    px={3}
                                                                    py={1}
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
                                                            <Table.Cell color={subtitleColor} maxW="160px">{payment.summary || '—'}</Table.Cell>
                                                            <Table.Cell color={subtitleColor} whiteSpace="nowrap">{payment.paidAt}</Table.Cell>
                                                            <Table.Cell textAlign="center">
                                                                {payment.status === 'ACTIVE' ? (
                                                                    <Button
                                                                        size="sm"
                                                                        borderRadius="xl"
                                                                        px={4}
                                                                        gap={1}
                                                                        bg={isDark ? 'rgba(239,68,68,.15)' : 'red.50'}
                                                                        color={isDark ? 'red.300' : 'red.600'}
                                                                        borderWidth="1px"
                                                                        borderColor={isDark ? 'rgba(239,68,68,.3)' : 'red.200'}
                                                                        _hover={{ bg: isDark ? 'rgba(239,68,68,.25)' : 'red.100' }}
                                                                        onClick={() => setCancelConfirm({ open: true, paymentId: payment.id, amount: payment.amount })}
                                                                    >
                                                                        <LuCircleX size={14} />
                                                                        <span>Bekor qilish</span>
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
                                            <Text color={subtitleColor} fontSize="sm">Jami: {formatNumber(totalPayments)} ta to&apos;lov</Text>
                                            {totalPaymentPages > 1 && (
                                                <HStack gap={3}>
                                                    <Button size="sm" variant="outline" disabled={paymentPage === 0} onClick={() => setPaymentPage((v) => v - 1)}><LuChevronLeft /></Button>
                                                    <Text color={subtitleColor} fontSize="sm">{paymentPage + 1} / {totalPaymentPages}</Text>
                                                    <Button size="sm" variant="outline" disabled={paymentPage >= totalPaymentPages - 1} onClick={() => setPaymentPage((v) => v + 1)}><LuChevronRight /></Button>
                                                </HStack>
                                            )}
                                        </HStack>
                                    </>
                                )}
                            </>
                        )}
                    </DetailSection>

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
            )}
        </EntityDetail>
    );
}
