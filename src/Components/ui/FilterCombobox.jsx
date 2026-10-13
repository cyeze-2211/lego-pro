import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import { LuCheck, LuChevronDown, LuSearch, LuX } from 'react-icons/lu';
import { useAppTheme } from '../../theme/tokens';
import FormControl from './FormControl';

/** Qidiruv uchun matnni soddalashtiradi: registr, apostroflar (o‘ / o' / oʻ) va ortiqcha bo‘shliqlar farq qilmaydi */
export const normalizeSearch = (value) => String(value ?? '')
    .toLowerCase()
    .replace(/[‘’ʻ'`´]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Qidiruvli filtr tanlovi (select o‘rniga): bosilganda ro‘yxat va qidiruv maydoni ochiladi,
 * yozilgan matn bo‘yicha variantlar jonli filtrlanadi, klaviatura bilan boshqariladi.
 * options: [{ id, label, meta? }] — meta tanlov ostida kichik matn (masalan, telefon).
 */
export default function FilterCombobox({
    value, onChange, options, allLabel = 'Barchasi', icon: Icon, placeholder = 'Qidiring...',
    emptyText = 'Topilmadi', disabled = false, errorText, h = '42px', ariaLabel, w = '100%',
}) {
    const { isDark, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [highlight, setHighlight] = useState(0);
    const rootRef = useRef(null);
    const listRef = useRef(null);

    const selected = options.find((option) => String(option.id) === String(value)) || null;

    const filtered = useMemo(() => {
        const q = normalizeSearch(search);
        if (!q) return options;
        const words = q.split(' ');
        return options.filter((option) => {
            const hay = normalizeSearch(`${option.label} ${option.meta ?? ''}`);
            return words.every((word) => hay.includes(word));
        });
    }, [options, search]);

    // «Barchasi» + topilgan variantlar
    const rows = useMemo(() => [{ id: '', label: allLabel, all: true }, ...filtered], [filtered, allLabel]);

    useEffect(() => { setHighlight(0); }, [search, open]);

    useEffect(() => {
        if (!open) return undefined;
        const onDown = (event) => { if (rootRef.current && !rootRef.current.contains(event.target)) close(); };
        document.addEventListener('mousedown', onDown);
        setTimeout(() => rootRef.current?.querySelector('input')?.focus(), 0);
        return () => document.removeEventListener('mousedown', onDown);
    }, [open]);

    // Belgilangan qator ko‘rinib tursin
    useEffect(() => {
        const node = listRef.current?.children?.[highlight];
        node?.scrollIntoView?.({ block: 'nearest' });
    }, [highlight]);

    const close = () => { setOpen(false); setSearch(''); };
    const pick = (row) => { onChange(row.all ? '' : String(row.id)); close(); };
    const toggle = () => { if (!disabled) (open ? close() : setOpen(true)); };

    const onKeyDown = (event) => {
        if (event.key === 'ArrowDown') { event.preventDefault(); setHighlight((h) => Math.min(h + 1, rows.length - 1)); }
        else if (event.key === 'ArrowUp') { event.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); }
        else if (event.key === 'Enter') { event.preventDefault(); if (rows[highlight]) pick(rows[highlight]); }
        else if (event.key === 'Escape') { event.preventDefault(); close(); }
    };

    const active = Boolean(selected);
    const fieldBorder = active ? accentColor : (isDark ? 'rgba(255,255,255,.12)' : '#CBD5E1');
    const hoverBg = isDark ? 'whiteAlpha.100' : '#FFFBEB';

    return (
        <Box ref={rootRef} position="relative" w={w}>
            {/* Maydon */}
            <HStack
                as="button"
                type="button"
                onClick={toggle}
                onKeyDown={(event) => { if (!open && (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); setOpen(true); } }}
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label={ariaLabel}
                w="100%"
                h={h}
                minH={h}
                px={3.5}
                gap={2}
                borderWidth="1px"
                borderColor={fieldBorder}
                borderRadius="xl"
                bg={isDark ? 'rgba(30,41,59,.8)' : 'white'}
                color={textColor}
                textAlign="left"
                cursor={disabled ? 'not-allowed' : 'pointer'}
                opacity={disabled ? 0.6 : 1}
                transition="all .2s"
                _hover={disabled ? {} : { borderColor: accentColor }}
                _focusVisible={{ borderColor: accentColor, boxShadow: `0 0 0 3px ${accentColor}33`, outline: 'none' }}
            >
                {Icon && <Box color={active ? accentColor : subtitleColor} flexShrink={0}><Icon size={16} /></Box>}
                <Text flex="1" fontSize="sm" fontWeight={active ? 'semibold' : 'normal'} color={active ? textColor : subtitleColor} truncate>
                    {errorText || (selected ? selected.label : allLabel)}
                </Text>
                {active ? (
                    <Box
                        as="span"
                        role="button"
                        aria-label="Filtrni tozalash"
                        onClick={(event) => { event.stopPropagation(); onChange(''); close(); }}
                        display="flex" alignItems="center" justifyContent="center"
                        w="22px" h="22px" borderRadius="full" color={subtitleColor} flexShrink={0}
                        _hover={{ bg: isDark ? 'whiteAlpha.200' : 'gray.200', color: textColor }}
                    >
                        <LuX size={13} />
                    </Box>
                ) : (
                    <Box color={subtitleColor} flexShrink={0} transform={open ? 'rotate(180deg)' : 'none'} transition="transform .2s"><LuChevronDown size={15} /></Box>
                )}
            </HStack>

            {/* Ro‘yxat */}
            {open && (
                <Box
                    position="absolute" top="calc(100% + 6px)" left={0} right={0} zIndex={30}
                    bg={cardBg} borderWidth="1px" borderColor={isDark ? cardBorder : '#CBD5E1'} borderRadius="xl"
                    boxShadow={isDark ? '0 16px 40px rgba(0,0,0,.45)' : '0 12px 32px rgba(15,23,42,.16)'}
                    overflow="hidden" minW="240px"
                >
                    <Box p={2} borderBottomWidth="1px" borderColor={isDark ? cardBorder : '#E2E8F0'} position="relative">
                        <Box position="absolute" left={5} top="50%" transform="translateY(-50%)" color={subtitleColor} pointerEvents="none" zIndex={1}><LuSearch size={14} /></Box>
                        <FormControl
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            onKeyDown={onKeyDown}
                            placeholder={placeholder}
                            pl={9}
                            h="38px"
                            minH="38px"
                            py={0}
                            fontSize="sm"
                            autoComplete="off"
                            role="combobox"
                            aria-expanded="true"
                            aria-autocomplete="list"
                        />
                    </Box>
                    <VStack ref={listRef} role="listbox" align="stretch" gap={0} maxH="280px" overflowY="auto" py={1}>
                        {rows.map((row, index) => {
                            const isSelected = row.all ? !active : String(row.id) === String(value);
                            return (
                                <HStack
                                    key={row.all ? '__all' : row.id}
                                    as="button"
                                    type="button"
                                    role="option"
                                    aria-selected={isSelected}
                                    onMouseDown={(event) => event.preventDefault()}
                                    onMouseEnter={() => setHighlight(index)}
                                    onClick={() => pick(row)}
                                    w="100%" textAlign="left" px={3.5} py={2} gap={3} justify="space-between"
                                    bg={index === highlight ? hoverBg : 'transparent'}
                                    borderBottomWidth={row.all && filtered.length > 0 ? '1px' : 0}
                                    borderColor={isDark ? cardBorder : '#F1F5F9'}
                                >
                                    <VStack align="start" gap={0} minW={0}>
                                        <Text fontSize="sm" fontWeight={isSelected ? 'bold' : row.all ? 'semibold' : 'medium'} color={row.all && !isSelected ? subtitleColor : textColor} truncate maxW="100%">{row.label}</Text>
                                        {row.meta && <Text fontSize="xs" color={subtitleColor}>{row.meta}</Text>}
                                    </VStack>
                                    {isSelected && <Box color={accentColor} flexShrink={0}><LuCheck size={15} /></Box>}
                                </HStack>
                            );
                        })}
                        {filtered.length === 0 && (
                            <Text px={3.5} py={3} fontSize="sm" color={subtitleColor}>{emptyText} «{search.trim()}»</Text>
                        )}
                    </VStack>
                    {options.length > 8 && (
                        <Box px={3.5} py={1.5} borderTopWidth="1px" borderColor={isDark ? cardBorder : '#E2E8F0'}>
                            <Text fontSize="xs" color={subtitleColor}>{filtered.length} / {options.length} ta · ↑↓ va Enter bilan tanlang</Text>
                        </Box>
                    )}
                </Box>
            )}
        </Box>
    );
}

FilterCombobox.propTypes = {
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    onChange: PropTypes.func.isRequired,
    options: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        label: PropTypes.string.isRequired,
        meta: PropTypes.string,
    })).isRequired,
    allLabel: PropTypes.string,
    icon: PropTypes.elementType,
    placeholder: PropTypes.string,
    emptyText: PropTypes.string,
    disabled: PropTypes.bool,
    errorText: PropTypes.string,
    h: PropTypes.string,
    w: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    ariaLabel: PropTypes.string,
};
