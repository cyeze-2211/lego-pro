import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Box,
    Button,
    HStack,
    Heading,
    Table,
    Text,
} from '@chakra-ui/react';
import { LuChevronLeft, LuChevronRight, LuPhone, LuSearch, LuUsers, LuX } from 'react-icons/lu';
import { useGetCustomersQuery } from '../../../store/services/customer.api';
import { BRAND_COLORS, useAppTheme } from '../../../theme/tokens';
import { Alert } from '../../Other/UI/Alert/Alert';
import Create from './__components/Create';
import Edit from './__components/Edit';
import Delete from './__components/Delete';
import Loading from '../../Other/UI/Loadings/Loading';
import EmptyData from '../../Other/UI/NoData/EmptyData';
import FormControl from '../../ui/FormControl';
import { formatNumber } from '../../ui/number-format';

const PAGE_SIZE = 12;

export default function Customer() {
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
        if (value > 0) {
            return <Text fontWeight="bold" whiteSpace="nowrap" color={isDark ? 'red.300' : 'red.600'}>{formatNumber(value)} so‘m (qarzdor)</Text>;
        }
        if (value < 0) {
            return <Text fontWeight="bold" whiteSpace="nowrap" color={isDark ? 'green.300' : 'green.700'}>{formatNumber(Math.abs(value))} so‘m (kredit)</Text>;
        }
        return <Text color={subtitleColor} whiteSpace="nowrap">0 so‘m</Text>;
    };

    return (
        <Box my={2} bg={pageBg} color={textColor} minH="100%">
            <HStack justify="space-between" align="start" flexWrap="wrap" gap={4} mb={4}>
                <Box>
                    <Heading className="text-[35px] font-semibold" color={textColor}>Mijozlar</Heading>
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
                    action={<Create />}
                />
            ) : (
                <>
                    <Box overflowX="auto" bg={tableBg} borderWidth="0.5px" borderColor={tableBorder} borderRadius="10px" boxShadow={isDark ? '0 16px 40px rgba(0, 0, 0, 0.22)' : '0 8px 24px rgba(15, 23, 42, 0.10)'}>
                        <Table.Root size="md" interactive bg={tableBg} borderCollapse="collapse">
                            <Table.Header bg={tableHeaderBg}>
                                <Table.Row bg={tableHeaderBg}>
                                    <Table.ColumnHeader textAlign="center" bg={tableHeaderBg} borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor} w="60px">№</Table.ColumnHeader>
                                    <Table.ColumnHeader bg={tableHeaderBg} borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor}>Mijoz</Table.ColumnHeader>
                                    <Table.ColumnHeader bg={tableHeaderBg} borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor}>Telefon</Table.ColumnHeader>
                                    <Table.ColumnHeader bg={tableHeaderBg} borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor}>Izoh</Table.ColumnHeader>
                                    <Table.ColumnHeader bg={tableHeaderBg} borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor}>Qoldiq</Table.ColumnHeader>
                                    <Table.ColumnHeader textAlign="center" bg={tableHeaderBg} borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor}>Amallar</Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body bg={tableBg}>
                                {customers.map((customer, index) => (
                                    <Table.Row key={customer.id} bg={tableBg} _hover={{ bg: isDark ? 'rgba(250, 204, 21, 0.06)' : '#FFFBEB' }}>
                                        <Table.Cell borderWidth="0.5px" borderColor={tableBorder} textAlign="center" color={subtitleColor}>{page * PAGE_SIZE + index + 1}</Table.Cell>
                                        <Table.Cell borderWidth="0.5px" borderColor={tableBorder}>
                                            <HStack gap={3}>
                                                <Box p={2} borderRadius="lg" bg={isDark ? 'rgba(250, 204, 21, 0.12)' : '#FEF3C7'} color={accentColor}><LuUsers size={18} /></Box>
                                                <Text as={Link} to={`/customers/${customer.id}`} fontWeight="semibold" color={textColor} _hover={{ color: accentColor }}>{customer.name}</Text>
                                            </HStack>
                                        </Table.Cell>
                                        <Table.Cell borderWidth="0.5px" borderColor={tableBorder}>
                                            <HStack gap={2} color={textColor} whiteSpace="nowrap"><LuPhone size={14} color={subtitleColor} /><span>{customer.phone}</span></HStack>
                                        </Table.Cell>
                                        <Table.Cell borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor} maxW="260px">{customer.summary || '—'}</Table.Cell>
                                        <Table.Cell borderWidth="0.5px" borderColor={tableBorder}>{renderBalance(customer.balance)}</Table.Cell>
                                        <Table.Cell borderWidth="0.5px" borderColor={tableBorder}>
                                            <HStack justify="center" gap={1}><Edit customer={customer} /><Delete customer={customer} /></HStack>
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table.Root>
                    </Box>
                    {totalPages > 1 && <HStack justify="center" mt={8} gap={3}><Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((value) => value - 1)}><LuChevronLeft /></Button><Text color={subtitleColor} fontSize="sm">{page + 1} / {totalPages}</Text><Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage((value) => value + 1)}><LuChevronRight /></Button></HStack>}
                </>
            )}
        </Box>
    );
}
