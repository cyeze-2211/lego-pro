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
    Text,
    VStack,
} from '@chakra-ui/react';
import { X } from 'lucide-react';
import { LuCalendarDays, LuDollarSign, LuStickyNote, LuWallet } from 'react-icons/lu';
import { useGetCashboxesQuery } from '../../../../store/services/cashbox.api';
import { useCreateSupplierPaymentMutation } from '../../../../store/services/supplierPayment.api';
import { useAppTheme } from '../../../../theme/tokens';
import { Alert } from '../../../Other/UI/Alert/Alert';
import FormControl from '../../../ui/FormControl';
import { formatNumber, parseNumber } from '../../../ui/number-format';
import { formatTypedAmount } from '../../../ui/UsdCalculator';

const today = () => {
    const date = new Date();
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
};

export default function PaymentModal({ open, onClose, supplierId, supplierName }) {
    const [cashboxId, setCashboxId] = useState('');
    const [amount, setAmount] = useState('');
    const [paidAt, setPaidAt] = useState(today());
    const [summary, setSummary] = useState('');
    const { isDark, accentColor, cardBg, cardBorder, textColor, subtitleColor } = useAppTheme();
    const { data: cashboxes = [], isLoading: isLoadingCashboxes, isError: cashboxesError } = useGetCashboxesQuery();
    const [createSupplierPayment, { isLoading }] = useCreateSupplierPaymentMutation();

    useEffect(() => {
        if (open) {
            setCashboxId('');
            setAmount('');
            setPaidAt(today());
            setSummary('');
        }
    }, [open]);

    useEffect(() => {
        if (cashboxesError) Alert('Kassalar ro‘yxatini yuklashda xatolik', 'error');
    }, [cashboxesError]);

    const handleAmountChange = (event) => {
        const formatted = formatTypedAmount(event.target.value);
        if (formatted !== null) setAmount(formatted);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (isLoading) return;

        const numericAmount = Number(parseNumber(amount));
        if (!cashboxId) {
            Alert('Kassani tanlang', 'error');
            return;
        }
        if (!amount || !Number.isFinite(numericAmount) || numericAmount <= 0) {
            Alert('Summa 0 dan katta bo‘lishi kerak', 'error');
            return;
        }
        if (!paidAt || paidAt > today()) {
            Alert('Sana bugun yoki undan oldingi kun bo‘lishi kerak', 'error');
            return;
        }

        try {
            await createSupplierPayment({
                supplierId,
                cashboxId,
                amount: numericAmount,
                paidAt,
                ...(summary.trim() ? { summary: summary.trim() } : {}),
            }).unwrap();
            Alert('Yetkazib beruvchi balansi to‘ldirildi', 'success');
            onClose();
        } catch (error) {
            Alert(error?.data?.message || 'To‘lovni saqlashda xatolik', 'error');
        }
    };

    const modalBorder = isDark ? cardBorder : '#94A3B8';

    return (
        <Dialog.Root open={open} onOpenChange={(event) => !event.open && onClose()} size="lg" placement="center">
            <Portal>
                <Dialog.Backdrop backdropFilter="blur(6px)" bg={isDark ? 'blackAlpha.700' : 'blackAlpha.400'} />
                <Dialog.Positioner>
                    <Dialog.Content bg={cardBg} borderColor={modalBorder} borderWidth="1px" borderRadius="2xl" overflow="hidden" maxW="560px" w="calc(100% - 32px)">
                        <Box position="absolute" top="0" left="0" right="0" h="4px" bgGradient={`linear(to-r, ${accentColor}, yellow.300)`} />
                        <Dialog.Header color={textColor} fontSize="2xl" fontWeight="bold" pt={7} pb={5} borderBottomWidth="1px" borderColor={modalBorder}>
                            <HStack gap={3}>
                                <Box p={3} borderRadius="xl" bg={isDark ? 'rgba(250,204,21,.1)' : '#FEFCE8'} color={accentColor}>
                                    <LuWallet size={24} />
                                </Box>
                                <VStack align="start" gap={0}>
                                    <span>Balansni to‘ldirish</span>
                                    <Text color={subtitleColor} fontSize="sm" fontWeight="normal">{supplierName}</Text>
                                </VStack>
                            </HStack>
                        </Dialog.Header>
                        <Dialog.CloseTrigger asChild>
                            <Button variant="ghost" color={subtitleColor} size="sm" position="absolute" top="3" right="3" aria-label="Yopish">
                                <X />
                            </Button>
                        </Dialog.CloseTrigger>
                        <Dialog.Body py={6}>
                            <form id="supplier-payment-form" onSubmit={handleSubmit}>
                                <VStack gap={5} align="stretch">
                                    <Field.Root required>
                                        <Field.Label color={textColor}>
                                            <HStack gap={2}><LuWallet size={16} /><span>Kassa</span><Field.RequiredIndicator /></HStack>
                                        </Field.Label>
                                        {isLoadingCashboxes ? (
                                            <HStack><Spinner size="sm" color={accentColor} /><Text color={subtitleColor} fontSize="sm">Kassalar yuklanmoqda...</Text></HStack>
                                        ) : (
                                            <FormControl as="select" value={cashboxId} onChange={(event) => setCashboxId(event.target.value)} disabled={cashboxesError}>
                                                <option value="">Kassani tanlang</option>
                                                {cashboxes.map((cashbox) => (
                                                    <option key={cashbox.id} value={cashbox.id}>
                                                        {cashbox.name} ({formatNumber(cashbox.balance)} so‘m)
                                                    </option>
                                                ))}
                                            </FormControl>
                                        )}
                                    </Field.Root>
                                    <Field.Root required>
                                        <Field.Label color={textColor}>
                                            <HStack gap={2}><LuDollarSign size={16} /><span>Summa (so‘m)</span><Field.RequiredIndicator /></HStack>
                                        </Field.Label>
                                        <FormControl value={amount} onChange={handleAmountChange} inputMode="decimal" placeholder="Masalan, 300 000" />
                                        <Field.HelperText color={subtitleColor}>Kassa qoldig‘i yetarli bo‘lmasa ham to‘lov rasmiylashtiriladi.</Field.HelperText>
                                    </Field.Root>
                                    <Field.Root required>
                                        <Field.Label color={textColor}>
                                            <HStack gap={2}><LuCalendarDays size={16} /><span>To‘lov sanasi</span><Field.RequiredIndicator /></HStack>
                                        </Field.Label>
                                        <FormControl type="date" value={paidAt} max={today()} onChange={(event) => setPaidAt(event.target.value)} />
                                    </Field.Root>
                                    <Field.Root>
                                        <Field.Label color={textColor}>
                                            <HStack gap={2}><LuStickyNote size={16} /><span>Izoh (ixtiyoriy)</span></HStack>
                                        </Field.Label>
                                        <FormControl as="textarea" value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="To‘lov haqida izoh" minH="90px" />
                                    </Field.Root>
                                </VStack>
                            </form>
                        </Dialog.Body>
                        <Dialog.Footer gap={3} pt={5} pb={6} borderTopWidth="1px" borderColor={modalBorder}>
                            <Button variant="ghost" onClick={onClose} color={subtitleColor}>Bekor qilish</Button>
                            <Button type="submit" form="supplier-payment-form" disabled={isLoading || isLoadingCashboxes || cashboxesError} bg={accentColor} color="black" borderRadius="xl" px={6}>
                                {isLoading ? <HStack gap={2}><Spinner size="sm" /><span>Saqlanmoqda...</span></HStack> : 'To‘lovni saqlash'}
                            </Button>
                        </Dialog.Footer>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
}

PaymentModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    supplierId: PropTypes.string.isRequired,
    supplierName: PropTypes.string,
};
