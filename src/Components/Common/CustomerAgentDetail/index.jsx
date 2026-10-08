import { useState, useMemo } from 'react';
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
    LuCoins,
    LuChevronDown,
    LuChevronRight,
    LuShoppingCart,
    LuPackage,
    LuUser,
} from 'react-icons/lu';
import { useGetCustomerAgentByIdQuery, useGetCustomerAgentBonusQuery } from '../../../store/services/customerAgent.api';
import { useAppTheme } from '../../../theme/tokens';
import { formatNumber } from '../../ui/number-format';
import FormControl from '../../ui/FormControl';
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

const getCurrentMonthStart = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
};

const getCurrentMonthEnd = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const lastDay = new Date(year, month, 0).getDate();
    return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
};

/* ─────────────────────────────────────────────────────── */
/* Stat chip */
function StatChip({ label, value, color, isDark }) {
    return (
        <Box
            px={3} py={2} borderRadius="lg"
            bg={isDark ? 'rgba(255,255,255,0.05)' : 'white'}
            borderWidth="1px" borderColor={isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0'}
            minW="110px"
        >
            <Text fontSize="10px" fontWeight="semibold" textTransform="uppercase"
                letterSpacing="wider" color={color} mb={0.5}>
                {label}
            </Text>
            <Text fontSize="sm" fontWeight="bold" color={color}>
                {value}
            </Text>
        </Box>
    );
}

/* ─────────────────────────────────────────────────────── */
/* Products table inside an order */
function ProductsTable({ products, isDark, cardBorder, subtitleColor, textColor, accentColor }) {
    return (
        <Box
            mt={3} borderRadius="lg" overflow="hidden"
            borderWidth="1px" borderColor={cardBorder}
        >
            {/* header */}
            <HStack
                px={4} py={2}
                bg={isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9'}
                gap={0}
            >
                {['Mahsulot', 'Miqdor', 'Bonus narxi', 'Bonus'].map((h, i) => (
                    <Text
                        key={h}
                        fontSize="10px" fontWeight="bold" textTransform="uppercase"
                        letterSpacing="wider" color={subtitleColor}
                        flex={i === 0 ? 2 : 1} textAlign={i === 0 ? 'left' : 'right'}
                    >{h}</Text>
                ))}
            </HStack>
            {/* rows */}
            {products.map((p) => (
                <HStack
                    key={p.productId}
                    px={4} py={2.5} gap={0}
                    borderTopWidth="1px" borderColor={cardBorder}
                    _hover={{ bg: isDark ? 'rgba(255,255,255,0.03)' : '#FAFAFA' }}
                >
                    <HStack flex={2} gap={2} minW={0}>
                        <LuPackage size={13} color={accentColor} />
                        <Text fontSize="sm" fontWeight="medium" color={textColor} noOfLines={1}>
                            {p.productName}
                        </Text>
                    </HStack>
                    <Text flex={1} textAlign="right" fontSize="sm" color={textColor}>
                        {formatNumber(p.quantity)}
                    </Text>
                    <Text flex={1} textAlign="right" fontSize="sm" color={subtitleColor}>
                        {formatNumber(p.bonusPrice)} so'm
                    </Text>
                    <Text flex={1} textAlign="right" fontSize="sm" fontWeight="bold" color={accentColor}>
                        {formatNumber(p.bonus)} so'm
                    </Text>
                </HStack>
            ))}
        </Box>
    );
}

/* ─────────────────────────────────────────────────────── */
/* Single order row */
function OrderRow({ order, isDark, cardBg, cardBorder, textColor, subtitleColor, accentColor }) {
    const [open, setOpen] = useState(false);

    return (
        <Box
            borderRadius="xl" overflow="hidden"
            borderWidth="1px" borderColor={cardBorder}
        >
            {/* order header */}
            <HStack
                px={4} py={3} cursor="pointer"
                bg={isDark ? 'rgba(255,255,255,0.03)' : 'white'}
                _hover={{ bg: isDark ? 'rgba(255,255,255,0.06)' : '#F8FAFC' }}
                onClick={() => setOpen((v) => !v)}
                gap={3} flexWrap="wrap"
            >
                <Box
                    color={accentColor}
                    transform={open ? 'rotate(90deg)' : 'rotate(0deg)'}
                    transition="transform 0.2s"
                >
                    <LuChevronRight size={15} />
                </Box>

                <HStack gap={2} flex="1" minW={0}>
                    <LuShoppingCart size={14} color={accentColor} />
                    <Text fontSize="xs" color={subtitleColor}>Buyurtma</Text>
                    <Text fontSize="xs" fontWeight="semibold" color={textColor} fontFamily="mono" noOfLines={1}>
                        #{order.orderId?.slice(-8)}
                    </Text>
                </HStack>

                <Text fontSize="xs" color={subtitleColor}>
                    {formatDateTime(order.decidedAt)}
                </Text>

                <HStack gap={3}>
                    <Box textAlign="right">
                        <Text fontSize="10px" color={subtitleColor}>Miqdor</Text>
                        <Text fontSize="xs" fontWeight="semibold" color={textColor}>
                            {formatNumber(order.quantity)}
                        </Text>
                    </Box>
                    <Box textAlign="right">
                        <Text fontSize="10px" color={subtitleColor}>Summa</Text>
                        <Text fontSize="xs" fontWeight="semibold" color={textColor}>
                            {formatNumber(order.totalAmount)} so'm
                        </Text>
                    </Box>
                    <Box
                        px={3} py={1} borderRadius="lg"
                        bg={isDark ? 'rgba(250,204,21,0.15)' : '#FEF3C7'}
                        borderWidth="1px" borderColor={isDark ? 'rgba(250,204,21,0.3)' : '#FDE68A'}
                    >
                        <Text fontSize="sm" fontWeight="bold" color={accentColor}>
                            +{formatNumber(order.bonus)} so'm
                        </Text>
                    </Box>
                </HStack>
            </HStack>

            {/* products */}
            {open && (
                <Box px={4} pb={4} pt={0}
                    bg={isDark ? 'rgba(255,255,255,0.02)' : '#FAFCFF'}
                >
                    <ProductsTable
                        products={order.products || []}
                        isDark={isDark}
                        cardBorder={cardBorder}
                        textColor={textColor}
                        subtitleColor={subtitleColor}
                        accentColor={accentColor}
                    />
                </Box>
            )}
        </Box>
    );
}

/* ─────────────────────────────────────────────────────── */
/* Customer block */
function CustomerBlock({ customer, isDark, cardBg, cardBorder, textColor, subtitleColor, accentColor }) {
    const [open, setOpen] = useState(true);

    return (
        <Box
            borderRadius="xl" overflow="hidden"
            borderWidth="1px" borderColor={cardBorder}
            bg={isDark ? 'rgba(255,255,255,0.02)' : 'white'}
        >
            {/* customer header */}
            <HStack
                px={4} py={3} cursor="pointer"
                bg={isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC'}
                _hover={{ bg: isDark ? 'rgba(255,255,255,0.07)' : '#F1F5F9' }}
                onClick={() => setOpen((v) => !v)}
                gap={3} flexWrap="wrap"
            >
                <Box
                    color={subtitleColor}
                    transform={open ? 'rotate(180deg)' : 'rotate(0deg)'}
                    transition="transform 0.2s"
                >
                    <LuChevronDown size={15} />
                </Box>
                <HStack gap={2} flex="1" minW={0}>
                    <LuUser size={14} />
                    <Text fontSize="sm" fontWeight="semibold" color={textColor} noOfLines={1}>
                        {customer.customerName}
                    </Text>
                </HStack>
                <HStack gap={3}>
                    <Text fontSize="xs" color={subtitleColor}>
                        {customer.orderCount} buyurtma
                    </Text>
                    <Text fontSize="xs" color={subtitleColor}>
                        {formatNumber(customer.quantity)} dona
                    </Text>
                    <Box
                        px={3} py={1} borderRadius="lg"
                        bg={isDark ? 'rgba(250,204,21,0.15)' : '#FEF3C7'}
                        borderWidth="1px" borderColor={isDark ? 'rgba(250,204,21,0.3)' : '#FDE68A'}
                    >
                        <Text fontSize="sm" fontWeight="bold" color={accentColor}>
                            {formatNumber(customer.bonus)} so'm
                        </Text>
                    </Box>
                </HStack>
            </HStack>

            {/* orders list */}
            {open && (
                <VStack align="stretch" gap={2} p={3}>
                    {(customer.orders || []).map((order) => (
                        <OrderRow
                            key={order.orderId}
                            order={order}
                            isDark={isDark}
                            cardBg={cardBg}
                            cardBorder={cardBorder}
                            textColor={textColor}
                            subtitleColor={subtitleColor}
                            accentColor={accentColor}
                        />
                    ))}
                </VStack>
            )}
        </Box>
    );
}

/* ─────────────────────────────────────────────────────── */
/* Main BonusReport */
function BonusReport({ data, isDark, cardBg, cardBorder, textColor, subtitleColor, accentColor }) {
    // data.agents is the full list — for the detail page we typically have one agent
    const agents = data.agents || [];

    return (
        <VStack align="stretch" gap={5}>
            {/* Summary strip */}
            <HStack
                gap={3} flexWrap="wrap"
                p={4} borderRadius="xl"
                bg={isDark ? 'rgba(250,204,21,0.08)' : '#FFFBEB'}
                borderWidth="1px" borderColor={isDark ? 'rgba(250,204,21,0.2)' : '#FDE68A'}
            >
                <HStack gap={2} flex="1" minW={0}>
                    <LuCoins size={20} color={accentColor} />
                    <VStack align="start" gap={0}>
                        <Text fontSize="10px" color={subtitleColor} textTransform="uppercase" letterSpacing="wider">
                            Jami bonus
                        </Text>
                        <Text fontSize="2xl" fontWeight="extrabold" color={accentColor}>
                            {formatNumber(data.totalBonus)} so'm
                        </Text>
                    </VStack>
                </HStack>
                <HStack gap={2} flexWrap="wrap">
                    <StatChip
                        label="Buyurtmalar"
                        value={data.orderCount}
                        color={isDark ? 'blue.300' : 'blue.600'}
                        isDark={isDark}
                    />
                    <StatChip
                        label="Miqdor (dona)"
                        value={formatNumber(data.totalQuantity)}
                        color={isDark ? 'purple.300' : 'purple.600'}
                        isDark={isDark}
                    />
                </HStack>
            </HStack>

            {/* Per-agent sections */}
            {agents.map((agent) => (
                <Box key={agent.agentId}>
                    {/* Customers */}
                    <VStack align="stretch" gap={3}>
                        {(agent.customers || []).map((customer) => (
                            <CustomerBlock
                                key={customer.customerId}
                                customer={customer}
                                isDark={isDark}
                                cardBg={cardBg}
                                cardBorder={cardBorder}
                                textColor={textColor}
                                subtitleColor={subtitleColor}
                                accentColor={accentColor}
                            />
                        ))}
                    </VStack>
                </Box>
            ))}
        </VStack>
    );
}

/* ─────────────────────────────────────────────────────── */
/* Page */
export default function CustomerAgentDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isDark, pageBg, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();

    const [dateFrom, setDateFrom] = useState(getCurrentMonthStart());
    const [dateTo, setDateTo] = useState(getCurrentMonthEnd());

    const { data: agent, isLoading, error } = useGetCustomerAgentByIdQuery(id, { skip: !id });

    const bonusParams = useMemo(() => ({
        agentId: id,
        dateFrom,
        dateTo,
    }), [id, dateFrom, dateTo]);

    const { data: bonusData, isLoading: isBonusLoading } = useGetCustomerAgentBonusQuery(
        bonusParams,
        { skip: !id || !dateFrom || !dateTo }
    );

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
                <Box h="5px" bgGradient={`linear(to-r, ${accentColor}, yellow.300)`} />

                <HStack gap={5} p={6} align="center" flexWrap="wrap">
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
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4} mb={6}>
                <Box {...infoBox}>
                    <HStack gap={2} mb={2} color={accentColor}>
                        <LuPhone size={16} />
                        <Text fontSize="xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">Telefon</Text>
                    </HStack>
                    <Text fontSize="lg" fontWeight="bold" color={textColor} fontFamily="mono">
                        {agent.phone || '—'}
                    </Text>
                </Box>

                <Box {...infoBox}>
                    <HStack gap={2} mb={2} color={isDark ? 'sky.300' : 'sky.500'}>
                        <LuSend size={16} />
                        <Text fontSize="xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">Telegram ID</Text>
                    </HStack>
                    <Text fontSize="lg" fontWeight="bold" color={textColor} fontFamily="mono">
                        {agent.telegramId || '—'}
                    </Text>
                </Box>

                <Box {...infoBox}>
                    <HStack gap={2} mb={2} color={subtitleColor}>
                        <LuCalendar size={16} />
                        <Text fontSize="xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">Yaratilgan</Text>
                    </HStack>
                    <Text fontSize="md" fontWeight="semibold" color={textColor}>
                        {formatDateTime(agent.createdAt)}
                    </Text>
                </Box>

                <Box {...infoBox}>
                    <HStack gap={2} mb={2} color={subtitleColor}>
                        <LuClock size={16} />
                        <Text fontSize="xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">Oxirgi o'zgarish</Text>
                    </HStack>
                    <Text fontSize="md" fontWeight="semibold" color={textColor}>
                        {formatDateTime(agent.lastModifiedAt)}
                    </Text>
                </Box>
            </SimpleGrid>

            {/* ── Bonus section ── */}
            <Box
                bg={cardBg} borderWidth="1px" borderColor={cardBorder}
                borderRadius="2xl" overflow="hidden"
                boxShadow={isDark ? '0 16px 40px rgba(0,0,0,0.2)' : '0 8px 24px rgba(15,23,42,0.08)'}
            >
                {/* Section header */}
                <Box
                    px={6} py={4}
                    borderBottomWidth="1px" borderColor={cardBorder}
                    bg={isDark ? 'rgba(250,204,21,0.05)' : '#FFFDF0'}
                >
                    <HStack gap={3} justify="space-between" flexWrap="wrap">
                        <HStack gap={2}>
                            <Box
                                p={2} borderRadius="lg"
                                bg={isDark ? 'rgba(250,204,21,0.15)' : '#FEF3C7'}
                            >
                                <LuCoins size={18} color={accentColor} />
                            </Box>
                            <Box>
                                <Text fontSize="md" fontWeight="bold" color={textColor}>
                                    Bonus hisoboti
                                </Text>
                                <Text fontSize="xs" color={subtitleColor}>
                                    Tanlangan davr bo'yicha
                                </Text>
                            </Box>
                        </HStack>

                        {/* Date pickers */}
                        <HStack gap={3} flexWrap="wrap">
                            <Box>
                                <Text fontSize="xs" color={subtitleColor} mb={1}>Dan</Text>
                                <FormControl
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                />
                            </Box>
                            <Box>
                                <Text fontSize="xs" color={subtitleColor} mb={1}>Gacha</Text>
                                <FormControl
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                />
                            </Box>
                        </HStack>
                    </HStack>
                </Box>

                {/* Bonus content */}
                <Box p={6}>
                    {isBonusLoading ? (
                        <Text color={subtitleColor} fontSize="sm">Yuklanmoqda...</Text>
                    ) : bonusData ? (
                        <BonusReport
                            data={bonusData}
                            isDark={isDark}
                            cardBg={cardBg}
                            cardBorder={cardBorder}
                            textColor={textColor}
                            subtitleColor={subtitleColor}
                            accentColor={accentColor}
                        />
                    ) : (
                        <Text color={subtitleColor} fontSize="sm">
                            Bu davr uchun bonus ma'lumoti topilmadi
                        </Text>
                    )}
                </Box>
            </Box>

        </Box>
    );
}
