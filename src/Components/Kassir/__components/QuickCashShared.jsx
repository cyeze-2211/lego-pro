import PropTypes from 'prop-types';
import { Box, Button, Dialog, Field, HStack, Portal, Spinner, Text, VStack } from '@chakra-ui/react';
import { X } from 'lucide-react';
import { LuWallet } from 'react-icons/lu';
import { useAppTheme } from '../../../theme/tokens';
import FormControl from '../../ui/FormControl';
import { formatNumber } from '../../ui/number-format';

/** Kichik so‘m izohi: qidiruv ro‘yxati va tanlangan karta uchun */
export function BalanceNote({ balance, positiveLabel, negativeLabel, zeroLabel = 'Qarz yo‘q' }) {
    const { isDark, subtitleColor } = useAppTheme();
    const value = Number(balance) || 0;
    if (value === 0) return <Text color={subtitleColor}>{zeroLabel}</Text>;
    const positive = value > 0;
    const color = positive ? (isDark ? 'green.300' : 'green.700') : (isDark ? 'red.300' : 'red.600');
    return (
        <Text color={color} fontWeight="semibold" whiteSpace="nowrap">
            {positive ? positiveLabel : negativeLabel}: {formatNumber(Math.abs(value))} so‘m
        </Text>
    );
}
BalanceNote.propTypes = {
    balance: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    positiveLabel: PropTypes.string.isRequired,
    negativeLabel: PropTypes.string.isRequired,
    zeroLabel: PropTypes.string,
};

/** Kassa tanlash + qoldiq ko‘rsatish; chiqimda qoldiq yetmasa ogohlantiradi */
export function CashboxSelect({ value, onChange, cashboxes, isLoading, isError, amount = 0, outgoing = false, disabled = false }) {
    const { isDark, accentColor, textColor, subtitleColor } = useAppTheme();
    const selected = cashboxes.find((c) => c.id === value);
    const balance = Number(selected?.balance) || 0;
    const short = outgoing && selected && amount > 0 && amount > balance;
    return (
        <Field.Root required>
            <Field.Label color={textColor}>
                <HStack gap={2}><LuWallet size={16} /><span>Kassa</span></HStack>
                <Field.RequiredIndicator />
            </Field.Label>
            {isLoading ? (
                <HStack minH="52px"><Spinner size="sm" color={accentColor} /><Text color={subtitleColor} fontSize="sm">Kassalar yuklanmoqda...</Text></HStack>
            ) : (
                <FormControl as="select" value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled || isError || cashboxes.length === 0}>
                    <option value="">{isError ? 'Kassalarni yuklashda xatolik' : cashboxes.length === 0 ? 'Kassa yo‘q' : 'Kassani tanlang'}</option>
                    {cashboxes.map((cashbox) => (
                        <option key={cashbox.id} value={cashbox.id}>
                            {cashbox.name} — {formatNumber(cashbox.balance)} so‘m
                        </option>
                    ))}
                </FormControl>
            )}
            {selected && (
                <Field.HelperText color={short ? (isDark ? 'orange.300' : 'orange.600') : subtitleColor}>
                    {short
                        ? `Diqqat: kassada ${formatNumber(balance)} so‘m bor, chiqim ${formatNumber(amount)} so‘m. Qoldiq minusga tushadi.`
                        : `Kassa qoldig‘i: ${formatNumber(balance)} so‘m`}
                </Field.HelperText>
            )}
        </Field.Root>
    );
}
CashboxSelect.propTypes = {
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    cashboxes: PropTypes.array.isRequired,
    isLoading: PropTypes.bool,
    isError: PropTypes.bool,
    amount: PropTypes.number,
    outgoing: PropTypes.bool,
    disabled: PropTypes.bool,
};

/** Ikki rejim orasidagi tanlov (Xarajat / Yetkazib beruvchi) */
export function ModeSwitch({ value, onChange, options, disabled = false }) {
    const { isDark, subtitleColor, textColor } = useAppTheme();
    return (
        <HStack gap={1} p={1} bg={isDark ? 'whiteAlpha.100' : 'gray.100'} borderRadius="xl" w="100%">
            {options.map(({ key, label, icon: Icon, color }) => {
                const active = value === key;
                return (
                    <Button
                        key={key}
                        type="button"
                        flex="1"
                        h="42px"
                        px={3}
                        borderRadius="lg"
                        variant="ghost"
                        onClick={() => onChange(key)}
                        disabled={disabled}
                        bg={active ? color : 'transparent'}
                        color={active ? 'white' : subtitleColor}
                        fontWeight="semibold"
                        _hover={{ bg: active ? color : (isDark ? 'whiteAlpha.200' : 'gray.200'), color: active ? 'white' : textColor }}
                    >
                        <HStack gap={2}><Icon size={16} /><span>{label}</span></HStack>
                    </Button>
                );
            })}
        </HStack>
    );
}
ModeSwitch.propTypes = {
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    options: PropTypes.arrayOf(PropTypes.shape({
        key: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        icon: PropTypes.elementType.isRequired,
        color: PropTypes.string.isRequired,
    })).isRequired,
    disabled: PropTypes.bool,
};

