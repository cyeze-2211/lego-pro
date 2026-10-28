import { Box, Button, HStack, Heading, Text, VStack } from '@chakra-ui/react';
import { LuPalette, LuRotateCcw, LuType } from 'react-icons/lu';
import { useAppTheme } from '../../../theme/tokens';
import { ACCENT_PRESETS } from '../../../theme/accent';
import { FONT_SIZE, resetPreferences, updatePreferences, usePreferences } from '../../../theme/preferences';
import SettingsSection from './__components/SettingsSection';
import ThemeOptionGroup, { ThemePreview } from './__components/ThemeOptionGroup';
import CustomAccentPicker from './__components/CustomAccentPicker';
import FontSizeControl from './__components/FontSizeControl';
import LabelPrinterSettings from './__components/LabelPrinterSettings';

/**
 * Sozlamalar — barcha rollar uchun umumiy sahifa (/settings, /stanokchi/settings, /mixer/settings).
 * Tanlovlar darhol qo‘llanadi va joriy foydalanuvchi uchun saqlanadi (theme/preferences.js).
 */
export default function Settings() {
    const { preferences, accent } = usePreferences();
    const { pageBg, textColor, subtitleColor, cardBorder } = useAppTheme();

    const modeOptions = [
        { value: 'light', label: 'Yorug‘', description: 'Oq fon, to‘q matn', preview: <ThemePreview mode="light" accent={accent.solid} /> },
        { value: 'dark', label: 'Qorong‘i', description: 'Ko‘zni charchatmaydi', preview: <ThemePreview mode="dark" accent={accent.solid} /> },
    ];

    const accentOptions = ['yellow', 'blue'].map((key) => ({
        value: key,
        label: ACCENT_PRESETS[key].label,
        description: key === 'yellow' ? 'Standart brend rangi' : 'Sokin ko‘k tus',
        preview: <ThemePreview mode={preferences.mode} accent={ACCENT_PRESETS[key].main[400]} />,
    }));

    const isDefault = preferences.accent === 'yellow' && preferences.fontSize === FONT_SIZE.base;

    return (
        <Box my={2} bg={pageBg} color={textColor} minH="100%">
            <HStack justify="space-between" align="start" flexWrap="wrap" gap={4} mb={4}>
                <Box>
                    <Heading as="h1" fontSize={{ base: '1.75rem', md: '2.1875rem' }} fontWeight="semibold" lineHeight="1.2" color={textColor}>
                        Sozlamalar
                    </Heading>
                    <Text color={subtitleColor} fontSize="sm" mt={1}>
                        Interfeys ko‘rinishini o‘zingizga moslang. O‘zgarishlar darhol qo‘llanadi va faqat sizning hisobingiz uchun saqlanadi.
                    </Text>
                </Box>
                <Button
                    type="button"
                    variant="outline"
                    h="2.5rem"
                    px={4}
                    borderRadius="xl"
                    borderColor={cardBorder}
                    color={textColor}
                    disabled={isDefault}
                    onClick={resetPreferences}
                    title="Sariq rang va 16 px shrift"
                >
                    <LuRotateCcw size={15} />
                    Standart holatga qaytarish
                </Button>
            </HStack>

            <VStack align="stretch" gap={4}>
                <SettingsSection
                    id="settings-appearance"
                    icon={LuPalette}
                    title="Ko‘rinish"
                    description="Fon rejimi va interfeysning asosiy (accent) rangi."
                >
                    <Box display="grid" gridTemplateColumns={{ base: '1fr', xl: '1fr 1fr' }} gap={{ base: 6, xl: 8 }}>
                        <Box>
                            <Text fontSize="sm" fontWeight="medium" color={textColor} mb={1}>Rejim</Text>
                            <Text fontSize="xs" color={subtitleColor} mb={3}>Sarlavhadagi oy/quyosh tugmasi ham shu sozlamani o‘zgartiradi.</Text>
                            <ThemeOptionGroup
                                label="Rejim"
                                options={modeOptions}
                                value={preferences.mode}
                                onChange={(mode) => updatePreferences({ mode })}
                            />
                        </Box>
                        <Box>
                            <Text fontSize="sm" fontWeight="medium" color={textColor} mb={1}>Asosiy rang</Text>
                            <Text fontSize="xs" color={subtitleColor} mb={3}>Tugmalar, faol menyu, belgilar va fokus holatlari shu rangda bo‘ladi.</Text>
                            <ThemeOptionGroup
                                label="Asosiy rang"
                                options={accentOptions}
                                value={preferences.accent}
                                onChange={(key) => updatePreferences({ accent: key })}
                            />
                            <Box mt={3}>
                                <CustomAccentPicker />
                            </Box>
                        </Box>
                    </Box>
                </SettingsSection>

                <SettingsSection
                    id="settings-font-size"
                    icon={LuType}
                    title="Shrift o‘lchami"
                    description="Butun ilovadagi matnlar nisbatini saqlagan holda kattalashtiring yoki kichraytiring."
                >
                    <FontSizeControl />
                </SettingsSection>
                <LabelPrinterSettings />
            </VStack>
        </Box>
    );
}
