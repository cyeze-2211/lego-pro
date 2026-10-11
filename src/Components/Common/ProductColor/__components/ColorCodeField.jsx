import PropTypes from 'prop-types';
import { Box, Button, Field, HStack, Text } from '@chakra-ui/react';
import { LuPipette, LuX } from 'react-icons/lu';
import { useAppTheme } from '../../../../theme/tokens';
import FormControl from '../../../ui/FormControl';
import { ColorDot } from '../../../ui/ColorSwatch';
import { isValidHex, normalizeHex } from '../../../ui/color-utils';

/* Tez tanlash uchun keng tarqalgan ranglar */
const PRESETS = [
    { name: 'Oq', code: '#FFFFFF' }, { name: 'Qora', code: '#000000' }, { name: 'Kulrang', code: '#9CA3AF' },
    { name: 'Qizil', code: '#EF4444' }, { name: 'To‘q sariq', code: '#F97316' }, { name: 'Sariq', code: '#FACC15' },
    { name: 'Yashil', code: '#22C55E' }, { name: 'Ko‘k', code: '#3B82F6' }, { name: 'Binafsha', code: '#8B5CF6' },
    { name: 'Pushti', code: '#EC4899' }, { name: 'Jigarrang', code: '#92400E' }, { name: 'Bej', code: '#E7D8C0' },
];

export default function ColorCodeField({ value, onChange, disabled = false }) {
    const { textColor, subtitleColor, accentColor, isDark } = useAppTheme();
    const valid = isValidHex(value);
    const invalid = Boolean(value) && !valid;

    const handleText = (event) => {
        const raw = event.target.value.replace(/[^#0-9A-Fa-f]/g, '').slice(0, 7);
        onChange(raw.startsWith('#') || raw === '' ? raw : `#${raw}`);
    };

    return (
        <Field.Root invalid={invalid}>
            <Field.Label color={textColor} fontWeight="medium">
                <HStack gap={2}><LuPipette size={16} /><span>Rang kodi (HEX)</span></HStack>
                <Text as="span" fontSize="xs" color={subtitleColor} fontWeight="normal" ml={1}>ixtiyoriy</Text>
            </Field.Label>

            <HStack gap={3} align="center" w="100%">
                <Box position="relative" w="52px" h="52px" flexShrink={0}>
                    <ColorDot code={valid ? value : ''} size={52} borderRadius="xl" />
                    <Box
                        as="input"
                        type="color"
                        value={valid ? value : '#FFFFFF'}
                        onChange={(event) => onChange(normalizeHex(event.target.value))}
                        disabled={disabled}
                        aria-label="Rangni tanlash"
                        position="absolute"
                        inset={0}
                        w="100%"
                        h="100%"
                        opacity={0}
                        cursor="pointer"
                    />
                </Box>
                <Box flex={1} position="relative">
                    <FormControl
                        value={value}
                        onChange={handleText}
                        onBlur={() => value && onChange(normalizeHex(value))}
                        placeholder="#FFFFFF"
                        fontFamily="mono"
                        textTransform="uppercase"
                        maxLength={7}
                        disabled={disabled}
                        minH="52px"
                        pr={value ? 11 : 4}
                    />
                    {value && !disabled && (
                        <Button type="button" variant="ghost" size="sm" position="absolute" right={2} top="50%" transform="translateY(-50%)" minW="32px" w="32px" h="32px" p={0} borderRadius="full" color={subtitleColor} aria-label="Kodni tozalash" onClick={() => onChange('')}>
                            <LuX size={15} />
                        </Button>
                    )}
                </Box>
            </HStack>

            {invalid
                ? <Field.ErrorText>Kod #RRGGBB ko‘rinishida bo‘lishi kerak, masalan #FF5733</Field.ErrorText>
                : <Field.HelperText color={subtitleColor}>Doirachani bosib rang tanlang yoki kodni kiriting. Kod bo‘lmasa rang faqat nom bilan saqlanadi.</Field.HelperText>}

            <HStack gap={1.5} flexWrap="wrap" mt={2}>
                {PRESETS.map((preset) => {
                    const active = valid && value.toUpperCase() === preset.code;
                    return (
                        <Box
                            key={preset.code}
                            as="button"
                            type="button"
                            disabled={disabled}
                            onClick={() => onChange(preset.code)}
                            title={`${preset.name} · ${preset.code}`}
                            aria-label={preset.name}
                            w="26px"
                            h="26px"
                            borderRadius="full"
                            bg={preset.code}
                            borderWidth="2px"
                            borderColor={active ? accentColor : (preset.code === '#FFFFFF' ? (isDark ? 'whiteAlpha.400' : 'gray.300') : 'transparent')}
                            boxShadow={active ? `0 0 0 2px ${accentColor}55` : 'inset 0 0 0 1px rgba(0,0,0,.08)'}
                            cursor="pointer"
                            transition="transform .12s"
                            _hover={{ transform: 'scale(1.12)' }}
                        />
                    );
                })}
            </HStack>
        </Field.Root>
    );
}

ColorCodeField.propTypes = { value: PropTypes.string.isRequired, onChange: PropTypes.func.isRequired, disabled: PropTypes.bool };
