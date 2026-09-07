import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Button, HStack, Heading, Table, Text } from '@chakra-ui/react';
import { LuChevronLeft, LuChevronRight, LuFileText, LuSearch, LuX } from 'react-icons/lu';
import { useGetRawMaterialsQuery } from '../../../store/services/raw.api';
import { useGetWarehousesQuery } from '../../../store/services/warehouse.api';
import { BRAND_COLORS, useAppTheme } from '../../../theme/tokens';
import { Alert } from '../../Other/UI/Alert/Alert';
import Loading from '../../Other/UI/Loadings/Loading';
import EmptyData from '../../Other/UI/NoData/EmptyData';
import FormControl from '../../ui/FormControl';
import Create from './__components/Create';
import Edit from './__components/Edit';
import Delete from './__components/Delete';

const PAGE_SIZE = 12;

export default function Raw() {
    const [search, setSearch] = useState('');
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(0);
    const { data: result, isLoading, error } = useGetRawMaterialsQuery({
        name: query || undefined,
        page,
        size: PAGE_SIZE,
    });
    const { data: warehouses = [] } = useGetWarehousesQuery('RAW_MATERIAL');
    const {
        isDark,
        pageBg,
        cardBg,
        cardBorder,
        textColor,
        subtitleColor,
        accentColor,
    } = useAppTheme();

    const materials = result?.items || [];
    const totalPages = result?.pagination?.totalPages || 0;
    const tableBg = isDark ? BRAND_COLORS.darkCardBg : cardBg;
    const tableHeaderBg = isDark ? tableBg : '#F8FAFC';
    const tableBorder = isDark ? cardBorder : '#CBD5E1';

    useEffect(() => {
        if (error) {
            Alert(error?.data?.message || 'Xom ashyolarni yuklashda xatolik', 'error');
        }
    }, [error]);

    const submitSearch = (event) => {
        event.preventDefault();
        setPage(0);
        setQuery(search.trim());
    };

    const clearSearch = () => {
        setSearch('');
        setQuery('');
        setPage(0);
    };

    const renderSearch = () => (
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
                    placeholder="Xom ashyo nomi bo‘yicha qidiring..."
                    aria-label="Xom ashyo qidirish"
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
                    >
                        <LuX size={16} />
                    </Button>
                )}
            </Box>
            <Button type="submit" bg={accentColor} color="black" borderRadius="xl" minH="32px" px={6} flexShrink={0} _hover={{ bg: 'yellow.500', transform: 'translateY(-1px)' }}>
                <HStack gap={2}><LuSearch size={18} /><span>Qidirish</span></HStack>
            </Button>
        </HStack>
    );

    const renderTable = () => (
        <Box overflowX="auto" bg={tableBg} borderWidth="0.5px" borderColor={tableBorder} borderRadius="10px" boxShadow={isDark ? '0 16px 40px rgba(0, 0, 0, 0.22)' : '0 8px 24px rgba(15, 23, 42, 0.10)'}>
            <Table.Root size="md" interactive bg={tableBg} borderCollapse="collapse">
                <Table.Header bg={tableHeaderBg}>
                    <Table.Row bg={tableHeaderBg}>
                        <Table.ColumnHeader bg={tableHeaderBg} borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor} w="60px" textAlign="center">№</Table.ColumnHeader>
                        <Table.ColumnHeader bg={tableHeaderBg} borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor}>Nomi</Table.ColumnHeader>
                        <Table.ColumnHeader bg={tableHeaderBg} borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor}>Tavsifi</Table.ColumnHeader>
                        <Table.ColumnHeader bg={tableHeaderBg} borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor} textAlign="center">Amallar</Table.ColumnHeader>
                    </Table.Row>
                </Table.Header>
                <Table.Body bg={tableBg}>
                    {materials.map((material, index) => (
                        <Table.Row key={material.id} bg={tableBg} _hover={{ bg: isDark ? 'rgba(250, 204, 21, 0.06)' : '#FFFBEB' }}>
                            <Table.Cell borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor} textAlign="center">{page * PAGE_SIZE + index + 1}</Table.Cell>
                            <Table.Cell borderWidth="0.5px" borderColor={tableBorder}>
                                <HStack gap={3}>
                                    <Box p={2} borderRadius="lg" bg={isDark ? 'rgba(250, 204, 21, 0.12)' : '#FEF3C7'} color={accentColor}><LuFileText size={18} /></Box>
                                    <Text as={Link} to={`/raw/${material.id}`} fontWeight="semibold" color={textColor} _hover={{ color: accentColor }}>{material.name}</Text>
                                </HStack>
                            </Table.Cell>
                            <Table.Cell borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor}>{material.summary || 'Tavsifsiz'}</Table.Cell>
                            <Table.Cell borderWidth="0.5px" borderColor={tableBorder}>
                                <HStack justify="center"><Edit material={material} /><Delete material={material} /></HStack>
                            </Table.Cell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table.Root>
        </Box>
    );

    return (
        <Box my={2} bg={pageBg} color={textColor} minH="100%">
            <HStack justify="space-between" align="start" flexWrap="wrap" gap={4} mb={4}>
                <Box>
                    <Heading className="text-[35px] font-semibold" color={textColor}>Xom ashyo</Heading>
                </Box>
                <Create warehouses={warehouses} />
            </HStack>

            {renderSearch()}

            {isLoading ? (
                <Loading />
            ) : error ? (
                <Box p={8} textAlign="center" color={isDark ? 'red.300' : 'red.600'}>Ma&apos;lumotlarni yuklashda xatolik</Box>
            ) : materials.length === 0 ? (
                <EmptyData
                    text={query ? 'Qidiruv bo‘yicha xom ashyo topilmadi' : 'Hozircha xom ashyo yo‘q'}
                    description="Yangi xom ashyo qo‘shib katalogni to‘ldiring."
                    action={<Create warehouses={warehouses} />}
                />
            ) : (
                <>
                    {renderTable()}
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
