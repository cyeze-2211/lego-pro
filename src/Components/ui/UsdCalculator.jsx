import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Field, HStack, Text } from '@chakra-ui/react';
import { LuArrowLeftRight, LuCalculator, LuDollarSign } from 'react-icons/lu';
import { useAppTheme } from '../../theme/tokens';
import FormControl from './FormControl';
import { formatNumber, parseNumber } from './number-format';
import { Alert } from '../Other/UI/Alert/Alert';

const USD_RATE_KEY = 'payment_usd_rate';

export function formatTypedAmount(raw) {
    const cleaned = String(raw).replace(/\s/g, '').replace(',', '.');
    if (cleaned === '') return '';
    if (!/^\d*\.?\d{0,2}$/.test(cleaned)) return null;
    if (cleaned.endsWith('.')) return cleaned;
    const [int, dec] = cleaned.split('.');
    const formatted = Number(int || 0).toLocaleString('ru-RU').replace(/\u00A0/g, ' ');
    return dec !== undefined ? `${formatted}.${dec}` : formatted;
}

function toNumber(value) {
    const n = Number(parseNumber(String(value || '')));
    return Number.isFinite(n) ? n : 0;
}

function roundMoney(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function CalculatorToggle({ open, onClick }) {
    const { isDark, accentColor, subtitleColor } = useAppTheme();
    return (
        <Button
            type="button"
            variant="outline"
            borderRadius="xl"
            h="52px"
            px={4}
            flexShrink={0}
            alignSelf="end"
            borderColor={open ? accentColor : undefined}
            bg={open ? (isDark ? 'rgba(250,204,21,.12)' : '#FEF3C7') : 'transparent'}
            color={open ? accentColor : subtitleColor}
            onClick={onClick}
            title="Dollar kalkulyatori"
            aria-label="Kalkulyator"
        >
            <HStack gap={2}>
                <LuCalculator size={18} />
                <span>Kalkulyator</span>
            </HStack>
        </Button>
    );
}

CalculatorToggle.propTypes = {
    open: PropTypes.bool.isRequired,
    onClick: PropTypes.func.isRequired,
};

export default function UsdCalculator({ active, onApply, applyLabel = "So'mni summaga qo'yish" }) {
    const { isDark, accentColor, cardBorder, textColor, subtitleColor } = useAppTheme();
    const modalBorder = isDark ? cardBorder : '#94A3B8';
    const [usdRate, setUsdRate] = useState(() => localStorage.getItem(USD_RATE_KEY) || '');
    const [usdAmount, setUsdAmount] = useState('');
    const [uzsAmount, setUzsAmount] = useState('');

    useEffect(() => {
        if (active) {
            setUsdRate(localStorage.getItem(USD_RATE_KEY) || '');
            setUsdAmount('');
            setUzsAmount('');
        }
    }, [active]);

    const applyTyped = (raw, setter) => {
        const next = formatTypedAmount(raw);
        if (next !== null) setter(next);
    };

    const convertFromUsd = (usdRaw, rateRaw = usdRate) => {
        const rate = toNumber(rateRaw);
        const usd = toNumber(usdRaw);
        if (!rate || !usd) {
            setUzsAmount('');
            return;
        }
        setUzsAmount(formatNumber(String(roundMoney(usd * rate))));
    };

    const convertFromUzs = (uzsRaw, rateRaw = usdRate) => {
        const rate = toNumber(rateRaw);
        const uzs = toNumber(uzsRaw);
        if (!rate || !uzs) {
            setUsdAmount('');
            return;
        }
        setUsdAmount(formatNumber(String(roundMoney(uzs / rate))));
    };

    const applyToAmount = () => {
        const uzs = toNumber(uzsAmount);
        if (!uzs) return Alert("Avval dollarni so'mga aylantiring", 'error');
        const formatted = formatTypedAmount(String(roundMoney(uzs)));
        if (formatted !== null) onApply(formatted);
    };

    return (
        <Box
            px={5}
            py={4}
            borderRadius="xl"
            borderWidth="1px"
            borderColor={modalBorder}
            bg={isDark ? 'rgba(250,204,21,.05)' : '#FFFBEB'}
        >
            <HStack justify="space-between" mb={4}>
                <HStack gap={2}>
                    <LuDollarSign size={15} />
                    <Text fontSize="sm" fontWeight="semibold" color={textColor}>
                        Dollar kalkulyatori
                    </Text>
                </HStack>
                <Text fontSize="xs" color={subtitleColor}>USD ↔ so&apos;m</Text>
            </HStack>

            <HStack align="end" gap={3} flexWrap={{ base: 'wrap', md: 'nowrap' }}>
                <Field.Root flex="1" minW="140px">
                    <Field.Label color={subtitleColor} fontSize="xs">Kurs (1 USD)</Field.Label>
                    <FormControl
                        value={usdRate}
                        onChange={(e) => {
                            applyTyped(e.target.value, (next) => {
                                setUsdRate(next);
                                localStorage.setItem(USD_RATE_KEY, next);
                                if (usdAmount) convertFromUsd(usdAmount, next);
                                else if (uzsAmount) convertFromUzs(uzsAmount, next);
                            });
                        }}
                        inputMode="decimal"
                        placeholder="12500"
                    />
                </Field.Root>
                <Field.Root flex="1" minW="140px">
                    <Field.Label color={subtitleColor} fontSize="xs">USD ($)</Field.Label>
                    <FormControl
                        value={usdAmount}
                        onChange={(e) => {
                            applyTyped(e.target.value, (next) => {
                                setUsdAmount(next);
                                convertFromUsd(next);
                            });
                        }}
                        inputMode="decimal"
                        placeholder="0"
                    />
                </Field.Root>
                <Box pb={3} color={accentColor} display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
                    <LuArrowLeftRight size={18} />
                </Box>
                <Field.Root flex="1.2" minW="160px">
                    <Field.Label color={subtitleColor} fontSize="xs">so&apos;m</Field.Label>
                    <FormControl
                        value={uzsAmount}
                        onChange={(e) => {
                            applyTyped(e.target.value, (next) => {
                                setUzsAmount(next);
                                convertFromUzs(next);
                            });
                        }}
                        inputMode="decimal"
                        placeholder="0"
                    />
                </Field.Root>
            </HStack>

            <Button
                mt={4}
                size="sm"
                borderRadius="xl"
                variant="outline"
                borderColor={accentColor}
                color={textColor}
                onClick={applyToAmount}
            >
                {applyLabel}
            </Button>
        </Box>
    );
}

UsdCalculator.propTypes = {
    active: PropTypes.bool,
    onApply: PropTypes.func.isRequired,
    applyLabel: PropTypes.string,
};
