import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
    Badge,
    Box,
    Button,
    Dialog,
    HStack,
    Portal,
    SimpleGrid,
    Spinner,
    Table,
    Text,
    VStack,
} from '@chakra-ui/react';
import {
    LuCalendar,
    LuChevronLeft,
    LuChevronRight,
    LuCircleX,
    LuHistory,
    LuWallet,
    LuX,
} from 'react-icons/lu';
import {
    useCancelSupplierPaymentMutation,
    useGetSupplierPaymentsQuery,
} from '../../../store/services/supplierPayment.api';
import { useAppTheme, BRAND_COLORS } from '../../../theme/tokens';
import { Alert } from '../../Other/UI/Alert/Alert';
import FormControl from '../../ui/FormControl';
import { formatNumber } from '../../ui/number-format';
import { formatDetailDate } from '../EntityDetail';

const PAGE_SIZE = 20;

function formatPaidDate(value) {
    if (!value) return '—';
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime())
        ? value
        : date.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function CancelPaymentDialog({ payment, onClose, onConfirm, isLoading, isDark, cardBg, cardBorder, textColor, subtitleColor }) {
    return (
        <Dialog.Root open={Boolean(payment)} onOpenChange={(event) => !event.open && onClose()} size="md" placement="center">
            <Portal>
                <Dialog.Backdrop backdropFilter="blur(6px)" bg={isDark ? 'blackAlpha.700' : 'blackAlpha.400'} />
                <Dialog.Positioner>
                    <Dialog.Content bg={cardBg} borderColor={cardBorder} borderWidth="1px" borderRadius="2xl" overflow="hidden" maxW="460px" w="calc(100% - 32px)">
                        <Box position="absolute" top="0" left="0" right="0" h="4px" bgGradient="linear(to-r, red.500, red.300)" />
                        <Dialog.Header color={textColor} fontSize="xl" fontWeight="bold" pt={7} pb={4} borderBottomWidth="1px" borderColor={cardBorder}>
                            <HStack gap={3}>
                                <Box p={3} borderRadius="xl" bg={isDark ? 'rgba(239,68,68,.15)' : 'red.50'} color="red.500"><LuCircleX size={22} /></Box>
                                <span>To‘lovni bekor qilish</span>
                            </HStack>
                        </Dialog.Header>
                        <Dialog.CloseTrigger asChild>
                            <Button variant="ghost" color={subtitleColor} size="sm" position="absolute" top="3" right="3" aria-label="Yopish"><LuX /></Button>
                        </Dialog.CloseTrigger>
                        <Dialog.Body py={5}>
                            <Text color={textColor} fontSize="sm">
                                <strong>{formatNumber(payment?.amount ?? 0)} so‘m</strong> miqdoridagi to‘lovni bekor qilasizmi?
                                Summa kassaga qaytarilib, yetkazib beruvchi balansidan ayriladi. Bekor qilingan yozuv tarixda qoladi.
                            </Text>
                        </Dialog.Body>
                        <Dialog.Footer gap={3} borderTopWidth="1px" borderColor={cardBorder}>
                            <Button variant="ghost" onClick={onClose} color={subtitleColor}>Ortga</Button>
                            <Button className="px-[10px]" onClick={onConfirm} disabled={isLoading} bg="red.500"  color="white" borderRadius="xl" _hover={{ bg: 'red.600' }}>
                                {isLoading ? <HStack gap={2}><Spinner size="sm" /><span>Bekor qilinmoqda...</span></HStack> : 'Ha, bekor qilish'}
                            </Button>
                        </Dialog.Footer>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
}

CancelPaymentDialog.propTypes = {
    payment: PropTypes.shape({
        amount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    }),
    onClose: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    isLoading: PropTypes.bool.isRequired,
    isDark: PropTypes.bool.isRequired,
    cardBg: PropTypes.string.isRequired,
    cardBorder: PropTypes.string.isRequired,
    textColor: PropTypes.string.isRequired,
    subtitleColor: PropTypes.string.isRequired,
};

export default function SupplierPaymentHistory({ supplier }) {
    const supplierId = supplier?.id;
    const [page, setPage] = useState(0);
    const [status, setStatus] = useState('');
    const [paidFrom, setPaidFrom] = useState('');
    const [paidTo, setPaidTo] = useState('');
    const [paymentToCancel, setPaymentToCancel] = useState(null);
    const {
        data: paymentResult,
        isLoading: isLoadingPayments,
        isFetching: isFetchingPayments,
        isError: paymentsError,
    } = useGetSupplierPaymentsQuery({
        supplierId,
        status: status || undefined,
        paidFrom: paidFrom || undefined,
        paidTo: paidTo || undefined,
        page,
        size: PAGE_SIZE,
        sort: ['paidAt,DESC', 'createdAt,DESC'],
    }, { skip: !supplierId });
    const [cancelSupplierPayment, { isLoading: isCancelling }] = useCancelSupplierPaymentMutation();
    const { isDark, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();

    const payments = paymentResult?.items ?? [];
    const pagination = paymentResult?.pagination;
    const totalPages = pagination?.totalPages ?? 0;
    const totalElements = pagination?.totalElements ?? 0;
    const tableBg = isDark ? BRAND_COLORS.darkCardBg : cardBg;
    const tableHeaderBg = isDark ? tableBg : '#F8FAFC';
    const tableBorder = isDark ? cardBorder : '#CBD5E1';
    const cellBorder = { borderWidth: '0.5px', borderColor: tableBorder, verticalAlign: 'middle', px: 3, py: 2.5 };
    const headerCell = { ...cellBorder, bg: tableHeaderBg, color: subtitleColor, fontSize: 'xs', fontWeight: 'semibold', textTransform: 'uppercase', letterSpacing: 'wider' };

    useEffect(() => {
        if (paymentsError) Alert('To‘lovlar tarixini yuklashda xatolik', 'error');
    }, [paymentsError]);

    const handleCancel = async () => {
        if (!paymentToCancel || isCancelling) return;
        try {
            await cancelSupplierPayment({
                id: paymentToCancel.id,
                supplierId,
                cashboxId: paymentToCancel.cashboxId,
            }).unwrap();
            Alert('To‘lov bekor qilindi', 'success');
            setPaymentToCancel(null);
        } catch (error) {
            Alert(error?.data?.message || 'To‘lovni bekor qilishda xatolik', 'error');
        }
    };

    useEffect(() => {
        setPage(0);
        setStatus('');
        setPaidFrom('');
        setPaidTo('');
        setPaymentToCancel(null);
    }, [supplierId]);

    const clearFilters = () => {
        setStatus('');
        setPaidFrom('');
        setPaidTo('');
        setPage(0);
    };

    return (
        <Box
            bg={cardBg}
            borderWidth="1px"
            borderColor={cardBorder}
            borderRadius="2xl"
            overflow="hidden"
            boxShadow={isDark ? '0 12px 30px rgba(0,0,0,.16)' : '0 8px 22px rgba(15,23,42,.06)'}
        >
            <HStack justify="space-between" flexWrap="wrap" gap={3} p={{ base: 4, md: 5 }} borderBottomWidth="1px" borderColor={cardBorder}>
                <Box>
                    <HStack gap={2} color={accentColor}>
                        <LuHistory size={18} />
                        <Text fontWeight="bold" color={textColor} fontSize="lg">To‘lovlar tarixi</Text>
                    </HStack>
                    <Text color={subtitleColor} fontSize="sm" mt={1}>{totalElements} ta yozuv</Text>
                </Box>
                <HStack gap={2} color={subtitleColor} fontSize="sm">
                    <LuWallet size={16} />
                    <span>Balans:</span>
                    <Text as="span" color={accentColor} fontWeight="bold">{formatNumber(supplier?.balance ?? 0)} so‘m</Text>
                </HStack>
            </HStack>

            <VStack align="stretch" gap={4} p={{ base: 3, md: 5 }}>
                <SimpleGrid columns={{ base: 1, md: 3 }} gap={3}>
                    <FormControl as="select" value={status} aria-label="To‘lov holati bo‘yicha filtrlash" onChange={(event) => { setStatus(event.target.value); setPage(0); }}>
                        <option value="">Barcha holatlar</option>
                        <option value="ACTIVE">Faol</option>
                        <option value="CANCELLED">Bekor qilingan</option>
                    </FormControl>
                    <FormControl type="date" aria-label="Boshlanish sanasi" value={paidFrom} onChange={(event) => { setPaidFrom(event.target.value); setPage(0); }} />
                    <HStack>
                        <FormControl type="date" aria-label="Tugash sanasi" value={paidTo} onChange={(event) => { setPaidTo(event.target.value); setPage(0); }} />
                        {(status || paidFrom || paidTo) && <Button variant="ghost" onClick={clearFilters} color={subtitleColor} aria-label="Filtrlarni tozalash"><LuX /></Button>}
                    </HStack>
                </SimpleGrid>

                <Box overflowX="auto" borderWidth="1px" borderColor={tableBorder} borderRadius="xl">
                    <Table.Root size="sm" bg={tableBg} borderCollapse="collapse" minW="900px">
                        <Table.Header bg={tableHeaderBg}>
                            <Table.Row bg={tableHeaderBg}>
                                <Table.ColumnHeader {...headerCell}>Sana</Table.ColumnHeader>
                                <Table.ColumnHeader {...headerCell}>Kassa</Table.ColumnHeader>
                                <Table.ColumnHeader {...headerCell} textAlign="right">Summa</Table.ColumnHeader>
                                <Table.ColumnHeader {...headerCell} textAlign="right">Balansdan keyin</Table.ColumnHeader>
                                <Table.ColumnHeader {...headerCell}>Izoh</Table.ColumnHeader>
                                <Table.ColumnHeader {...headerCell}>Holat</Table.ColumnHeader>
                                <Table.ColumnHeader {...headerCell} textAlign="center">Amal</Table.ColumnHeader>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body bg={tableBg}>
                            {payments.map((payment) => (
                                <Table.Row key={payment.id} bg={tableBg} _hover={{ bg: isDark ? 'rgba(250,204,21,.06)' : '#FFFBEB' }}>
                                    <Table.Cell {...cellBorder}><HStack gap={2} color={textColor}><LuCalendar size={14} color={subtitleColor} /><Text whiteSpace="nowrap">{formatPaidDate(payment.paidAt)}</Text></HStack></Table.Cell>
                                    <Table.Cell {...cellBorder} color={textColor}>{payment.cashboxName || '—'}</Table.Cell>
                                    <Table.Cell {...cellBorder} textAlign="right"><Text fontWeight="bold" color={textColor} whiteSpace="nowrap">{formatNumber(payment.amount)} so‘m</Text></Table.Cell>
                                    <Table.Cell {...cellBorder} textAlign="right"><Text color={subtitleColor} whiteSpace="nowrap">{formatNumber(payment.supplierBalance)} so‘m</Text></Table.Cell>
                                    <Table.Cell {...cellBorder} color={subtitleColor} maxW="240px"><Text noOfLines={2}>{payment.summary || '—'}</Text></Table.Cell>
                                    <Table.Cell {...cellBorder}>
                                        <Badge colorPalette={payment.status === 'ACTIVE' ? 'green' : 'red'} variant="subtle">
                                            {payment.status === 'ACTIVE' ? 'Faol' : 'Bekor qilingan'}
                                        </Badge>
                                        {payment.cancelledAt && <Text color={subtitleColor} fontSize="xs" mt={1}>{formatDetailDate(payment.cancelledAt)}</Text>}
                                    </Table.Cell>
                                    <Table.Cell {...cellBorder} textAlign="center">
                                        {payment.status === 'ACTIVE' && (
                                            <Button size="sm" variant="ghost" color={isDark ? 'red.300' : 'red.600'} onClick={() => setPaymentToCancel(payment)} aria-label="To‘lovni bekor qilish">
                                                <LuCircleX size={16} /> Bekor qilish
                                            </Button>
                                        )}
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                            {!isLoadingPayments && payments.length === 0 && (
                                <Table.Row><Table.Cell colSpan={7} py={10} textAlign="center" color={subtitleColor}>
                                    {status || paidFrom || paidTo ? 'Filtr bo‘yicha to‘lov topilmadi' : 'Hozircha to‘lovlar tarixi bo‘sh'}
                                </Table.Cell></Table.Row>
                            )}
                        </Table.Body>
                    </Table.Root>
                    {(isLoadingPayments || isFetchingPayments) && (
                        <HStack justify="center" py={4} color={subtitleColor}><Spinner size="sm" color={accentColor} /><Text fontSize="sm">Tarix yuklanmoqda...</Text></HStack>
                    )}
                </Box>

                {totalPages > 1 && (
                    <HStack justify="center" gap={3}>
                        <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((current) => current - 1)}><LuChevronLeft /></Button>
                        <Text color={subtitleColor} fontSize="sm">{page + 1} / {totalPages}</Text>
                        <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage((current) => current + 1)}><LuChevronRight /></Button>
                    </HStack>
                )}
            </VStack>
            <CancelPaymentDialog
                payment={paymentToCancel}
                onClose={() => setPaymentToCancel(null)}
                onConfirm={handleCancel}
                isLoading={isCancelling}
                isDark={isDark}
                cardBg={cardBg}
                cardBorder={cardBorder}
                textColor={textColor}
                subtitleColor={subtitleColor}
            />
        </Box>
    );
}

SupplierPaymentHistory.propTypes = {
    supplier: PropTypes.shape({
        id: PropTypes.string.isRequired,
        balance: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    }).isRequired,
};
