import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Field, HStack, Spinner, Text, VStack } from '@chakra-ui/react';
import { LuCheck, LuSearch, LuX } from 'react-icons/lu';
import { useAppTheme } from '../../../theme/tokens';
import FormControl from '../../ui/FormControl';

/**
 * Qidiruvli tanlov: mijoz yoki yetkazib beruvchi.
 * Yozilgan matn `onSearchChange` orqali tashqariga chiqadi, ro‘yxat esa serverdan keladi.
 * Tanlangandan keyin nom + qoldiq ko‘rinadi, «×» bilan qayta tanlash mumkin.
 */
export default function EntityPicker({
    label, icon: Icon, value, onChange, items, isLoading, isError,
    search, onSearchChange, placeholder, renderMeta, emptyText = 'Hech narsa topilmadi', disabled = false, autoFocus = false,
}) {
    const { isDark, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();
    const [open, setOpen] = useState(false);
    const [highlight, setHighlight] = useState(0);
    const rootRef = useRef(null);

    // Tashqariga bosilganda yopamiz
    useEffect(() => {
        if (!open) return undefined;
        const onDown = (event) => {
            if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [open]);

    useEffect(() => { setHighlight(0); }, [items]);

    const select = (item) => {
        onChange(item);
        onSearchChange('');
        setOpen(false);
    };

    const clear = () => {
        if (disabled) return;
        onChange(null);
        onSearchChange('');
        setOpen(true);
        setTimeout(() => rootRef.current?.querySelector('input')?.focus(), 0);
    };

    const onKeyDown = (event) => {
        if (event.key === 'Enter') event.preventDefault(); // forma yuborilib ketmasin
        if (!open) {
            if (event.key === 'ArrowDown' || event.key === 'Enter') setOpen(true);
            return;
        }
        if (event.key === 'ArrowDown') { event.preventDefault(); setHighlight((h) => Math.min(h + 1, Math.max(items.length - 1, 0))); }
        else if (event.key === 'ArrowUp') { event.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); }
        else if (event.key === 'Enter') { if (items[highlight]) select(items[highlight]); }
        else if (event.key === 'Escape') setOpen(false);
    };

    const hoverBg = isDark ? 'whiteAlpha.100' : '#FFFBEB';
    const selectedBorder = isDark ? 'rgba(250,204,21,.45)' : '#FDE68A';
    const selectedBg = isDark ? 'rgba(250,204,21,.06)' : '#FFFBEB';

    return (
        <Field.Root required>
            <Field.Label color={textColor}>
                <HStack gap={2}>{Icon && <Icon size={16} />}<span>{label}</span></HStack>
                <Field.RequiredIndicator />
            </Field.Label>

            <Box ref={rootRef} position="relative" w="100%">
                {value ? (
                    <HStack
                        justify="space-between"
                        px={4}
                        py={2.5}
                        minH="52px"
                        borderWidth="1px"
                        borderColor={selectedBorder}
                        bg={selectedBg}
                        borderRadius="xl"
                        gap={3}
                    >
                        <HStack gap={3} minW={0}>
                            <Box color={accentColor} flexShrink={0}><LuCheck size={18} /></Box>
                            <VStack align="start" gap={0} minW={0}>
                                <Text fontWeight="semibold" color={textColor} truncate maxW="100%">{value.name}</Text>
                                {renderMeta && <Box fontSize="xs">{renderMeta(value)}</Box>}
                            </VStack>
                        </HStack>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            w="34px"
                            h="34px"
                            p={0}
                            minW={0}
                            borderRadius="lg"
                            color={subtitleColor}
                            onClick={clear}
                            disabled={disabled}
                            aria-label="Boshqasini tanlash"
                            title="Boshqasini tanlash"
                            _hover={{ bg: isDark ? 'whiteAlpha.200' : 'gray.200', color: textColor }}
                        >
                            <LuX size={16} />
                        </Button>
                    </HStack>
                ) : (
                    <>
                        <Box position="absolute" left={4} top="50%" transform="translateY(-50%)" color={subtitleColor} zIndex={1} pointerEvents="none">
                            {isLoading ? <Spinner size="xs" color={accentColor} /> : <LuSearch size={16} />}
                        </Box>
                        <FormControl
                            value={search}
                            onChange={(event) => { onSearchChange(event.target.value); setOpen(true); }}
                            onFocus={() => setOpen(true)}
                            onKeyDown={onKeyDown}
                            placeholder={placeholder}
                            pl={11}
                            minH="52px"
                            disabled={disabled}
                            autoFocus={autoFocus}
                            autoComplete="off"
                            role="combobox"
                            aria-expanded={open}
                        />
                    </>
                )}

                {open && !value && (
                    <Box
                        position="absolute"
                        top="calc(100% + 6px)"
                        left={0}
                        right={0}
                        zIndex={20}
                        bg={cardBg}
                        borderWidth="1px"
                        borderColor={isDark ? cardBorder : '#CBD5E1'}
                        borderRadius="xl"
                        boxShadow={isDark ? '0 16px 40px rgba(0,0,0,.45)' : '0 12px 32px rgba(15,23,42,.16)'}
                        maxH="280px"
                        overflowY="auto"
                        py={1}
                    >
                        {isError ? (
                            <Text px={4} py={3} fontSize="sm" color={isDark ? 'red.300' : 'red.600'}>Ro‘yxatni yuklashda xatolik</Text>
                        ) : items.length === 0 ? (
                            <Text px={4} py={3} fontSize="sm" color={subtitleColor}>
                                {isLoading ? 'Yuklanmoqda...' : search ? emptyText : 'Nomini yozib qidiring'}
                            </Text>
                        ) : (
                            items.map((item, index) => (
                                <HStack
                                    key={item.id}
                                    as="button"
                                    type="button"
                                    w="100%"
                                    textAlign="left"
                                    justify="space-between"
                                    px={4}
                                    py={2.5}
                                    gap={3}
                                    bg={index === highlight ? hoverBg : 'transparent'}
                                    _hover={{ bg: hoverBg }}
                                    onMouseDown={(event) => event.preventDefault()}
                                    onMouseEnter={() => setHighlight(index)}
                                    onClick={() => select(item)}
                                >
                                    <VStack align="start" gap={0} minW={0}>
                                        <Text fontWeight="semibold" fontSize="sm" color={textColor} truncate maxW="100%">{item.name}</Text>
                                        {item.phone && <Text fontSize="xs" color={subtitleColor}>{item.phone}</Text>}
                                    </VStack>
                                    {renderMeta && <Box fontSize="xs" flexShrink={0} textAlign="right">{renderMeta(item)}</Box>}
                                </HStack>
                            ))
                        )}
                    </Box>
                )}
            </Box>
        </Field.Root>
    );
}

EntityPicker.propTypes = {
    label: PropTypes.string.isRequired,
    icon: PropTypes.elementType,
    value: PropTypes.shape({ id: PropTypes.string, name: PropTypes.string }),
    onChange: PropTypes.func.isRequired,
    items: PropTypes.array.isRequired,
    isLoading: PropTypes.bool,
    isError: PropTypes.bool,
    search: PropTypes.string.isRequired,
    onSearchChange: PropTypes.func.isRequired,
    placeholder: PropTypes.string,
    renderMeta: PropTypes.func,
    emptyText: PropTypes.string,
    disabled: PropTypes.bool,
    autoFocus: PropTypes.bool,
};
