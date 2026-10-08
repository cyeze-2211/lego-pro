import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
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
    LuChevronLeft,
    LuChevronRight,
    LuHash,
    LuMapPin,
    LuPhone,
    LuSearch,
    LuStickyNote,
    LuTruck,
    LuX,
    LuExternalLink,
} from 'react-icons/lu';
import { useGetRegionsQuery } from '../../../store/services/region.api';
import { useGetSuppliersQuery } from '../../../store/services/supplier.api';
import { ROLES } from '../../../app/permissions/roles';
import { useAppSelector } from '../../../store/hooks';
import { BRAND_COLORS, useAppTheme } from '../../../theme/tokens';
import { formatNumber } from '../../ui/number-format';
import { Alert } from '../../Other/UI/Alert/Alert';
import Loading from '../../Other/UI/Loadings/Loading';
import EmptyData from '../../Other/UI/NoData/EmptyData';
import FormControl from '../../ui/FormControl';
import Create from './__components/Create';
import Edit from './__components/Edit';
import Delete from './__components/Delete';

const PAGE_SIZE = 12;

export default function Supplier() {
    const [search, setSearch] = useState('');
    const [query, setQuery] = useState('');
    const [regionId, setRegionId] = useState('');
    const [page, setPage] = useState(0);
    const role = useAppSelector((state) => state.auth.role);
    const canManageSuppliers = role === ROLES.MANAGER;
    const { data: regions = [], isError: regionsError } = useGetRegionsQuery();
    const { data: supplierResult, isLoading, error } = useGetSuppliersQuery({
        name: query || undefined,
        regionId: regionId || undefined,
        page,
        size: PAGE_SIZE,
        sort: ['createdAt,DESC', 'id,DESC'],
    });
    const { isDark, pageBg, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();

    const suppliers = supplierResult?.items ?? [];
    const pagination = supplierResult?.pagination;
    const totalPages = pagination?.totalPages ?? 0;
    const tableBg = isDark ? BRAND_COLORS.darkCardBg : cardBg;
    const tableHeaderBg = isDark ? tableBg : '#F8FAFC';
    const tableBorder = isDark ? cardBorder : '#CBD5E1';
    const cellBorder = { borderWidth: '0.5px', borderColor: tableBorder, verticalAlign: 'middle', px: 2.5, py: 2 };
    const headerCell = { ...cellBorder, bg: tableHeaderBg, color: subtitleColor, fontSize: 'xs', fontWeight: 'semibold', textTransform: 'uppercase', letterSpacing: 'wider' };

    useEffect(() => {
        if (error) Alert(error?.data?.message || 'Yetkazib beruvchilarni yuklashda xatolik', 'error');
    }, [error]);

    useEffect(() => {
        if (regionsError) Alert('Viloyatlar ro‘yxatini yuklashda xatolik', 'error');
    }, [regionsError]);

    const submitSearch = (event) => {
        event.preventDefault();
        setPage(0);
        setQuery(search.trim());
    };

    const clearFilters = () => {
        setSearch('');
        setQuery('');
        setRegionId('');
        setPage(0);
    };

    const renderBalance = (balance) => {
        const value = Number(balance) || 0;
        if (value < 0) {
            return (
                <VStack align="start" gap={0} lineHeight="1.15">
                    <Text fontWeight="bold" whiteSpace="nowrap" fontSize="sm" color={isDark ? 'red.300' : 'red.600'}>
                        {formatNumber(Math.abs(value))}
                    </Text>
                    <Text fontSize="10px" color={isDark ? 'red.300' : 'red.600'}>biz qarzdormiz</Text>
                </VStack>
            );
        }
        if (value > 0) {
            return (
                <VStack align="start" gap={0} lineHeight="1.15">
                    <Text fontWeight="bold" whiteSpace="nowrap" fontSize="sm" color={isDark ? 'green.300' : 'green.700'}>
                        {formatNumber(value)}
                    </Text>
                    <Text fontSize="10px" color={isDark ? 'green.300' : 'green.700'}>oldindan to‘langan</Text>
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
                    <Heading className="text-[35px] font-semibold" color={textColor}>Yetkazib beruvchilar</Heading>
                 
                </Box>
                {canManageSuppliers && <Create />}
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
                        placeholder="Yetkazib beruvchi nomi bo‘yicha qidiring..."
                        aria-label="Yetkazib beruvchini qidirish"
                        pl={11}
                        pr={search ? 11 : 4}
                        minH="44px"
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
                            onClick={() => { setSearch(''); setQuery(''); setPage(0); }}
                            _hover={{ bg: isDark ? 'whiteAlpha.100' : 'gray.100', color: textColor }}
                        >
                            <LuX size={16} />
                        </Button>
                    )}
                </Box>
                <FormControl
                    as="select"
                    value={regionId}
                    onChange={(event) => { setRegionId(event.target.value); setPage(0); }}
                    aria-label="Viloyat bo‘yicha filtrlash"
                    minH="44px"
                    maxW={{ md: '260px' }}
                >
                    <option value="">Barcha viloyatlar</option>
                    {regions.map((region) => <option key={region.id} value={region.id}>{region.name}</option>)}
                </FormControl>
                {(query || regionId) && (
                    <Button type="button" variant="ghost" color={subtitleColor} onClick={clearFilters} minH="44px">
                        <HStack gap={2}><LuX size={16} /><span>Tozalash</span></HStack>
                    </Button>
                )}
                <Button type="submit" bg={accentColor} color="black" borderRadius="xl" minH="44px" px={6} flexShrink={0} _hover={{ bg: 'yellow.500', transform: 'translateY(-1px)' }}>
                    <HStack gap={2}><LuSearch size={18} /><span>Qidirish</span></HStack>
                </Button>
            </HStack>

            {isLoading ? (
                <Loading />
            ) : error ? (
                <Box p={8} textAlign="center" color={isDark ? 'red.300' : 'red.600'}>Ma&apos;lumotlarni yuklashda xatolik</Box>
            ) : suppliers.length === 0 ? (
                <EmptyData
                    text={query || regionId ? 'Filtr bo‘yicha yetkazib beruvchi topilmadi' : 'Hozircha yetkazib beruvchilar yo‘q'}
                    description="Yangi yetkazib beruvchi qo‘shib ma’lumotnomani to‘ldiring."
                    action={canManageSuppliers ? <Create /> : undefined}
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
                        <Table.Root size="sm" interactive bg={tableBg} borderCollapse="collapse" minW="950px">
                            <Table.Header bg={tableHeaderBg}>
                                <Table.Row bg={tableHeaderBg}>
                                    <Table.ColumnHeader {...headerCell} textAlign="center" w="44px">№</Table.ColumnHeader>
                                    <Table.ColumnHeader {...headerCell} minW="220px">Yetkazib beruvchi</Table.ColumnHeader>
                                    <Table.ColumnHeader {...headerCell} minW="150px">Telefon</Table.ColumnHeader>
                                    <Table.ColumnHeader {...headerCell} minW="180px">Viloyat / manzil</Table.ColumnHeader>
                                    <Table.ColumnHeader {...headerCell} minW="120px">INN</Table.ColumnHeader>
                                    <Table.ColumnHeader {...headerCell} minW="170px">Balans</Table.ColumnHeader>
                                    <Table.ColumnHeader {...headerCell} minW="180px">Izoh</Table.ColumnHeader>
                                    <Table.ColumnHeader {...headerCell} textAlign="center" minW="160px">Amal</Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body bg={tableBg}>
                                {suppliers.map((supplier, index) => (
                                    <Table.Row key={supplier.id} bg={tableBg} _hover={{ bg: isDark ? 'rgba(250, 204, 21, 0.06)' : '#FFFBEB' }}>
                                        <Table.Cell {...cellBorder} textAlign="center" color={subtitleColor} fontSize="sm">
                                            {page * PAGE_SIZE + index + 1}
                                        </Table.Cell>
                                        <Table.Cell {...cellBorder}>
                                            <HStack gap={2.5}>
                                                <Box {...miniIconBox}><LuTruck size={15} /></Box>
                                                <Text asChild fontWeight="semibold" fontSize="sm" color={textColor} noOfLines={1} _hover={{ color: accentColor }}>
                                                    <RouterLink to={`/suppliers/${supplier.id}`}>{supplier.name}</RouterLink>
                                                </Text>
                                            </HStack>
                                        </Table.Cell>
                                        <Table.Cell {...cellBorder}>
                                            <HStack gap={1.5} color={textColor} whiteSpace="nowrap" fontSize="sm">
                                                <LuPhone size={13} color={subtitleColor} /><span>{supplier.phone || '—'}</span>
                                            </HStack>
                                        </Table.Cell>
                                        <Table.Cell {...cellBorder}>
                                            <VStack align="start" gap={1}>
                                                <Text color={textColor} fontSize="sm">{supplier.region?.name || '—'}</Text>
                                                {supplier.address && (
                                                    <HStack gap={1.5} align="start">
                                                        <Box color={subtitleColor} mt="3px"><LuMapPin size={13} /></Box>
                                                        <Text color={subtitleColor} fontSize="xs" noOfLines={2}>{supplier.address}</Text>
                                                    </HStack>
                                                )}
                                            </VStack>
                                        </Table.Cell>
                                        <Table.Cell {...cellBorder}>
                                            {supplier.inn ? (
                                                <HStack gap={1.5} color={textColor}><LuHash size={13} color={subtitleColor} /><Text fontFamily="mono" fontSize="sm">{supplier.inn}</Text></HStack>
                                            ) : <Text color={subtitleColor} fontSize="sm">—</Text>}
                                        </Table.Cell>
                                        <Table.Cell {...cellBorder}>{renderBalance(supplier.balance)}</Table.Cell>
                                        <Table.Cell {...cellBorder}>
                                            {supplier.summary ? (
                                                <HStack gap={1.5} align="start">
                                                    <Box color={subtitleColor} mt="3px"><LuStickyNote size={13} /></Box>
                                                    <Text color={subtitleColor} fontSize="sm" noOfLines={2} lineHeight="1.3">{supplier.summary}</Text>
                                                </HStack>
                                            ) : <Text color={subtitleColor} fontSize="sm">—</Text>}
                                        </Table.Cell>
                                        <Table.Cell {...cellBorder}>
                                            <HStack justify="center" gap={1}>
                                                <Button asChild size="sm" variant="outline" color={accentColor} borderRadius="lg" aria-label="Batafsil">
                                                    <RouterLink to={`/suppliers/${supplier.id}`}><LuExternalLink size={15} /> </RouterLink>
                                                </Button>
                                                {canManageSuppliers && (
                                                    <>
                                                        <Edit supplier={supplier} />
                                                        <Delete supplier={supplier} />
                                                    </>
                                                )}
                                            </HStack>
                                        </Table.Cell>
                                    </Table.Row>

                                ))}
                            </Table.Body>
                        </Table.Root>
                    </Box>
                    {totalPages > 1 && (
                        <HStack justify="center" mt={8} gap={3}>
                            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>
                                <LuChevronLeft />
                            </Button>
                            <Text color={subtitleColor} fontSize="sm">{page + 1} / {totalPages}</Text>
                            <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage((value) => value + 1)}>
                                <LuChevronRight />
                            </Button>
                        </HStack>
                    )}
                </>
            )}
        </Box>
    );
}
