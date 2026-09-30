import { useEffect, useState } from 'react';
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
    LuSearch,
    LuTag,
    LuX,
    LuImage,
    LuCalendar,
} from 'react-icons/lu';
import { useGetBrandsQuery } from '../../../store/services/brand.api';
import { BRAND_COLORS, useAppTheme } from '../../../theme/tokens';
import { Alert } from '../../Other/UI/Alert/Alert';
import Create from './__components/Create';
import Loading from '../../Other/UI/Loadings/Loading';
import EmptyData from '../../Other/UI/NoData/EmptyData';
import FormControl from '../../ui/FormControl';
import Delete from './__components/Delete';
import Edit from './__components/Edit';
import $api from '../../../store/api';

const PAGE_SIZE = 12;

const formatDate = (value) => {
    if (!value) return '—';
    try {
        const date = new Date(value);
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = date.getFullYear();
        const hh = String(date.getHours()).padStart(2, '0');
        const mm = String(date.getMinutes()).padStart(2, '0');
        return `${d}.${m}.${y} ${hh}:${mm}`;
    } catch {
        return value;
    }
};

// ── Logo thumbnail ────────────────────────────────────────────────────────
function BrandLogo({ brand, isDark, size = 44 }) {
    const [imgSrc, setImgSrc] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!brand.logoUrl) {
            setImgSrc(null);
            return;
        }

        let mounted = true;
        setLoading(true);
        setError(false);

        // Axios bilan blob yuklab olish (token bilan)
        $api.get(brand.logoUrl.replace('/api/v1', ''), { responseType: 'blob' })
            .then((response) => {
                if (mounted) {
                    const url = URL.createObjectURL(response.data);
                    setImgSrc(url);
                    setLoading(false);
                }
            })
            .catch((err) => {
                if (mounted) {
                    console.error('Logo load error:', err);
                    setError(true);
                    setLoading(false);
                }
            });

        return () => {
            mounted = false;
            if (imgSrc) URL.revokeObjectURL(imgSrc);
        };
    }, [brand.logoUrl, brand.id]);

    const boxProps = {
        w: `${size}px`,
        h: `${size}px`,
        minW: `${size}px`,
        borderRadius: 'lg',
        borderWidth: '1px',
        borderColor: isDark ? 'whiteAlpha.200' : 'gray.200',
        bg: isDark ? 'rgba(148,163,184,0.06)' : 'gray.50',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0,
    };

    if (!brand.logoUrl || error) {
        return (
            <Box {...boxProps} color={isDark ? 'whiteAlpha.500' : 'gray.400'}>
                <LuImage size={18} />
            </Box>
        );
    }

    if (loading) {
        return (
            <Box {...boxProps} color={isDark ? 'whiteAlpha.500' : 'gray.400'}>
                <div className="animate-spin">⏳</div>
            </Box>
        );
    }

    return (
        <Box {...boxProps} bg="white" p={0.5}>
            {imgSrc ? (
                <img
                    src={imgSrc}
                    alt={brand.name}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                    }}
                />
            ) : (
                <Box color={isDark ? 'whiteAlpha.500' : 'gray.400'}>
                    <LuImage size={18} />
                </Box>
            )}
        </Box>
    );
}

