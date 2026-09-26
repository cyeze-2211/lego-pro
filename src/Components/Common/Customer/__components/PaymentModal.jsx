import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Dialog, Field, HStack, Portal, Spinner, Text, VStack } from '@chakra-ui/react';
import { Check, X } from 'lucide-react';
import { LuCalendarDays, LuDollarSign, LuStickyNote, LuWallet } from 'react-icons/lu';
import { useAppTheme } from '../../../../theme/tokens';
import FormControl from '../../../ui/FormControl';
import { Alert } from '../../../Other/UI/Alert/Alert';
import { useCreatePaymentMutation } from '../../../../store/services/payment.api';
import { useGetCashboxesQuery } from '../../../../store/services/cashbox.api';
import { formatNumber, parseNumber } from '../../../ui/number-format';

const today = () => new Date().toISOString().slice(0, 10);

/**
 * PaymentModal
 *
 * mode "general"  — header buttoni: salesOrderId yo'q
 * mode "order"    — table buttoni: salesOrderId bor (order.id)
 */
export default function PaymentModal({ open, onClose, customerId, order = null }) {
    const isOrderMode = Boolean(order);

    const [cashboxId, setCashboxId] = useState('');
    const [amount, setAmount] = useState('');
    const [summary, setSummary] = useState('');
    const [paidAt, setPaidAt] = useState(today());

    const { isDark, accentColor, cardBg, cardBorder, textColor, subtitleColor } = useAppTheme();
    const modalBorder = isDark ? cardBorder : '#94A3B8';

    const { data: cashboxes = [], isLoading: cashboxesLoading } = useGetCashboxesQuery();
    const [createPayment, { isLoading }] = useCreatePaymentMutation();

    // reset fields on open
    useEffect(() => {
        if (open) {
            setCashboxId('');
            setAmount('');
            setSummary('');
            setPaidAt(today());
        }
    }, [open]);

    const save = async () => {
        const numericAmount = Number(String(amount).replace(/\s/g, '').replace(',', '.'));
        if (!cashboxId) return Alert('Kassani tanlang', 'error');
        if (!amount || !Number.isFinite(numericAmount) || numericAmount <= 0)
            return Alert('Summa 0 dan katta bo\'lishi kerak', 'error');
        if (!/^\d+(?:[.,]\d{1,2})?$/.test(String(amount).replace(/\s/g, '')))
            return Alert('Summa 2 kasr xonagacha bo\'lishi kerak', 'error');
        if (!paidAt || paidAt > today())
            return Alert('Sana bugun yoki undan oldingi kun bo\'lishi kerak', 'error');

        const payload = {
            customerId,
            cashboxId,
            amount: numericAmount,
            paidAt,
            ...(summary.trim() && { summary: summary.trim() }),
            ...(isOrderMode && { salesOrderId: order.id }),
        };

        try {
            await createPayment(payload).unwrap();
            Alert('To\'lov muvaffaqiyatli qabul qilindi', 'success');
            onClose();
        } catch (error) {
            Alert(error?.data?.message || 'To\'lovda xatolik yuz berdi', 'error');
        }
    };

    return (
        <Dialog.Root open={open} onOpenChange={(e) => !e.open && onClose()} size="md" placement="center">
            <Portal>
                <Dialog.Backdrop backdropFilter="blur(6px)" bg={isDark ? 'blackAlpha.700' : 'blackAlpha.400'} />
                <Dialog.Positioner>
                    <Dialog.Content
                        bg={cardBg}
                        borderColor={modalBorder}
                        borderWidth="1px"
                        borderRadius="2xl"
                        overflow="hidden"
                        maxW="520px"
                        w="calc(100% - 32px)"
                    >
                        {/* top accent bar */}
                        <Box
                            position="absolute"
                            top="0"
                            left="0"
                            right="0"
                            h="4px"
                            bgGradient={`linear(to-r, ${accentColor}, yellow.300)`}
                        />

                        <Dialog.Header
                            color={textColor}
                            fontSize="2xl"
                            fontWeight="bold"
                            pt={7}
                            pb={5}
                            borderBottomWidth="1px"
                            borderColor={modalBorder}
                        >
                            <HStack gap={3}>
                                <Box
                                    p={3}
                                    borderRadius="xl"
                                    bg={isDark ? 'rgba(250,204,21,.1)' : '#FEFCE8'}
                                    color={accentColor}
                                >
                                    <LuWallet size={24} />
                                </Box>
                                <span>To&apos;lov qabul qilish</span>
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
                            >
                                <X />
                            </Button>
                        </Dialog.CloseTrigger>

                        <Dialog.Body py={6}>
                            <VStack gap={5} align="stretch">
                                {/* agar order mode bo'lsa, order ma'lumotlari */}
                                {isOrderMode && (
                                    <Box
                                        px={4}
                                        py={3}
                                        borderRadius="xl"
                                        borderWidth="1px"
                                        borderColor={modalBorder}
                                        bg={isDark ? 'rgba(250,204,21,.06)' : '#FFFBEB'}
                                    >
                                        <Text fontSize="xs" color={subtitleColor} mb={1}>
                                            Zayavka bo&apos;yicha to&apos;lov
                                        </Text>
                                        <HStack justify="space-between" flexWrap="wrap" gap={2}>
                                            <Text color={textColor} fontWeight="semibold" fontSize="sm">
                                                Jami summa: {formatNumber(order.totalAmount ?? 0)} so&apos;m
                                            </Text>
                                            <Text color={subtitleColor} fontSize="sm">
                                                Qolgan qarz: {formatNumber(order.remainingDebt ?? 0)} so&apos;m
                                            </Text>
                                        </HStack>
                                    </Box>
                                )}

                                {/* kassa */}
                                <Field.Root required>
                                    <Field.Label color={textColor}>
                                        <HStack gap={2}>
                                            <LuWallet size={16} />
                                            <span>Kassa</span>
                                        </HStack>
                                        <Field.RequiredIndicator />
                                    </Field.Label>
                                    {cashboxesLoading ? (
                                        <HStack>
                                            <Spinner size="sm" color={accentColor} />
                                            <Text color={subtitleColor} fontSize="sm">
                                                Kassalar yuklanmoqda...
                                            </Text>
                                        </HStack>
                                    ) : (
                                        <FormControl
                                            as="select"
                                            value={cashboxId}
                                            onChange={(e) => setCashboxId(e.target.value)}
                                        >
                                            <option value="">Kassani tanlang</option>
                                            {cashboxes.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name}
                                                </option>
                                            ))}
                                        </FormControl>
                                    )}
                                </Field.Root>

                                {/* summa + sana */}
                                <HStack align="start" flexDirection={{ base: 'column', sm: 'row' }}>
                                    <Field.Root required flex="1" w="100%">
                                        <Field.Label color={textColor}>
                                            <HStack gap={2}>
                                                <LuDollarSign size={16} />
                                                <span>Summa (so&apos;m)</span>
                                            </HStack>
                                            <Field.RequiredIndicator />
                                        </Field.Label>
                                        <FormControl
                                            value={amount}
                                            onChange={(e) => {
                                                // strip all spaces and non-numeric except dot/comma
                                                const raw = e.target.value.replace(/\s/g, '').replace(',', '.');
                                                // allow only digits and one decimal separator
                                                if (raw === '' || /^\d*\.?\d{0,2}$/.test(raw)) {
                                                    const num = Number(raw);
                                                    if (raw === '' || raw.endsWith('.')) {
                                                        // typing in progress — show raw
                                                        setAmount(raw);
                                                    } else if (Number.isFinite(num)) {
                                                        // format integer part with spaces, keep decimals
                                                        const [int, dec] = raw.split('.');
                                                        const formatted = Number(int).toLocaleString('ru-RU').replace(/\u00A0/g, ' ');
                                                        setAmount(dec !== undefined ? `${formatted}.${dec}` : formatted);
                                                    }
                                                }
                                            }}
                                            inputMode="decimal"
                                            placeholder="0"
                                        />
                                    </Field.Root>

                                    <Field.Root required flex="1" w="100%">
                                        <Field.Label color={textColor}>
                                            <HStack gap={2}>
                                                <LuCalendarDays size={16} />
                                                <span>Sana</span>
                                            </HStack>
                                            <Field.RequiredIndicator />
                                        </Field.Label>
                                        <FormControl
                                            type="date"
                                            value={paidAt}
                                            max={today()}
                                            onChange={(e) => setPaidAt(e.target.value)}
                                        />
                                    </Field.Root>
                                </HStack>

                                {/* izoh — general modeda ko'rsatiladi */}
                                {!isOrderMode && (
                                    <Field.Root>
                                        <Field.Label color={textColor}>
                                            <HStack gap={2}>
                                                <LuStickyNote size={16} />
                                                <span>Izoh (ixtiyoriy)</span>
                                            </HStack>
                                        </Field.Label>
                                        <FormControl
                                            as="textarea"
                                            rows={3}
                                            value={summary}
                                            onChange={(e) => setSummary(e.target.value)}
                                            maxLength={500}
                                            placeholder="Masalan: Naqd, bank orqali..."
                                        />
                                    </Field.Root>
                                )}
                            </VStack>
                        </Dialog.Body>

                        <Dialog.Footer gap={3} pt={5} pb={6} borderTopWidth="1px" borderColor={modalBorder}>
                            <Button variant="ghost" onClick={onClose} color={subtitleColor}>
                                Bekor qilish
                            </Button>
                            <Button
                                onClick={save}
                                disabled={isLoading}
                                bg={accentColor}
                                color="black"
                                borderRadius="xl"
                                px={8}
                            >
                                {isLoading ? (
                                    <HStack>
                                        <Spinner size="sm" />
                                        <span>Saqlanmoqda...</span>
                                    </HStack>
                                ) : (
                                    <HStack>
                                        <Check size={18} />
                                        <span>To&apos;lovni qabul qilish</span>
                                    </HStack>
                                )}
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
    customerId: PropTypes.string.isRequired,
    /** order mode uchun: { id, totalAmount, remainingDebt } */
    order: PropTypes.shape({
        id: PropTypes.string,
        totalAmount: PropTypes.number,
        remainingDebt: PropTypes.number,
    }),
};
