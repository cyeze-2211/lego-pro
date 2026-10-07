import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    Box,
    Button,
    HStack,
    Heading,
    Table,
    Text,
    VStack,
} from '@chakra-ui/react';
import {
    LuChevronLeft, LuChevronRight, LuPen, LuPhone, LuPlus, LuSearch,
    LuUsers, LuX, LuClock3, LuTriangleAlert, LuCalendarCheck,
    LuCalendarDays, LuStickyNote,
} from 'react-icons/lu';
import { useGetCustomersQuery } from '../../../store/services/customer.api';
import { BRAND_COLORS, useAppTheme } from '../../../theme/tokens';
import { Alert } from '../../Other/UI/Alert/Alert';
import DeleteCustomer from '../__components/DeleteCustomer';
import Loading from '../../Other/UI/Loadings/Loading';
import EmptyData from '../../Other/UI/NoData/EmptyData';
import FormControl from '../../ui/FormControl';
import { formatNumber } from '../../ui/number-format';

const PAGE_SIZE = 12;

/* ── Date helpers ── */
const formatShortDate = (value) => {
    if (!value) return '—';
    const [year, month, day] = value.split('-');
    return year && month && day ? `${day}.${month}.${year}` : value;
};

const daysDiff = (value) => {
    if (!value) return null;
    const target = new Date(value);
    const now = new Date();
    target.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    return Math.round((target - now) / 86400000);
};

/** Status meta based on payment date */
const getStatusMeta = (paymentDate, isDark) => {
    const diff = daysDiff(paymentDate);
    if (diff === null) {
        return {
            label: '—',
            Icon: LuCalendarDays,
            color: isDark ? '#94a3b8' : '#64748b',
            bg: isDark ? 'rgba(148,163,184,.1)' : '#F1F5F9',
            border: isDark ? 'rgba(148,163,184,.25)' : '#E2E8F0',
        };
    }
    if (diff < 0) {
        return {
            label: `${Math.abs(diff)} kun o‘tgan`,
            Icon: LuTriangleAlert,
            color: isDark ? '#fca5a5' : '#dc2626',
            bg: isDark ? 'rgba(239,68,68,.12)' : '#FEF2F2',
            border: isDark ? 'rgba(239,68,68,.3)' : '#FECACA',
        };
    }
    if (diff === 0) {
        return {
            label: 'Bugun',
            Icon: LuClock3,
            color: isDark ? '#fde68a' : '#b45309',
            bg: isDark ? 'rgba(250,204,21,.14)' : '#FFFBEB',
            border: isDark ? 'rgba(250,204,21,.35)' : '#FDE68A',
        };
    }
    if (diff <= 3) {
        return {
            label: `${diff} kun qoldi`,
            Icon: LuClock3,
            color: isDark ? '#93c5fd' : '#1d4ed8',
            bg: isDark ? 'rgba(59,130,246,.14)' : '#EFF6FF',
            border: isDark ? 'rgba(59,130,246,.3)' : '#BFDBFE',
        };
    }
    return {
        label: `${diff} kun qoldi`,
        Icon: LuCalendarCheck,
        color: isDark ? '#86efac' : '#15803d',
        bg: isDark ? 'rgba(34,197,94,.12)' : '#F0FDF4',
        border: isDark ? 'rgba(34,197,94,.3)' : '#BBF7D0',
    };
};

