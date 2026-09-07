import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Box,
    Button,
    HStack,
    Heading,
    Table,
    Text,
} from '@chakra-ui/react';
import { LuSearch, LuWallet, LuX } from 'react-icons/lu';
import { useGetCashboxesQuery } from '../../../store/services/cashbox.api';
import { BRAND_COLORS, useAppTheme } from '../../../theme/tokens';
import { Alert } from '../../Other/UI/Alert/Alert';
import Create from './__components/Create';
import Edit from './__components/Edit';
import Delete from './__components/Delete';
import Loading from '../../Other/UI/Loadings/Loading';
import EmptyData from '../../Other/UI/NoData/EmptyData';
import FormControl from '../../ui/FormControl';
import { formatNumber } from '../../ui/number-format';

export default function Cashbox() {
    const [search, setSearch] = useState('');
    const [query, setQuery] = useState('');
    const { data: cashboxes = [], isLoading, error } = useGetCashboxesQuery();
    const { isDark, pageBg, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();
    const tableBg = isDark ? BRAND_COLORS.darkCardBg : cardBg;
    const tableHeaderBg = isDark ? tableBg : '#F8FAFC';
    const tableBorder = isDark ? cardBorder : '#CBD5E1';

    const filteredCashboxes = useMemo(() => {
        if (!query) return cashboxes;
        const lowerQuery = query.toLowerCase();
        return cashboxes.filter(
            (cashbox) =>
                cashbox.name?.toLowerCase().includes(lowerQuery) ||
                cashbox.summary?.toLowerCase().includes(lowerQuery),
        );
    }, [cashboxes, query]);

    const submitSearch = (event) => {
        event.preventDefault();
        setQuery(search.trim());
    };

    const clearSearch = () => {
        setSearch('');
        setQuery('');
    };

    useEffect(() => {
        if (error) Alert(error?.data?.message || 'Kassalarni yuklashda xatolik', 'error');
    }, [error]);

    const renderBalance = (balance) => {
        const value = Number(balance) || 0;
        return (
            <Text fontWeight="bold" whiteSpace="nowrap" color={value >= 0 ? (isDark ? 'green.300' : 'green.700') : (isDark ? 'red.300' : 'red.600')}>
                {formatNumber(value)} so‘m
            </Text>
        );
    };

    return (
        <Box my={2} bg={pageBg} color={textColor} minH="100%">
            <HStack justify="space-between" align="start" flexWrap="wrap" gap={4} mb={4}>
                <Box>
                    <Heading className="text-[35px] font-semibold" color={textColor}>Kassalar</Heading>
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
                        placeholder="Kassa nomi yoki izoh bo‘yicha qidiring..."
                        aria-label="Kassa qidirish"
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
            ) : filteredCashboxes.length === 0 ? (
                <EmptyData
                    text={query ? 'Qidiruv bo‘yicha kassa topilmadi' : 'Hozircha kassalar yo‘q'}
                    description="Yangi kassa qo‘shib ma’lumotnomani to‘ldiring."
                    action={<Create />}
                />
            ) : (
                <Box overflowX="auto" bg={tableBg} borderWidth="0.5px" borderColor={tableBorder} borderRadius="10px" boxShadow={isDark ? '0 16px 40px rgba(0, 0, 0, 0.22)' : '0 8px 24px rgba(15, 23, 42, 0.10)'}>
                    <Table.Root size="md" interactive bg={tableBg} borderCollapse="collapse">
                        <Table.Header bg={tableHeaderBg}>
                            <Table.Row bg={tableHeaderBg}>
                                <Table.ColumnHeader textAlign="center" bg={tableHeaderBg} borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor} w="60px">№</Table.ColumnHeader>
                                <Table.ColumnHeader bg={tableHeaderBg} borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor}>Kassa</Table.ColumnHeader>
                                <Table.ColumnHeader bg={tableHeaderBg} borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor}>Izoh</Table.ColumnHeader>
                                <Table.ColumnHeader bg={tableHeaderBg} borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor}>Qoldiq</Table.ColumnHeader>
                                <Table.ColumnHeader textAlign="center" bg={tableHeaderBg} borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor}>Amallar</Table.ColumnHeader>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body bg={tableBg}>
                            {filteredCashboxes.map((cashbox, index) => (
                                <Table.Row key={cashbox.id} bg={tableBg} _hover={{ bg: isDark ? 'rgba(250, 204, 21, 0.06)' : '#FFFBEB' }}>
                                    <Table.Cell borderWidth="0.5px" borderColor={tableBorder} textAlign="center" color={subtitleColor}>{index + 1}</Table.Cell>
                                    <Table.Cell borderWidth="0.5px" borderColor={tableBorder}>
                                        <HStack gap={3}>
                                            <Box p={2} borderRadius="lg" bg={isDark ? 'rgba(250, 204, 21, 0.12)' : '#FEF3C7'} color={accentColor}><LuWallet size={18} /></Box>
                                            <Text as={Link} to={`/cashboxes/${cashbox.id}`} fontWeight="semibold" color={textColor} _hover={{ color: accentColor }}>{cashbox.name}</Text>
                                        </HStack>
                                    </Table.Cell>
                                    <Table.Cell borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor} maxW="260px">{cashbox.summary || '—'}</Table.Cell>
                                    <Table.Cell borderWidth="0.5px" borderColor={tableBorder}>{renderBalance(cashbox.balance)}</Table.Cell>
                                    <Table.Cell borderWidth="0.5px" borderColor={tableBorder}>
                                        <HStack justify="center" gap={1}><Edit cashbox={cashbox} /><Delete cashbox={cashbox} /></HStack>
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table.Root>
                </Box>
            )}
        </Box>
    );
}
