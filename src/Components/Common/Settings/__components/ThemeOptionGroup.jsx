import { useRef } from 'react';
import PropTypes from 'prop-types';
import { Box, HStack, SimpleGrid, Text } from '@chakra-ui/react';
import { LuCheck } from 'react-icons/lu';
import { BRAND_COLORS, useAppTheme } from '../../../../theme/tokens';

/* ── Mavzu ko‘rinishining kichik maketi ─────────────────────────────────── */
const PREVIEW_SURFACES = {
    light: { bg: BRAND_COLORS.lightBg, sidebar: BRAND_COLORS.lightSidebarBg, card: BRAND_COLORS.lightCardBg, line: '#E2E8F0', border: '#E2E8F0' },
    dark: { bg: BRAND_COLORS.darkBg, sidebar: BRAND_COLORS.darkSidebarBg, card: BRAND_COLORS.darkCardBg, line: 'rgba(255,255,255,0.14)', border: 'rgba(255,255,255,0.1)' },
};

export function ThemePreview({ mode, accent }) {
    const s = PREVIEW_SURFACES[mode];
    const bar = (w, h = '5px', bg = s.line) => <Box h={h} w={w} borderRadius="sm" bg={bg} />;

    return (
        <Box aria-hidden display="flex" h="5.5rem" borderRadius="lg" overflow="hidden" bg={s.bg} borderWidth="1px" borderColor={s.border}>
            <Box w="28%" bg={s.sidebar} borderRightWidth="1px" borderColor={s.border} p={1.5} display="flex" flexDirection="column" gap={1.5}>
                {bar('100%', '7px', accent)}
                {bar('80%')}
                {bar('65%')}
                {bar('72%')}
            </Box>
            <Box flex={1} p={2} display="flex" flexDirection="column" gap={1.5} minW={0}>
                {bar('45%', '6px')}
                <Box flex={1} bg={s.card} borderRadius="md" borderWidth="1px" borderColor={s.border} p={1.5} display="flex" flexDirection="column" justifyContent="space-between">
                    {bar('70%')}
                    {bar('50%')}
                    <Box alignSelf="flex-end">{bar('2.25rem', '10px', accent)}</Box>
                </Box>
            </Box>
        </Box>
    );
}

ThemePreview.propTypes = {
    mode: PropTypes.oneOf(['light', 'dark']).isRequired,
    accent: PropTypes.string.isRequired,
};

/* ── Variantlar guruhi (radiogroup: strelkalar bilan almashtiriladi) ─────── */
export default function ThemeOptionGroup({ label, options, value, onChange }) {
    const { isDark, cardBg, cardBorder, textColor, subtitleColor, accentColor, accentDarkText } = useAppTheme();
    const refs = useRef([]);
    const selectedIndex = options.findIndex((o) => o.value === value);
    const focusableIndex = selectedIndex === -1 ? 0 : selectedIndex;

    const handleKeyDown = (event, index) => {
        const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
        if (!step) return;
        event.preventDefault();
        const next = (index + step + options.length) % options.length;
        refs.current[next]?.focus();
        onChange(options[next].value);
    };

    return (
        <SimpleGrid role="radiogroup" aria-label={label} columns={{ base: 1, sm: 2 }} gap={3}>
            {options.map((option, index) => {
                const selected = option.value === value;
                return (
                    <Box
                        key={option.value}
                        ref={(el) => { refs.current[index] = el; }}
                        as="button"
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        tabIndex={index === focusableIndex ? 0 : -1}
                        onClick={() => onChange(option.value)}
                        onKeyDown={(event) => handleKeyDown(event, index)}
                        textAlign="left"
                        w="100%"
                        p={3}
                        bg={cardBg}
                        borderRadius="xl"
                        borderWidth="1.5px"
                        borderColor={selected ? accentColor : cardBorder}
                        boxShadow={selected ? `0 0 0 3px ${accentColor}33` : 'none'}
                        cursor="pointer"
                        transition="border-color .15s, box-shadow .15s"
                        _hover={{ borderColor: selected ? accentColor : (isDark ? 'whiteAlpha.400' : 'gray.400') }}
                        _focusVisible={{ outline: '2px solid', outlineColor: accentColor, outlineOffset: '2px' }}
                    >
                        {option.preview}
                        <HStack justify="space-between" align="center" gap={2} mt={2.5}>
                            <Box minW={0}>
                                <Text fontSize="sm" fontWeight="semibold" color={textColor}>{option.label}</Text>
                                <Text fontSize="xs" color={subtitleColor}>{option.description}</Text>
                            </Box>
                            <Box
                                aria-hidden
                                flexShrink={0}
                                w="1.25rem"
                                h="1.25rem"
                                borderRadius="full"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                bg={selected ? accentColor : 'transparent'}
                                color={accentDarkText}
                                borderWidth={selected ? 0 : '1.5px'}
                                borderColor={isDark ? 'whiteAlpha.400' : 'gray.300'}
                            >
                                {selected && <LuCheck size={12} strokeWidth={3} />}
                            </Box>
                        </HStack>
                    </Box>
                );
            })}
        </SimpleGrid>
    );
}

ThemeOptionGroup.propTypes = {
    label: PropTypes.string.isRequired,
    options: PropTypes.arrayOf(PropTypes.shape({
        value: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        description: PropTypes.string,
        preview: PropTypes.node,
    })).isRequired,
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired,
};