export default function ZayavkachiCustomers() {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const base = pathname.startsWith('/kassir') ? '/kassir' : '/zayavkachi';
    const [search, setSearch] = useState('');
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(0);
    const { data: customerResult, isLoading, error } = useGetCustomersQuery({ name: query || undefined, page, size: PAGE_SIZE });
    const { isDark, pageBg, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();
    const customers = customerResult?.items || [];
    const pagination = customerResult?.pagination;
    const totalPages = pagination?.totalPages || 0;
    const tableBg = isDark ? BRAND_COLORS.darkCardBg : cardBg;
    const tableHeaderBg = isDark ? tableBg : '#F8FAFC';
    const tableBorder = isDark ? cardBorder : '#CBD5E1';

    const submitSearch = (event) => {
        event.preventDefault();
        setPage(0);
        setQuery(search.trim());
    };

    const clearSearch = () => {
        setSearch('');
        setPage(0);
        setQuery('');
    };

    useEffect(() => {
        if (error) Alert(error?.data?.message || 'Mijozlarni yuklashda xatolik', 'error');
    }, [error]);

    const renderBalance = (balance) => {
        const value = Number(balance) || 0;
        if (value < 0) {
            return <Text fontWeight="bold" whiteSpace="nowrap" color={isDark ? 'red.300' : 'red.600'}>{formatNumber(Math.abs(value))} so‘m (qarzdor)</Text>;
        }
        if (value > 0) {
            return <Text fontWeight="bold" whiteSpace="nowrap" color={isDark ? 'green.300' : 'green.700'}>{formatNumber(value)} so‘m (kredit)</Text>;
        }
        return <Text color={subtitleColor} whiteSpace="nowrap">0 so‘m</Text>;
    };

    const createButton = (
        <Button onClick={() => navigate(`${base}/customers/new`)} bg={accentColor} color="black" borderRadius="xl" px={6} _hover={{ bg: 'yellow.500', transform: 'translateY(-1px)' }}>
            <HStack gap={2}><LuPlus size={18} /><span>Yangi mijoz</span></HStack>
        </Button>
    );

    return (
        <Box my={2} bg={pageBg} color={textColor} minH="100%">
            <HStack justify="space-between" align="start" flexWrap="wrap" gap={4} mb={4}>
                <Box>
                    <Heading className="text-[35px] font-semibold" color={textColor}>Mijozlar</Heading>
                </Box>
                {createButton}
            </HStack>

            <HStack
                as="form"
                onSubmit={submitSearch}
                w="100%"
                align={{ base: 'stretch', md: 'center' }}
                flexDirection={{ base: 'column', md: 'row' }}
                gap={3}
                mb={4}
                p={3}
                bg={cardBg}
                borderWidth="1px"
                borderColor={cardBorder}
                borderRadius="xl"
                boxShadow={isDark ? 'none' : '0 6px 18px rgba(15, 23, 42, 0.06)'}
            >
                <Box position="relative" flex="1" w="100%">
                    <Box position="absolute" left={4} top="50%" transform="translateY(-50%)" color={accentColor} zIndex={1} pointerEvents="none">
                        <LuSearch size={18} />
                    </Box>
                    <FormControl
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Mijoz nomi bo‘yicha qidiring..."
                        aria-label="Mijoz qidirish"
                        pl={11}
                        pr={search ? 11 : 4}
                        minH="32px"
                    />
                    {search && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            position="absolute"
                            right={2}
                            top="50%"
                            transform="translateY(-50%)"
                            color={subtitleColor}
                            minW="32px"
                            h="32px"
                            p={0}
                            borderRadius="full"
                            aria-label="Qidiruvni tozalash"
                            onClick={clearSearch}
                            _hover={{ bg: isDark ? 'whiteAlpha.100' : 'gray.100', color: textColor }}
                        >
                            <LuX size={16} />
                        </Button>
                    )}
                </Box>
                <Button type="submit" bg={accentColor} color="black" borderRadius="xl" minH="32px" px={6} flexShrink={0} _hover={{ bg: 'yellow.500', transform: 'translateY(-1px)' }}>
                    <HStack gap={2}><LuSearch size={18} /><span>Qidirish</span></HStack>
                </Button>
            </HStack>

            {isLoading ? (
                <Loading />
            ) : error ? (
                <Box p={8} textAlign="center" color={isDark ? 'red.300' : 'red.600'}>Ma&apos;lumotlarni yuklashda xatolik</Box>
            ) : customers.length === 0 ? (
                <EmptyData
                    text={query ? 'Qidiruv bo‘yicha mijoz topilmadi' : 'Hozircha mijozlar yo‘q'}
                    description="Yangi mijoz qo‘shib ma’lumotnomani to‘ldiring."
                    action={createButton}
                />
            ) : (
                <>
                    <Box overflowX="auto" bg={tableBg} borderWidth="0.5px" borderColor={tableBorder} borderRadius="10px" boxShadow={isDark ? '0 16px 40px rgba(0, 0, 0, 0.22)' : '0 8px 24px rgba(15, 23, 42, 0.10)'}>
                        <Table.Root size="md" interactive bg={tableBg} borderCollapse="collapse" minW="1200px">
                            <Table.Header bg={tableHeaderBg}>
                                <Table.Row bg={tableHeaderBg}>
                                    <Table.ColumnHeader textAlign="center" bg={tableHeaderBg} borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor} w="60px">№</Table.ColumnHeader>
                                    <Table.ColumnHeader bg={tableHeaderBg} borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor}>Mijoz</Table.ColumnHeader>
                                    <Table.ColumnHeader bg={tableHeaderBg} borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor}>Telefon</Table.ColumnHeader>
                                    <Table.ColumnHeader bg={tableHeaderBg} borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor}>Izoh</Table.ColumnHeader>
                                    <Table.ColumnHeader bg={tableHeaderBg} borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor} minW="230px">Eslatma</Table.ColumnHeader>
                                    <Table.ColumnHeader bg={tableHeaderBg} borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor}>Qoldiq</Table.ColumnHeader>
                                    <Table.ColumnHeader textAlign="center" bg={tableHeaderBg} borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor} w="140px">Amallar</Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body bg={tableBg}>
                                {customers.map((customer, index) => {
                                    const reminder = customer.lastReminder;
                                    const status = reminder ? getStatusMeta(reminder.paymentDate, isDark) : null;
                                    const StatusIcon = status?.Icon;

                                    return (
                                        <Table.Row key={customer.id} bg={tableBg} _hover={{ bg: isDark ? 'rgba(250, 204, 21, 0.06)' : '#FFFBEB' }}>
                                            <Table.Cell borderWidth="0.5px" borderColor={tableBorder} textAlign="center" color={subtitleColor}>
                                                {page * PAGE_SIZE + index + 1}
                                            </Table.Cell>

                                            <Table.Cell borderWidth="0.5px" borderColor={tableBorder}>
                                                <HStack gap={3}>
                                                    <Box p={2} borderRadius="lg" bg={isDark ? 'rgba(250, 204, 21, 0.12)' : '#FEF3C7'} color={accentColor}><LuUsers size={18} /></Box>
                                                    <Text as={Link} to={`${base}/customers/${customer.id}`} fontWeight="semibold" color={textColor} _hover={{ color: accentColor }}>{customer.name}</Text>
                                                </HStack>
                                            </Table.Cell>

                                            <Table.Cell borderWidth="0.5px" borderColor={tableBorder}>
                                                <HStack gap={2} color={textColor} whiteSpace="nowrap"><LuPhone size={14} color={subtitleColor} /><span>{customer.phone}</span></HStack>
                                            </Table.Cell>

                                            <Table.Cell borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor} maxW="220px">
                                                <Text noOfLines={2}>{customer.summary || '—'}</Text>
                                            </Table.Cell>

                                            {/* ── Eslatma ── */}
                                            <Table.Cell borderWidth="0.5px" borderColor={tableBorder} minW="230px">
                                                {reminder ? (
                                                    <VStack align="start" gap={1.5}>
                                                        {/* Date + status badge */}
                                                        <HStack gap={2} flexWrap="wrap">
                                                            <Text
                                                                fontSize="sm"
                                                                fontWeight="bold"
                                                                color={textColor}
                                                                whiteSpace="nowrap"
                                                            >
                                                                {formatShortDate(reminder.paymentDate)}
                                                            </Text>
                                                            {status && StatusIcon && (
                                                                <HStack
                                                                    gap={1}
                                                                    px={2}
                                                                    py={0.5}
                                                                    borderRadius="full"
                                                                    bg={status.bg}
                                                                    borderWidth="1px"
                                                                    borderColor={status.border}
                                                                    color={status.color}
                                                                >
                                                                    <StatusIcon size={10} />
                                                                    <Text fontSize="10px" fontWeight="bold" lineHeight="1.3">
                                                                        {status.label}
                                                                    </Text>
                                                                </HStack>
                                                            )}
                                                        </HStack>

                                                        {/* Price */}
                                                        {reminder.price !== null && reminder.price !== undefined && (
                                                            <Text
                                                                fontSize="sm"
                                                                fontWeight="bold"
                                                                color={isDark ? 'green.300' : 'green.700'}
                                                                whiteSpace="nowrap"
                                                            >
                                                                {formatNumber(reminder.price)} so‘m
                                                            </Text>
                                                        )}

                                                        {/* Note preview */}
                                                        {reminder.note && (
                                                            <HStack gap={1.5} align="start" color={subtitleColor} maxW="230px">
                                                                <LuStickyNote size={11} style={{ flexShrink: 0, marginTop: 3 }} />
                                                                <Text fontSize="xs" noOfLines={1} title={reminder.note}>
                                                                    {reminder.note}
                                                                </Text>
                                                            </HStack>
                                                        )}
                                                    </VStack>
                                                ) : (
                                                    <Text fontSize="sm" color={subtitleColor} fontStyle="italic">—</Text>
                                                )}
                                            </Table.Cell>

                                            <Table.Cell borderWidth="0.5px" borderColor={tableBorder}>{renderBalance(customer.balance)}</Table.Cell>

                                            <Table.Cell borderWidth="0.5px" borderColor={tableBorder}>
                                                <HStack justify="center" gap={1}>
                                                    <Button
                                                        onClick={() => navigate(`${base}/customers/${customer.id}/edit`)}
                                                        variant="ghost"
                                                        size="sm"
                                                        color={accentColor}
                                                        borderRadius="xl"
                                                        px={3}
                                                        aria-label="Tahrirlash"
                                                        _hover={{ bg: isDark ? 'rgba(250, 204, 21, 0.16)' : 'yellow.50', color: isDark ? 'yellow.200' : 'yellow.700' }}
                                                    >
                                                        <LuPen size={16} />
                                                    </Button>
                                                    <DeleteCustomer customer={customer} />
                                                </HStack>
                                            </Table.Cell>
                                        </Table.Row>
                                    );
                                })}
                            </Table.Body>
                        </Table.Root>
                    </Box>
                    {totalPages > 1 && (
                        <HStack justify="center" mt={8} gap={3}>
                            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((value) => value - 1)}><LuChevronLeft /></Button>
                            <Text color={subtitleColor} fontSize="sm">{page + 1} / {totalPages}</Text>
                            <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage((value) => value + 1)}><LuChevronRight /></Button>
                        </HStack>
                    )}
                </>
            )}
        </Box>
    );
}