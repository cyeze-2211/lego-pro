import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
    LuPhone,
    LuSearch,
    LuUsers,
    LuX,
    LuMapPin,
    LuHash,
    LuUserCheck,
    LuSend,
    LuCalendar,
    LuStickyNote,
} from 'react-icons/lu';
import { useGetCustomersQuery } from '../../../store/services/customer.api';
import { useGetRegionsQuery } from '../../../store/services/region.api';
import { BRAND_COLORS, useAppTheme } from '../../../theme/tokens';
import { Alert } from '../../Other/UI/Alert/Alert';
import Create from './__components/Create';
import Edit from './__components/Edit';
import Delete from './__components/Delete';
import Loading from '../../Other/UI/Loadings/Loading';
import EmptyData from '../../Other/UI/NoData/EmptyData';
import FormControl from '../../ui/FormControl';
import { formatNumber } from '../../ui/number-format';
import { useInfiniteList } from '../../ui/useInfiniteList';
import InfiniteSentinel from '../../ui/InfiniteSentinel';

const PAGE_SIZE = 12;

const formatDate = (value) => {
    if (!value) return '—';
    try {
        const date = new Date(value);
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = date.getFullYear();
        return `${d}.${m}.${y}`;
    } catch {
        return value;
    }
};

export default function Customer() {
    const [search, setSearch] = useState('');
    const [query, setQuery] = useState('');
    const [regionId, setRegionId] = useState('');
    const [page, setPage] = useState(0);
    const { data: regions = [], isError: regionsError } = useGetRegionsQuery();
    const { data: customerResult, isLoading, isFetching, error } = useGetCustomersQuery({
        name: query || undefined,
        regionId: regionId || undefined,
        page,
        size: PAGE_SIZE,
    });
    const selectedRegion = regions.find((region) => String(region.id) === String(regionId));
    const hasFilter = Boolean(query || regionId);
    const { isDark, pageBg, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();

    const pagination = customerResult?.pagination;
    const { items: customers, hasMore, sentinelRef, loadingMore, loadMore } = useInfiniteList({
        items: customerResult?.items,
        pagination,
        page,
        setPage,
        isFetching,
        resetKey: `${query}|${regionId}`,
    });

    const tableBg = isDark ? BRAND_COLORS.darkCardBg : cardBg;
    const tableHeaderBg = isDark ? tableBg : '#F8FAFC';
    const tableBorder = isDark ? cardBorder : '#CBD5E1';

    const cellBorder = { borderWidth: '0.5px', borderColor: tableBorder, verticalAlign: 'middle', px: 2.5, py: 2 };
    const headerCell = { ...cellBorder, bg: tableHeaderBg, color: subtitleColor, fontSize: 'xs', fontWeight: 'semibold', textTransform: 'uppercase', letterSpacing: 'wider' };

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

    const clearFilters = () => {
        setSearch('');
        setQuery('');
        setRegionId('');
        setPage(0);
    };

    useEffect(() => {
        if (regionsError) Alert('Viloyatlar ro‘yxatini yuklashda xatolik', 'error');
    }, [regionsError]);

    useEffect(() => {
        if (error) Alert(error?.data?.message || 'Mijozlarni yuklashda xatolik', 'error');
    }, [error]);

    const renderBalance = (balance) => {
        const value = Number(balance) || 0;
        if (value < 0) {
            return (
                <VStack align="start" gap={0} lineHeight="1.15">
                    <Text fontWeight="bold" whiteSpace="nowrap" fontSize="sm" color={isDark ? 'red.300' : 'red.600'}>
                        {formatNumber(Math.abs(value))}
                    </Text>
                    <Text fontSize="10px" color={isDark ? 'red.300' : 'red.600'}>qarzdor</Text>
                </VStack>
            );
        }
        if (value > 0) {
            return (
                <VStack align="start" gap={0} lineHeight="1.15">
                    <Text fontWeight="bold" whiteSpace="nowrap" fontSize="sm" color={isDark ? 'green.300' : 'green.700'}>
                        {formatNumber(value)}
                    </Text>
                    <Text fontSize="10px" color={isDark ? 'green.300' : 'green.700'}>kredit</Text>
                </VStack>
            );
        }
        return <Text color={subtitleColor} fontSize="sm" whiteSpace="nowrap">0</Text>;
    };

    const miniIconBox = {
        p: 1,
        borderRadius: 'md',
        bg: isDark ? 'rgba(250, 204, 21, 0.12)' : '#FEF3C7',
        color: accentColor,
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
    };

    return (
        <Box my={2} bg={pageBg} color={textColor} minH="100%">
            <HStack justify="space-between" align="start" flexWrap="wrap" gap={4} mb={4}>
                <Box>
                    <Heading className="text-[35px] font-semibold" color={textColor}>Mijozlar</Heading>
                    <Text color={subtitleColor} fontSize="sm" mt={1}>
                        Jami: {pagination?.totalElements ?? 0} ta mijoz
                    </Text>
                </Box>
                <Create />
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
                <Box position="relative" w={{ base: '100%', md: '260px' }} flexShrink={0}>
                    <Box position="absolute" left={4} top="50%" transform="translateY(-50%)" color={regionId ? accentColor : subtitleColor} zIndex={1} pointerEvents="none">
                        <LuMapPin size={16} />
                    </Box>
                    <FormControl
                        as="select"
                        value={regionId}
                        onChange={(event) => { setRegionId(event.target.value); setPage(0); }}
                        aria-label="Viloyat bo‘yicha filtrlash"
                        pl={10}
                        minH="32px"
                    >
                        <option value="">Barcha viloyatlar</option>
                        {regions.map((region) => <option key={region.id} value={region.id}>{region.name}</option>)}
                    </FormControl>
                </Box>
                <Button type="submit" bg={accentColor} color="black" borderRadius="xl" minH="32px" px={6} flexShrink={0} _hover={{ bg: 'yellow.500', transform: 'translateY(-1px)' }}>
                    <HStack gap={2}><LuSearch size={18} /><span>Qidirish</span></HStack>
                </Button>
                {hasFilter && (
                    <Button type="button" variant="ghost" color={subtitleColor} borderRadius="xl" minH="32px" px={4} flexShrink={0} onClick={clearFilters} _hover={{ bg: isDark ? 'whiteAlpha.100' : 'gray.100', color: textColor }}>
                        <HStack gap={2}><LuX size={16} /><span>Tozalash</span></HStack>
                    </Button>
                )}
            </HStack>

            {hasFilter && (
                <HStack gap={2} mb={4} flexWrap="wrap" fontSize="sm" color={subtitleColor}>
                    <Text>Filtr:</Text>
                    {query && (
                        <HStack gap={1.5} px={3} py={1} borderRadius="full" borderWidth="1px" borderColor={cardBorder} bg={cardBg} color={textColor}>
                            <LuSearch size={12} /><span>{query}</span>
                            <Button variant="ghost" size="xs" minW={0} w="18px" h="18px" p={0} borderRadius="full" color={subtitleColor} onClick={clearSearch} aria-label="Qidiruvni olib tashlash"><LuX size={12} /></Button>
                        </HStack>
                    )}
                    {selectedRegion && (
                        <HStack gap={1.5} px={3} py={1} borderRadius="full" borderWidth="1px" borderColor={cardBorder} bg={cardBg} color={textColor}>
                            <LuMapPin size={12} /><span>{selectedRegion.name}</span>
                            <Button variant="ghost" size="xs" minW={0} w="18px" h="18px" p={0} borderRadius="full" color={subtitleColor} onClick={() => { setRegionId(''); setPage(0); }} aria-label="Viloyat filtrini olib tashlash"><LuX size={12} /></Button>
                        </HStack>
                    )}
                    <Text>· {pagination?.totalElements ?? 0} ta natija</Text>
                </HStack>
            )}

            {(isLoading || (isFetching && customers.length === 0)) ? (
                <Loading />
            ) : error ? (
                <Box p={8} textAlign="center" color={isDark ? 'red.300' : 'red.600'}>Ma&apos;lumotlarni yuklashda xatolik</Box>
            ) : customers.length === 0 ? (
                <EmptyData
                    text={hasFilter ? 'Filtr bo‘yicha mijoz topilmadi' : 'Hozircha mijozlar yo‘q'}
                    description={hasFilter ? 'Boshqa nom yoki viloyatni tanlab ko‘ring, yoki filtrlarni tozalang.' : 'Yangi mijoz qo‘shib ma’lumotnomani to‘ldiring.'}
                    action={hasFilter ? <Button variant="outline" borderRadius="xl" h="42px" px={4} onClick={clearFilters}><HStack gap={2}><LuX size={16} /><span>Filtrlarni tozalash</span></HStack></Button> : <Create />}
                />
            ) : (
                <>
                    <Box
                        overflowX="auto"
                        bg={tableBg}
                        borderWidth="0.5px"
                        borderColor={tableBorder}
                        borderRadius="10px"
                        boxShadow={isDark ? '0 16px 40px rgba(0, 0, 0, 0.22)' : '0 8px 24px rgba(15, 23, 42, 0.10)'}
                    >
                        <Table.Root size="sm" interactive bg={tableBg} borderCollapse="collapse" minW="1150px">
                            <Table.Header bg={tableHeaderBg}>
                                <Table.Row bg={tableHeaderBg}>
                                    <Table.ColumnHeader {...headerCell} textAlign="center" w="44px">№</Table.ColumnHeader>
                                    <Table.ColumnHeader {...headerCell} minW="200px">Mijoz</Table.ColumnHeader>
                                    <Table.ColumnHeader {...headerCell} minW="150px">Telefon</Table.ColumnHeader>
                                    <Table.ColumnHeader {...headerCell} minW="180px">Manzil</Table.ColumnHeader>
                                    <Table.ColumnHeader {...headerCell} minW="110px">INN</Table.ColumnHeader>
                                    <Table.ColumnHeader {...headerCell} minW="140px">Agent</Table.ColumnHeader>
                                    <Table.ColumnHeader {...headerCell} minW="130px">Telegram</Table.ColumnHeader>
                                    <Table.ColumnHeader {...headerCell} minW="170px">Izoh</Table.ColumnHeader>
                                    <Table.ColumnHeader {...headerCell} minW="120px">Qoldiq</Table.ColumnHeader>
                                    <Table.ColumnHeader {...headerCell} minW="110px">Sana</Table.ColumnHeader>
                                    <Table.ColumnHeader {...headerCell} textAlign="center" minW="90px">Amal</Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body bg={tableBg}>
                                {customers.map((customer, index) => (
                                    <Table.Row
                                        key={customer.id}
                                        bg={tableBg}
                                        _hover={{ bg: isDark ? 'rgba(250, 204, 21, 0.06)' : '#FFFBEB' }}
                                    >
                                        <Table.Cell {...cellBorder} textAlign="center" color={subtitleColor} fontSize="sm">
                                            {index + 1}
                                        </Table.Cell>

                                        {/* Mijoz */}
                                        <Table.Cell {...cellBorder}>
                                            <HStack gap={2.5}>
                                                <Box {...miniIconBox}><LuUsers size={15} /></Box>
                                                <VStack align="start" gap={0} lineHeight="1.2">
                                                    <Text
                                                        as={Link}
                                                        to={`/customers/${customer.id}`}
                                                        fontWeight="semibold"
                                                        fontSize="sm"
                                                        color={textColor}
                                                        _hover={{ color: accentColor }}
                                                        noOfLines={1}
                                                    >
                                                        {customer.name}
                                                    </Text>
                                                 
                                                </VStack>
                                            </HStack>
                                        </Table.Cell>

                                        {/* Telefon */}
                                        <Table.Cell {...cellBorder}>
                                            <HStack gap={1.5} color={textColor} whiteSpace="nowrap" fontSize="sm">
                                                <LuPhone size={13} color={subtitleColor} />
                                                <span>{customer.phone || '—'}</span>
                                            </HStack>
                                        </Table.Cell>

                                        {/* Manzil */}
                                        <Table.Cell {...cellBorder}>
                                            {customer.address ? (
                                                <HStack gap={1.5} align="start">
                                                    <Box color={subtitleColor} mt="3px"><LuMapPin size={13} /></Box>
                                                    <Text color={textColor} fontSize="sm" noOfLines={2} lineHeight="1.3">{customer.address}</Text>
                                                </HStack>
                                            ) : (
                                                <Text color={subtitleColor} fontSize="sm">—</Text>
                                            )}
                                        </Table.Cell>

                                        {/* INN */}
                                        <Table.Cell {...cellBorder}>
                                            {customer.inn ? (
                                                <HStack gap={1.5} color={textColor}>
                                                    <LuHash size={13} color={subtitleColor} />
                                                    <Text fontFamily="mono" fontSize="sm">{customer.inn}</Text>
                                                </HStack>
                                            ) : (
                                                <Text color={subtitleColor} fontSize="sm">—</Text>
                                            )}
                                        </Table.Cell>

                                        {/* Agent */}
                                        <Table.Cell {...cellBorder}>
                                            {customer.agentName ? (
                                                <HStack gap={1.5}>
                                                    <Box p={1} borderRadius="md" bg={isDark ? 'rgba(96, 165, 250, 0.15)' : '#DBEAFE'} color={isDark ? 'blue.300' : 'blue.600'}>
                                                        <LuUserCheck size={12} />
                                                    </Box>
                                                    <Text color={textColor} fontSize="sm" noOfLines={1}>{customer.agentName}</Text>
                                                </HStack>
                                            ) : (
                                                <Text color={subtitleColor} fontSize="sm">—</Text>
                                            )}
                                        </Table.Cell>

                                        {/* Telegram */}
                                        <Table.Cell {...cellBorder}>
                                            {customer.telegramChatId ? (
                                                <HStack gap={1.5}>
                                                    <Box p={1} borderRadius="md" bg={isDark ? 'rgba(56, 189, 248, 0.15)' : '#E0F2FE'} color={isDark ? 'cyan.300' : 'cyan.600'}>
                                                        <LuSend size={12} />
                                                    </Box>
                                                    <Text color={textColor} fontSize="xs" fontFamily="mono">{customer.telegramChatId}</Text>
                                                </HStack>
                                            ) : (
                                                <Text color={subtitleColor} fontSize="xs">—</Text>
                                            )}
                                        </Table.Cell>

                                        {/* Izoh */}
                                        <Table.Cell {...cellBorder}>
                                            {customer.summary ? (
                                                <HStack gap={1.5} align="start">
                                                    <Box color={subtitleColor} mt="3px"><LuStickyNote size={13} /></Box>
                                                    <Text color={subtitleColor} fontSize="sm" noOfLines={2} lineHeight="1.3">{customer.summary}</Text>
                                                </HStack>
                                            ) : (
                                                <Text color={subtitleColor} fontSize="sm">—</Text>
                                            )}
                                        </Table.Cell>

                                        {/* Qoldiq */}
                                        <Table.Cell {...cellBorder}>{renderBalance(customer.balance)}</Table.Cell>

                                        {/* Sana (yaratilgan) */}
                                        <Table.Cell {...cellBorder}>
                                            <HStack gap={1.5} color={subtitleColor}>
                                                <LuCalendar size={13} />
                                                <Text fontSize="sm" whiteSpace="nowrap">{formatDate(customer.createdAt)}</Text>
                                            </HStack>
                                        </Table.Cell>

                                        {/* Amallar */}
                                        <Table.Cell {...cellBorder}>
                                            <HStack justify="center" gap={1}>
                                                <Edit customer={customer} />
                                                <Delete customer={customer} />
                                            </HStack>
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table.Root>
                    </Box>

                    <InfiniteSentinel sentinelRef={sentinelRef} hasMore={hasMore} loadingMore={loadingMore} loaded={customers.length} total={pagination?.totalElements ?? customers.length} unit="ta mijoz" onLoadMore={loadMore} />
                </>
            )}
        </Box>
    );
}