/**
 * Tez amal oynasi ramkasi: rangli yuqori chiziq, sarlavha, forma va tugmalar.
 * `tone` — 'in' (yashil, kirim) yoki 'out' (qizil, chiqim).
 */
export function QuickDialog({ open, onClose, tone, icon: Icon, title, subtitle, formId, onSubmit, submitLabel, isSaving, disabled = false, children }) {
    const { isDark, cardBg, cardBorder, textColor, subtitleColor } = useAppTheme();
    const modalBorder = isDark ? cardBorder : '#94A3B8';
    const color = tone === 'in' ? '#10B981' : '#EF4444';
    const softBg = tone === 'in'
        ? (isDark ? 'rgba(16,185,129,.12)' : '#ECFDF5')
        : (isDark ? 'rgba(239,68,68,.12)' : '#FEF2F2');
    const hover = tone === 'in' ? '#059669' : '#DC2626';

    return (
        <Dialog.Root open={open} onOpenChange={(event) => !event.open && !isSaving && onClose()} size="lg" placement="center">
            <Portal>
                <Dialog.Backdrop backdropFilter="blur(6px)" bg={isDark ? 'blackAlpha.700' : 'blackAlpha.400'} />
                <Dialog.Positioner>
                    <Dialog.Content bg={cardBg} borderColor={modalBorder} borderWidth="1px" borderRadius="2xl" overflow="hidden" maxW="600px" w="calc(100% - 32px)">
                        <Box position="absolute" top="0" left="0" right="0" h="4px" bg={`linear-gradient(90deg, ${color}, ${color}99)`} />
                        <Dialog.Header color={textColor} fontSize="2xl" fontWeight="bold" pt={7} pb={5} borderBottomWidth="1px" borderColor={modalBorder}>
                            <HStack gap={3}>
                                <Box p={3} borderRadius="xl" bg={softBg} color={color}><Icon size={24} /></Box>
                                <VStack align="start" gap={0}>
                                    <span>{title}</span>
                                    {subtitle && <Text color={subtitleColor} fontSize="sm" fontWeight="normal">{subtitle}</Text>}
                                </VStack>
                            </HStack>
                        </Dialog.Header>
                        <Dialog.CloseTrigger asChild>
                            <Button variant="ghost" color={subtitleColor} size="sm" w="32px" h="32px" p={0} minW={0} position="absolute" top="3" right="3" aria-label="Yopish" disabled={isSaving}><X /></Button>
                        </Dialog.CloseTrigger>
                        <Dialog.Body py={6}>
                            <form id={formId} onSubmit={onSubmit}>
                                <VStack gap={5} align="stretch">{children}</VStack>
                            </form>
                        </Dialog.Body>
                        <Dialog.Footer gap={3} pt={5} pb={6} borderTopWidth="1px" borderColor={modalBorder}>
                            <Button variant="ghost" onClick={onClose} color={subtitleColor} borderRadius="xl" h="44px" px={5} disabled={isSaving}>Bekor qilish</Button>
                            <Button type="submit" form={formId} disabled={isSaving || disabled} bg={color} color="white" borderRadius="xl" h="44px" px={8} fontWeight="semibold" _hover={{ bg: hover }}>
                                {isSaving ? <HStack gap={2}><Spinner size="sm" /><span>Saqlanmoqda...</span></HStack> : submitLabel}
                            </Button>
                        </Dialog.Footer>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
}
QuickDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    tone: PropTypes.oneOf(['in', 'out']).isRequired,
    icon: PropTypes.elementType.isRequired,
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string,
    formId: PropTypes.string.isRequired,
    onSubmit: PropTypes.func.isRequired,
    submitLabel: PropTypes.node.isRequired,
    isSaving: PropTypes.bool,
    disabled: PropTypes.bool,
    children: PropTypes.node,
};
