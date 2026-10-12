import { Box, Button, HStack, Heading, Slider, Text, VStack } from '@chakra-ui/react';
import { useAppTheme } from '../../../../theme/tokens';
import { FONT_SIZE, updatePreferences, usePreferences } from '../../../../theme/preferences';

const SIZE_LABELS = { 14: 'Kichik', 15: 'Ixcham', 16: 'Standart', 17: 'Kattaroq', 18: 'Katta' };
const sizeLabel = (px) => SIZE_LABELS[px] || `${px} px`;

const MARKS = Object.keys(SIZE_LABELS).map((px) => ({ value: Number(px), label: px }));

/**
 * Butun ilova shrift o‘lchami. Qiymat <html> ning font-size iga (rem asosi) yoziladi,
 * shuning uchun sarlavha, matn, label va tugmalar o‘zaro nisbatini saqlagan holda o‘zgaradi.
 */
export default function FontSizeControl() {
    const { preferences } = usePreferences();
    const { isDark, pageBg, cardBorder, textColor, subtitleColor, accentColor, accentDarkText, inputBg, inputBorder } = useAppTheme();
    const { fontSize } = preferences;

    return (
        <VStack align="stretch" gap={5}>
            <Box>
                <HStack justify="space-between" mb={3} gap={3} flexWrap="wrap">
                    <Text id="font-size-label" fontSize="sm" fontWeight="medium" color={textColor}>Matn o‘lchami</Text>
                    <Text
                        as="output"
                        htmlFor="font-size-slider"
                        aria-live="polite"
                        fontSize="xs"
                        fontWeight="semibold"
                        px={2.5}
                        py={1}
                        borderRadius="full"
                        bg="yellow.400/15"
                        color={isDark ? 'yellow.300' : 'yellow.700'}
                    >
                        {fontSize} px · {sizeLabel(fontSize)}
                    </Text>
                </HStack>

                <HStack gap={3} align="center">
                    <Text aria-hidden fontSize="xs" fontWeight="bold" color={subtitleColor}>A</Text>
                    <Slider.Root
                        id="font-size-slider"
                        flex={1}
                        min={FONT_SIZE.min}
                        max={FONT_SIZE.max}
                        step={FONT_SIZE.step}
                        value={[fontSize]}
                        onValueChange={({ value }) => updatePreferences({ fontSize: value[0] })}
                        aria-labelledby={['font-size-label']}
                        getAriaValueText={({ value }) => `${value} piksel, ${sizeLabel(value)}`}
                        colorPalette="yellow"
                        thumbAlignment="center"
                        pb={5}
                    >
                        <Slider.Control>
                            <Slider.Track bg={isDark ? 'whiteAlpha.200' : 'gray.200'}>
                                <Slider.Range bg={accentColor} />
                            </Slider.Track>
                            <Slider.Thumbs
                                borderColor={accentColor}
                                _focusVisible={{ boxShadow: `0 0 0 4px ${accentColor}55` }}
                            />
                        </Slider.Control>
                        <Slider.Marks marks={MARKS} color={subtitleColor} />
                    </Slider.Root>
                    <Text aria-hidden fontSize="lg" fontWeight="bold" color={subtitleColor}>A</Text>
                </HStack>
            </Box>

            {/* Namuna: haqiqiy interfeys elementlari bilan bir xil o‘lchamlar */}
            <Box
                aria-label="Shrift o‘lchami namunasi"
                role="group"
                borderWidth="1px"
                borderColor={cardBorder}
                borderRadius="xl"
                bg={pageBg}
                p={{ base: 4, md: 5 }}
            >
                <Text fontSize="xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider" color={subtitleColor}>
                    Namuna
                </Text>
                <Heading as="p" fontSize="xl" fontWeight="semibold" color={textColor} mt={1}>Buyurtmalar ro‘yxati</Heading>
                <Text fontSize="sm" color={subtitleColor} mt={1}>
                    Bugun 12 ta yangi buyurtma qabul qilindi. Jadval, forma va tugmalardagi matnlar shu o‘lchamda ko‘rinadi.
                </Text>
                <HStack gap={3} mt={4} flexWrap="wrap" align="end">
                    <Box flex="1 1 12rem">
                        <Text as="span" display="block" fontSize="xs" fontWeight="medium" color={subtitleColor} mb={1}>Mijoz nomi</Text>
                        <Box h="2.5rem" px={3} display="flex" alignItems="center" borderRadius="lg" borderWidth="1px" borderColor={inputBorder} bg={inputBg} color={textColor} fontSize="sm">
                            Zafar Lux
                        </Box>
                    </Box>
                    <Button type="button" tabIndex={-1} aria-hidden h="2.5rem" px={4} borderRadius="lg" bg={accentColor} color={accentDarkText} fontSize="sm" fontWeight="semibold" _hover={{ bg: accentColor }}>
                        Saqlash
                    </Button>
                </HStack>
            </Box>
        </VStack>
    );
}
