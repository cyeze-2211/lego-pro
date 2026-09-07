import { Box, Button, HStack, Heading, Text, VStack } from '@chakra-ui/react';
import { LuArrowLeft, LuCircleAlert } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import { useAppTheme } from '../../../theme/tokens';
import Loading from '../../Other/UI/Loadings/Loading';

export function formatDetailDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatDetailNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? new Intl.NumberFormat('uz-UZ').format(number) : '0';
}

export default function EntityDetail({ title, icon: Icon, backTo, backLabel, loading, error, children, accentColorOverride, accentSoftBackground, accentGradient, single = false }) {
    const navigate = useNavigate();
    const { isDark, pageBg, cardBg, cardBorder, textColor, subtitleColor, accentColor, cardShadow } = useAppTheme();
    const detailAccent = accentColorOverride || accentColor;
    const detailAccentSoft = accentSoftBackground || (isDark ? 'rgba(250, 204, 21, 0.12)' : '#FEF3C7');

    if (loading) {
        return <Box minH="60vh" display="flex" alignItems="center" justifyContent="center"><Loading /></Box>;
    }

    if (error) {
        return (
            <Box minH="60vh" display="flex" flexDirection="column" alignItems="center" justifyContent="center" gap={4} color={isDark ? 'red.300' : 'red.600'}>
                <LuCircleAlert size={34} />
                <Text fontSize="lg">Ma&apos;lumotni yuklashda xatolik</Text>
                <Button variant="outline" onClick={() => navigate(backTo)}><HStack gap={2}><LuArrowLeft size={16} /><span>{backLabel} ro‘yxatiga qaytish</span></HStack></Button>
            </Box>
        );
    }

    return (
        <Box bg={pageBg} color={textColor} minH="100%" w="100%">
            <Box overflow="hidden" borderWidth="1px" borderColor={cardBorder} borderRadius="2xl" boxShadow={cardShadow} mb={5}>
                <Box h="5px" bgGradient={accentGradient || `linear(to-r, ${detailAccent}, #FDE68A)`} />
                <Box bg={cardBg} p={{ base: 4, md: 6 }}>
                    <HStack justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={4}>
                        <HStack gap={3} minW={0}>
                            <Box p={3} borderRadius="xl" bg={detailAccentSoft} color={detailAccent} flexShrink={0}><Icon size={26} /></Box>
                            <Box minW={0}><Heading size="lg" color={textColor} truncate>{title}</Heading><Text fontSize="sm" color={subtitleColor}>Batafsil ma&apos;lumot</Text></Box>
                        </HStack>
                        <Button variant="outline" onClick={() => navigate(backTo)} flexShrink={0}><HStack gap={2}><LuArrowLeft size={16} /><span>{backLabel}</span></HStack></Button>
                    </HStack>
                </Box>
            </Box>
            <Box display={single ? 'block' : 'grid'} gridTemplateColumns={{ base: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }} gap={4}>
                {children({ isDark, textColor, subtitleColor, accentColor: detailAccent, cardBorder, cardBg })}
            </Box>
        </Box>
    );
}

export function DetailSection({ title, icon: Icon, children, accentColor: sectionAccent, ...props }) {
    const { isDark, cardBg, cardBorder, textColor, accentColor } = useAppTheme();
    const detailAccent = sectionAccent || accentColor;
    return (
        <Box bg={cardBg} borderWidth="1px" borderColor={cardBorder} borderRadius="2xl" p={{ base: 4, md: 5 }} boxShadow={isDark ? '0 12px 30px rgba(0,0,0,.16)' : '0 8px 22px rgba(15,23,42,.06)'} {...props}>
            <HStack gap={2} mb={4}><Icon size={18} color={detailAccent} /><Heading size="sm" color={textColor}>{title}</Heading></HStack>
            <VStack align="stretch" gap={3}>{children}</VStack>
        </Box>
    );
}

export function DetailRow({ label, value, emphasize = false }) {
    const { textColor, subtitleColor } = useAppTheme();
    return <HStack justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}><Text color={subtitleColor} fontWeight="semibold">{label}</Text><Text color={textColor} fontWeight={emphasize ? 'bold' : 'medium'} textAlign="right" maxW="70%">{value || '—'}</Text></HStack>;
}
