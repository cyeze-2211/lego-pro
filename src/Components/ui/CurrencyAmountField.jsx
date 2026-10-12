import PropTypes from 'prop-types';
import { Box, Button, Field, HStack, SimpleGrid, Text } from '@chakra-ui/react';
import { LuArrowRight, LuBanknote, LuDollarSign } from 'react-icons/lu';
import { useAppTheme } from '../../theme/tokens';
import FormControl from './FormControl';
import { formatTypedAmount } from './UsdCalculator';
import { formatNumber } from './number-format';
import { USD_RATE_KEY, buildCurrencyPayload, currencyUzsAmount, loadSavedRate, toMoney } from './currency';

/**
 * Valyuta bilan summa kiritish: So‘m yoki Dollar.
 * Dollar rejimida USD summasi va kurs kiritiladi, so‘mdagi summa avtomatik hisoblanadi.
 * value = { currency: 'UZS'|'USD', amount: '', usdAmount: '', usdRate: '' } (barchasi formatlangan matn)
 */
export default function CurrencyAmountField({ value, onChange, disabled = false, label = 'Summa', required = true }) {
    const { isDark, textColor, subtitleColor, accentColor } = useAppTheme();
    const isUsd = value.currency === 'USD';
    const uzs = currencyUzsAmount(value);
    const payload = buildCurrencyPayload(value);
    const rateNum = toMoney(value.usdRate);
    const usdNum = toMoney(value.usdAmount);

    const setTyped = (key) => (event) => {
        const next = formatTypedAmount(event.target.value);
        if (next === null) return;
        const patch = { [key]: next };
        if (key === 'usdRate' && next) { try { localStorage.setItem(USD_RATE_KEY, next); } catch { /* xotira mavjud emas */ } }
        onChange({ ...value, ...patch });
    };

    const switchCurrency = (currency) => {
        if (disabled || currency === value.currency) return;
        onChange({ ...value, currency, usdRate: currency === 'USD' ? (value.usdRate || loadSavedRate()) : value.usdRate });
    };

    const segment = (currency, Icon, text) => {
        const active = value.currency === currency;
        return (
            <Button
                key={currency}
                type="button"
                size="sm"
                h="38px"
                px={4}
                borderRadius="lg"
                variant="ghost"
                onClick={() => switchCurrency(currency)}
                disabled={disabled}
                bg={active ? accentColor : 'transparent'}
                color={active ? 'black' : subtitleColor}
                fontWeight="semibold"
                _hover={{ bg: active ? accentColor : (isDark ? 'whiteAlpha.100' : 'gray.200') }}
            >
                <HStack gap={1.5}><Icon size={14} /><span>{text}</span></HStack>
            </Button>
        );
    };

    return (
        <Field.Root required={required}>
            <HStack justify="space-between" align="center" flexWrap="wrap" gap={2} mb={1}>
                <Field.Label color={textColor} mb={0}>
                    <HStack gap={2}><LuDollarSign size={16} /><span>{label}</span></HStack>
                    {required && <Field.RequiredIndicator />}
                </Field.Label>
                <HStack gap={1} p={1} bg={isDark ? 'whiteAlpha.100' : 'gray.100'} borderRadius="xl">
                    {segment('UZS', LuBanknote, 'So‘m')}
                    {segment('USD', LuDollarSign, 'Dollar')}
                </HStack>
            </HStack>

            {!isUsd ? (
                <>
                    <FormControl value={value.amount} onChange={setTyped('amount')} inputMode="decimal" placeholder="Masalan, 150 000" disabled={disabled} />
                    {uzs > 0 && <Field.HelperText color={subtitleColor}>{formatNumber(uzs)} so‘m</Field.HelperText>}
                </>
            ) : (
                <Box w="100%" p={3} borderRadius="xl" borderWidth="1px" borderColor={isDark ? 'rgb(var(--accent-400) / .3)' : 'rgb(var(--accent-warm-200))'} bg={isDark ? 'rgb(var(--accent-400) / .06)' : 'rgb(var(--accent-warm-50))'}>
                    <SimpleGrid columns={{ base: 1, sm: 2 }} gap={3}>
                        <Box>
                            <Text fontSize="xs" fontWeight="semibold" color={subtitleColor} mb={1}>Summa, USD ($)</Text>
                            <FormControl value={value.usdAmount} onChange={setTyped('usdAmount')} inputMode="decimal" placeholder="Masalan, 100" disabled={disabled} autoFocus />
                        </Box>
                        <Box>
                            <Text fontSize="xs" fontWeight="semibold" color={subtitleColor} mb={1}>Kurs (1 USD = so‘m)</Text>
                            <FormControl value={value.usdRate} onChange={setTyped('usdRate')} inputMode="decimal" placeholder="Masalan, 12 500" disabled={disabled} />
                        </Box>
                    </SimpleGrid>
                    <HStack mt={3} gap={2} align="center" flexWrap="wrap">
                        <Text fontSize="sm" color={subtitleColor}>{usdNum > 0 ? formatNumber(usdNum) : '0'} $ × {rateNum > 0 ? formatNumber(rateNum) : '—'}</Text>
                        <LuArrowRight size={14} color={accentColor} />
                        <Text fontSize="lg" fontWeight="bold" color={payload.amount > 0 ? textColor : subtitleColor}>{payload.amount > 0 ? formatNumber(payload.amount) : '0'} so‘m</Text>
                    </HStack>
                    <Text fontSize="xs" color={subtitleColor} mt={1}>Kassaga so‘mdagi summa yoziladi, kurs esa hisobot uchun saqlanadi.</Text>
                </Box>
            )}
        </Field.Root>
    );
}

CurrencyAmountField.propTypes = {
    value: PropTypes.shape({
        currency: PropTypes.oneOf(['UZS', 'USD']).isRequired,
        amount: PropTypes.string,
        usdAmount: PropTypes.string,
        usdRate: PropTypes.string,
    }).isRequired,
    onChange: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
    label: PropTypes.string,
    required: PropTypes.bool,
};

/** Ro‘yxat va tafsilotlar uchun: dollar bo‘lsa «$100 · kurs 12 500» qatori */
export function CurrencyNote({ currency, usdRate, amount, fontSize = 'xs' }) {
    const { subtitleColor } = useAppTheme();
    if (currency !== 'USD') return null;
    const rate = Number(usdRate) || 0;
    const usd = rate > 0 ? Math.round(((Number(amount) || 0) / rate) * 100) / 100 : 0;
    return (
        <Text fontSize={fontSize} color={subtitleColor} whiteSpace="nowrap">
            {usd > 0 ? `$ ${formatNumber(usd)}` : 'USD'} · kurs {rate > 0 ? formatNumber(rate) : '—'}
        </Text>
    );
}
CurrencyNote.propTypes = { currency: PropTypes.string, usdRate: PropTypes.oneOfType([PropTypes.number, PropTypes.string]), amount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]), fontSize: PropTypes.string };
