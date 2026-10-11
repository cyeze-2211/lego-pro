import { useEffect, useState } from 'react';
import {
    Box,
    Button,
    HStack,
    Heading,
    Table,
    Text,
} from '@chakra-ui/react';
import { LuLayoutGrid, LuList, LuSearch, LuX } from 'react-icons/lu';
import { useGetProductColorsQuery } from '../../../store/services/productColor.api';
import { BRAND_COLORS, useAppTheme } from '../../../theme/tokens';
import { Alert } from '../../Other/UI/Alert/Alert';
import Loading from '../../Other/UI/Loadings/Loading';
import EmptyData from '../../Other/UI/NoData/EmptyData';
import FormControl from '../../ui/FormControl';
import Create from './__components/Create';
import Edit from './__components/Edit';
import Delete from './__components/Delete';
import ColorSwatch, { ColorDot } from '../../ui/ColorSwatch';
import { isValidHex } from '../../ui/color-utils';
import { formatDateTime } from '../../ui/date-format';
import { useInfiniteList } from '../../ui/useInfiniteList';
import InfiniteSentinel from '../../ui/InfiniteSentinel';

const PAGE_SIZE = 20;

export default function ProductColor() {
    const [search, setSearch] = useState('');
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(0);
    const [view, setView] = useState('table');
    const { data: result, isLoading, isFetching, error } = useGetProductColorsQuery({
        name: query || undefined,
        page,
        size: PAGE_SIZE,
    });
    const { isDark, pageBg, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();

    const { items: colors, hasMore, sentinelRef, loadingMore, loadMore } = useInfiniteList({
        items: result?.items,
        pagination: result?.pagination,
        page,
        setPage,
        isFetching,
        resetKey: JSON.stringify({ name: query || undefined }),
    });
    const totalElements = result?.pagination?.totalElements ?? 0;
    const withCode = colors.filter((c) => isValidHex(c.code)).length;
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
        if (error) Alert(error?.data?.message || 'Ranglarni yuklashda xatolik', 'error');
    }, [error]);

    return (
        <Box my={2} bg={pageBg} color={textColor} minH="100%">
            <HStack justify="space-between" align="start" flexWrap="wrap" gap={4} mb={4}>
                <Box>
                    <Heading className="text-[35px] font-semibold" color={textColor}>Mahsulot ranglari</Heading>
                    <Text color={subtitleColor} fontSize="sm" mt={1}>Jami: {totalElements} ta rang · shu sahifada {withCode} tasida kod bor</Text>
                </Box>
                <HStack gap={2}>
                    <HStack gap={0} p={1} bg={isDark ? 'whiteAlpha.100' : 'gray.100'} borderRadius="xl">
                        {[{ key: 'palette', Icon: LuLayoutGrid, label: 'Palitra' }, { key: 'table', Icon: LuList, label: 'Jadval' }].map(({ key, Icon, label }) => (
                            <Button key={key} size="sm" h="34px" px={3} borderRadius="lg" variant="ghost" onClick={() => setView(key)} bg={view === key ? cardBg : 'transparent'} color={view === key ? accentColor : subtitleColor} boxShadow={view === key && !isDark ? '0 1px 3px rgba(15,23,42,.08)' : 'none'}>
                                <HStack gap={1.5}><Icon size={14} /><span>{label}</span></HStack>
                            </Button>
                        ))}
                    </HStack>
                    <Create />
                </HStack>
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
                        placeholder="Rang nomi bo‘yicha qidiring..."
                        aria-label="Rang qidirish"
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

            {(isLoading || (isFetching && colors.length === 0)) ? (
                <Loading />
            ) : error ? (
                <Box p={8} textAlign="center" color={isDark ? 'red.300' : 'red.600'}>
                    Ranglarni yuklashda xatolik
                </Box>
            ) : colors.length === 0 ? (
                <EmptyData
                    text={query ? 'Qidiruv bo‘yicha rang topilmadi' : 'Hozircha ranglar yo‘q'}
                    description={query ? 'Boshqa rang nomi bilan qidirib ko‘ring.' : 'Yangi rang qo‘shib boshlang.'}
                    action={!query && <Create />}
                />
            ) : view === 'palette' ? (
                <>
                    <Box display="grid" gridTemplateColumns={{ base: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))', xl: 'repeat(6, minmax(0, 1fr))' }} gap={3}>
                        {colors.map((color) => (
                            <Box key={color.id} bg={cardBg} borderWidth="1px" borderColor={cardBorder} borderRadius="2xl" overflow="hidden" boxShadow={isDark ? '0 12px 30px rgba(0,0,0,.16)' : '0 8px 22px rgba(15,23,42,.06)'} transition="transform .15s" _hover={{ transform: 'translateY(-2px)' }}>
                                <Box h="84px" bg={isValidHex(color.code) ? color.code : (isDark ? 'whiteAlpha.100' : 'gray.100')} position="relative" display="flex" alignItems="center" justifyContent="center">
                                    {!isValidHex(color.code) && <ColorDot code="" size={36} />}
                                </Box>
                                <Box p={3}>
                                    <Text fontWeight="semibold" color={textColor} noOfLines={1}>{color.name}</Text>
                                    <HStack justify="space-between" mt={1}>
                                        <Text fontSize="xs" color={subtitleColor} fontFamily="mono">{isValidHex(color.code) ? color.code.toUpperCase() : 'Kod yo‘q'}</Text>
                                        <HStack gap={0}><Edit color={color} /><Delete color={color} /></HStack>
                                    </HStack>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                    <InfiniteSentinel sentinelRef={sentinelRef} hasMore={hasMore} loadingMore={loadingMore} loaded={colors.length} total={result?.pagination?.totalElements ?? colors.length} unit="ta rang" onLoadMore={loadMore} />
                </>
            ) : (
                <>
                    <Box overflowX="auto" bg={tableBg} borderWidth="0.5px" borderColor={tableBorder} borderRadius="10px" boxShadow={isDark ? '0 16px 40px rgba(0, 0, 0, 0.22)' : '0 8px 24px rgba(15, 23, 42, 0.10)'}>
                        <Table.Root size="md" interactive bg={tableBg} borderCollapse="collapse">
                            <Table.Header bg={tableHeaderBg}>
                                <Table.Row bg={tableHeaderBg}>
                                    {['№', 'Rang', 'HEX kodi', 'Yaratilgan sana', 'Yangilangan sana', 'Amallar'].map((label) => (
                                        <Table.ColumnHeader
                                            key={label}
                                            textAlign={label === '№' || label === 'Amallar' ? 'center' : undefined}
                                            bg={tableHeaderBg}
                                            borderWidth="0.5px"
                                            borderColor={tableBorder}
                                            color={subtitleColor}
                                        >
                                            {label}
                                        </Table.ColumnHeader>
                                    ))}
                                </Table.Row>
                            </Table.Header>
                            <Table.Body bg={tableBg}>
                                {colors.map((color, index) => (
                                    <Table.Row key={color.id} bg={tableBg} _hover={{ bg: isDark ? 'rgba(250, 204, 21, 0.06)' : '#FFFBEB' }}>
                                        <Table.Cell textAlign="center" color={subtitleColor} borderWidth="0.5px" borderColor={tableBorder}>
                                            {index + 1}
                                        </Table.Cell>
                                        <Table.Cell borderWidth="0.5px" borderColor={tableBorder}>
                                            <ColorSwatch code={color.code} name={color.name} size={26} fontSize="md" />
                                        </Table.Cell>
                                        <Table.Cell borderWidth="0.5px" borderColor={tableBorder}>
                                            <Text fontFamily="mono" fontSize="sm" color={isValidHex(color.code) ? textColor : subtitleColor}>{isValidHex(color.code) ? color.code.toUpperCase() : 'Kod yo‘q'}</Text>
                                        </Table.Cell>
                                        <Table.Cell color={subtitleColor} borderWidth="0.5px" borderColor={tableBorder}>{formatDateTime(color.createdAt)}</Table.Cell>
                                        <Table.Cell color={subtitleColor} borderWidth="0.5px" borderColor={tableBorder}>{formatDateTime(color.lastModifiedAt)}</Table.Cell>
                                        <Table.Cell borderWidth="0.5px" borderColor={tableBorder}>
                                            <HStack justify="center" gap={1}>
                                                <Edit color={color} />
                                                <Delete color={color} />
                                            </HStack>
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table.Root>
                    </Box>
                    <InfiniteSentinel sentinelRef={sentinelRef} hasMore={hasMore} loadingMore={loadingMore} loaded={colors.length} total={result?.pagination?.totalElements ?? colors.length} unit="ta rang" onLoadMore={loadMore} />
                </>
            )}
        </Box>
    );
}
