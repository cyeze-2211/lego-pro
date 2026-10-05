import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    HStack,
    Heading,
    Text,
    VStack,
    SimpleGrid,
} from '@chakra-ui/react';
import {
    LuArrowLeft,
    LuPhone,
    LuSend,
    LuCalendar,
    LuUserCheck,
    LuClock,
} from 'react-icons/lu';
import { useGetCustomerAgentByIdQuery } from '../../../store/services/customerAgent.api';
import { useAppTheme } from '../../../theme/tokens';
import Loading from '../../Other/UI/Loadings/Loading';
import Edit from '../CustomerAgent/__components/Edit';
import Delete from '../CustomerAgent/__components/Delete';

const formatDateTime = (value) => {
    if (!value) return '—';
    try {
        const d = new Date(value);
        return d.toLocaleString('uz-UZ', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    } catch {
        return value;
    }
};

export default function CustomerAgentDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isDark, pageBg, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();

    const { data: agent, isLoading, error } = useGetCustomerAgentByIdQuery(id, { skip: !id });

    if (isLoading) return <Loading />;

    if (error || !agent) {
        return (
            <Box p={8} textAlign="center">
                <Text color={isDark ? 'red.300' : 'red.600'} fontSize="lg" fontWeight="semibold">
                    Agent topilmadi
                </Text>
                <Button mt={4} onClick={() => navigate('/customer-agents')}
                    bg={accentColor} color="black" borderRadius="xl">
                    Ro'yxatga qaytish
                </Button>
            </Box>
        );
    }

    const infoBox = {
        bg: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
        borderWidth: '1px',
        borderColor: cardBorder,
        borderRadius: 'xl',
        p: 5,
    };

    return (
        <Box bg={pageBg} color={textColor} minH="100%" pb={10}>

            {/* Back + actions */}
            <HStack justify="space-between" align="center" mb={6} flexWrap="wrap" gap={3}>
                <Button
                    variant="ghost" size="sm" onClick={() => navigate('/customer-agents')}
                    color={subtitleColor} borderRadius="xl"
                    _hover={{ bg: isDark ? 'whiteAlpha.100' : 'gray.100', color: textColor }}
                    leftIcon={<LuArrowLeft size={16} />}
                >
                    <HStack gap={2}><LuArrowLeft size={16} /><span>Agentlar</span></HStack>
                </Button>
                <HStack gap={2}>
                    <Edit agent={agent} />
                    <Delete agent={agent} />
                </HStack>
            </HStack>

            {/* Hero card */}
            <Box
                bg={cardBg} borderWidth="1px" borderColor={cardBorder}
                borderRadius="2xl" overflow="hidden"
                boxShadow={isDark ? '0 16px 40px rgba(0,0,0,0.25)' : '0 8px 24px rgba(15,23,42,0.10)'}
                mb={6}
            >
                {/* Top accent */}
                <Box h="5px" bgGradient={`linear(to-r, ${accentColor}, yellow.300)`} />

                <HStack gap={5} p={6} align="center" flexWrap="wrap">
                    {/* Avatar */}
                    <Box
                        w="72px" h="72px" borderRadius="2xl" flexShrink={0}
                        display="flex" alignItems="center" justifyContent="center"
                        bg={isDark ? 'rgba(250,204,21,0.12)' : '#FEF3C7'}
                        borderWidth="2px" borderColor={isDark ? 'rgba(250,204,21,0.25)' : '#FDE68A'}
                    >
                        <LuUserCheck size={34} color={accentColor} />
                    </Box>

                    <VStack align="start" gap={1} flex="1" minW={0}>
                        <Heading fontSize="2xl" fontWeight="extrabold" color={textColor} noOfLines={1}>
                            {agent.name}
                        </Heading>
                        <HStack gap={2} color={subtitleColor} fontSize="sm">
                            <LuPhone size={14} />
                            <Text fontFamily="mono">{agent.phone}</Text>
                        </HStack>
                    </VStack>

                    {/* Telegram badge */}
                    {agent.telegramId && (
                        <Box
                            px={4} py={2} borderRadius="xl"
                            bg={isDark ? 'rgba(56,189,248,0.12)' : '#E0F2FE'}
                            borderWidth="1px"
                            borderColor={isDark ? 'rgba(56,189,248,0.25)' : '#BAE6FD'}
                        >
                            <HStack gap={2} color={isDark ? 'sky.300' : 'sky.600'} fontSize="sm" fontWeight="semibold">
                                <LuSend size={14} />
                                <Text fontFamily="mono">{agent.telegramId}</Text>
                            </HStack>
                        </Box>
                    )}
                </HStack>
            </Box>

            {/* Info grid */}
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>

                {/* Telefon */}
                <Box {...infoBox}>
                    <HStack gap={2} mb={2} color={accentColor}>
                        <LuPhone size={16} />
                        <Text fontSize="xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">
                            Telefon
                        </Text>
                    </HStack>
                    <Text fontSize="lg" fontWeight="bold" color={textColor} fontFamily="mono">
                        {agent.phone || '—'}
                    </Text>
                </Box>

                {/* Telegram ID */}
                <Box {...infoBox}>
                    <HStack gap={2} mb={2} color={isDark ? 'sky.300' : 'sky.500'}>
                        <LuSend size={16} />
                        <Text fontSize="xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">
                            Telegram ID
                        </Text>
                    </HStack>
                    <Text fontSize="lg" fontWeight="bold" color={textColor} fontFamily="mono">
                        {agent.telegramId || '—'}
                    </Text>
                </Box>

                {/* Yaratilgan */}
                <Box {...infoBox}>
                    <HStack gap={2} mb={2} color={subtitleColor}>
                        <LuCalendar size={16} />
                        <Text fontSize="xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">
                            Yaratilgan
                        </Text>
                    </HStack>
                    <Text fontSize="md" fontWeight="semibold" color={textColor}>
                        {formatDateTime(agent.createdAt)}
                    </Text>
                </Box>

                {/* Oxirgi o'zgarish */}
                <Box {...infoBox}>
                    <HStack gap={2} mb={2} color={subtitleColor}>
                        <LuClock size={16} />
                        <Text fontSize="xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">
                            Oxirgi o'zgarish
                        </Text>
                    </HStack>
                    <Text fontSize="md" fontWeight="semibold" color={textColor}>
                        {formatDateTime(agent.lastModifiedAt)}
                    </Text>
                </Box>

            </SimpleGrid>
        </Box>
    );
}