export default function Brand() {
    const [search, setSearch] = useState('');
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(0);

    const { data, isLoading, error, refetch } = useGetBrandsQuery({
        name: query || undefined,
        page,
        size: PAGE_SIZE,
    });

    const { isDark, pageBg, cardBg, cardBorder, textColor, subtitleColor, accentColor } =
        useAppTheme();

    const brands = data?.items ?? [];
    const pagination = data?.pagination;
    const totalPages = pagination?.totalPages ?? 0;
    const totalElements = pagination?.totalElements ?? 0;

    const tableBg = isDark ? BRAND_COLORS.darkCardBg : cardBg;
    const tableHeaderBg = isDark ? tableBg : '#F8FAFC';
    const tableBorder = isDark ? cardBorder : '#CBD5E1';

    const cellBorder = {
        borderWidth: '0.5px',
        borderColor: tableBorder,
        verticalAlign: 'middle',
        px: 3,
        py: 2.5,
    };
    const headerCell = {
        ...cellBorder,
        bg: tableHeaderBg,
        color: subtitleColor,
        fontSize: '11px',
        fontWeight: 'semibold',
        textTransform: 'uppercase',
        letterSpacing: 'wider',
    };

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
        if (error) {
            Alert(error?.data?.message || 'Brendlarni yuklashda xatolik', 'error');
        }
    }, [error]);

    return (
        <Box my={2} bg={pageBg} color={textColor} minH="100%">
            {/* ── Header ── */}
            <HStack justify="space-between" align="start" flexWrap="wrap" gap={4} mb={4}>
                <Box>
                    <Heading className="text-[35px] font-semibold" color={textColor}>
                        Brendlar
                    </Heading>
                    <Text color={subtitleColor} fontSize="sm" mt={1}>
                        Jami: {totalElements} ta brend
                    </Text>
                </Box>
                <Create onCreated={refetch} />
            </HStack>

            {/* ── Search ── */}
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
                    <Box
                        position="absolute"
                        left={4}
                        top="50%"
                        transform="translateY(-50%)"
                        color={accentColor}
                        zIndex={1}
                        pointerEvents="none"
                    >
                        <LuSearch size={18} />
                    </Box>
                    <FormControl
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Brend nomi bo‘yicha qidiring..."
                        aria-label="Brend qidirish"
                        pl={11}
                        pr={search ? 11 : 4}
                        minH="40px"
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
                            _hover={{
                                bg: isDark ? 'whiteAlpha.100' : 'gray.100',
                                color: textColor,
                            }}
                        >
                            <LuX size={16} />
                        </Button>
                    )}
                </Box>
                <Button
                    type="submit"
                    bg={accentColor}
                    color="black"
                    borderRadius="xl"
                    minH="40px"
                    px={6}
                    flexShrink={0}
                    _hover={{ bg: 'yellow.500', transform: 'translateY(-1px)' }}
                >
                    <HStack gap={2}>
                        <LuSearch size={18} />
                        <span>Qidirish</span>
                    </HStack>
                </Button>
            </HStack>

            {/* ── Content ── */}
            {isLoading ? (
                <Loading />
            ) : error ? (
                <Box p={8} textAlign="center" color={isDark ? 'red.300' : 'red.600'}>
                    Ma&apos;lumotlarni yuklashda xatolik
                </Box>
            ) : brands.length === 0 ? (
                <EmptyData
                    text={query ? 'Qidiruv bo‘yicha brend topilmadi' : 'Hozircha brendlar yo‘q'}
                    description="Yangi brend qo‘shib katalogni to‘ldiring."
                    action={<Create onCreated={refetch} />}
                />
            ) : (
                <>
                    <Box
                        overflowX="auto"
                        bg={tableBg}
                        borderWidth="0.5px"
                        borderColor={tableBorder}
                        borderRadius="10px"
                        boxShadow={
                            isDark
                                ? '0 16px 40px rgba(0, 0, 0, 0.22)'
                                : '0 8px 24px rgba(15, 23, 42, 0.10)'
                        }
                    >
                        <Table.Root
                            size="sm"
                            interactive
                            bg={tableBg}
                            borderCollapse="collapse"
                            minW="720px"
                        >
                            <Table.Header bg={tableHeaderBg}>
                                <Table.Row bg={tableHeaderBg}>
                                    <Table.ColumnHeader {...headerCell} textAlign="center" w="50px">
                                        №
                                    </Table.ColumnHeader>
                                    <Table.ColumnHeader {...headerCell} w="70px" textAlign="center">
                                        Logo
                                    </Table.ColumnHeader>
                                    <Table.ColumnHeader {...headerCell} minW="220px">
                                        Brend nomi
                                    </Table.ColumnHeader>
                                    <Table.ColumnHeader {...headerCell} minW="180px">
                                        Yaratilgan
                                    </Table.ColumnHeader>
                                   
                                    <Table.ColumnHeader {...headerCell} textAlign="center" w="100px">
                                        Amal
                                    </Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body bg={tableBg}>
                                {brands.map((brand, index) => (
                                    <Table.Row
                                        key={brand.id}
                                        bg={tableBg}
                                        _hover={{
                                            bg: isDark ? 'rgba(250, 204, 21, 0.06)' : '#FFFBEB',
                                        }}
                                        transition="background 0.15s"
                                    >
                                        <Table.Cell
                                            {...cellBorder}
                                            textAlign="center"
                                            color={subtitleColor}
                                            fontSize="sm"
                                        >
                                            {page * PAGE_SIZE + index + 1}
                                        </Table.Cell>

                                        {/* Logo */}
                                        <Table.Cell {...cellBorder}>
                                            <Box display="flex" justifyContent="center">
                                                <BrandLogo brand={brand} isDark={isDark} />
                                            </Box>
                                        </Table.Cell>

                                        {/* Nom */}
                                        <Table.Cell {...cellBorder}>
                                            <HStack gap={2.5}>
                                                <Box
                                                    p={1.5}
                                                    borderRadius="md"
                                                    bg={
                                                        isDark
                                                            ? 'rgba(250, 204, 21, 0.10)'
                                                            : '#FEF3C7'
                                                    }
                                                    color={accentColor}
                                                    flexShrink={0}
                                                    display="inline-flex"
                                                    alignItems="center"
                                                    justifyContent="center"
                                                >
                                                    <LuTag size={14} />
                                                </Box>
                                                <VStack align="start" gap={0} lineHeight="1.2" minW={0}>
                                                    <Text
                                                        fontWeight="semibold"
                                                        fontSize="sm"
                                                        color={textColor}
                                                        noOfLines={1}
                                                    >
                                                        {brand.name}
                                                    </Text>
                                            
                                                </VStack>
                                            </HStack>
                                        </Table.Cell>

                                        {/* Yaratilgan */}
                                        <Table.Cell {...cellBorder}>
                                            <HStack gap={1.5} color={subtitleColor}>
                                                <LuCalendar size={13} />
                                                <Text fontSize="sm" whiteSpace="nowrap">
                                                    {formatDate(brand.createdAt)}
                                                </Text>
                                            </HStack>
                                        </Table.Cell>

                             

                                        {/* Amallar */}
                                        <Table.Cell {...cellBorder} textAlign="center">
                                            <HStack justify="center" gap={1}>
                                                <Edit brand={brand} />
                                                <Delete brand={brand} />
                                            </HStack>
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table.Root>
                    </Box>

                    {/* ── Pagination ── */}
                    {totalPages > 1 && (
                        <HStack justify="center" mt={6} gap={3}>
                            <Button
                                size="sm"
                                variant="outline"
                                borderRadius="lg"
                                disabled={page === 0}
                                onClick={() => setPage((v) => v - 1)}
                            >
                                <LuChevronLeft size={14} />
                            </Button>
                            <Text color={subtitleColor} fontSize="sm" fontWeight="medium">
                                {page + 1} / {totalPages}
                            </Text>
                            <Button
                                size="sm"
                                variant="outline"
                                borderRadius="lg"
                                disabled={page >= totalPages - 1}
                                onClick={() => setPage((v) => v + 1)}
                            >
                                <LuChevronRight size={14} />
                            </Button>
                        </HStack>
                    )}
                </>
            )}
        </Box>
    );
}