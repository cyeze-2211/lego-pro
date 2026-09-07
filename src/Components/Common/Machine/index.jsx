import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Badge,
    Box,
    Button,
    HStack,
    Heading,
    Table,
    Text,
} from '@chakra-ui/react';
import { LuChevronLeft, LuChevronRight, LuCog, LuSearch, LuX } from 'react-icons/lu';
import { useGetMachinesQuery } from '../../../store/services/machine.api';
import { BRAND_COLORS, useAppTheme } from '../../../theme/tokens';
import { Alert } from '../../Other/UI/Alert/Alert';
import Create from './__components/Create';
import Edit from './__components/Edit';
import Delete from './__components/Delete';
import Loading from '../../Other/UI/Loadings/Loading';
import EmptyData from '../../Other/UI/NoData/EmptyData';
import FormControl from '../../ui/FormControl';

const PAGE_SIZE = 12;

const formatStartedAt = (iso) => {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function Machine() {
    const [search, setSearch] = useState('');
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(0);
    const { data: machineResult, isLoading, error } = useGetMachinesQuery({ name: query || undefined, page, size: PAGE_SIZE });
    const { isDark, pageBg, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();
    const machines = machineResult?.items || [];
    const pagination = machineResult?.pagination;
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
        if (error) Alert(error?.data?.message || 'Stanoklarni yuklashda xatolik', 'error');
    }, [error]);

    const renderStatus = (machine) => (
        machine.isWorking && machine.currentRun ? (
            <Badge variant="subtle" borderRadius="full" px={3} py={1} bg={isDark ? 'rgba(34, 197, 94, 0.12)' : '#DCFCE7'} color={isDark ? 'green.300' : '#166534'} whiteSpace="nowrap" title={`Boshlangan: ${formatStartedAt(machine.currentRun.startedAt)}`}>
                Ishlayapti: {machine.currentRun.productName}
            </Badge>
        ) : (
            <Badge variant="subtle" borderRadius="full" px={3} py={1} bg={isDark ? 'rgba(148, 163, 184, 0.15)' : '#F1F5F9'} color={subtitleColor} whiteSpace="nowrap">
                Bo‘sh
            </Badge>
        )
    );

    return (
        <Box my={2} bg={pageBg} color={textColor} minH="100%">
            <HStack justify="space-between" align="start" flexWrap="wrap" gap={4} mb={4}>
                <Box>
                    <Heading className="text-[35px] font-semibold" color={textColor}>Stanoklar</Heading>
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
                        placeholder="Stanok nomi bo‘yicha qidiring..."
                        aria-label="Stanok qidirish"
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
            ) : machines.length === 0 ? (
                <EmptyData
                    text={query ? 'Qidiruv bo‘yicha stanok topilmadi' : 'Hozircha stanoklar yo‘q'}
                    description="Yangi stanok qo‘shib ishlab chiqarishni boshlang."
                    action={<Create />}
                />
            ) : (
                <>
                    <Box overflowX="auto" bg={tableBg} borderWidth="0.5px" borderColor={tableBorder} borderRadius="10px" boxShadow={isDark ? '0 16px 40px rgba(0, 0, 0, 0.22)' : '0 8px 24px rgba(15, 23, 42, 0.10)'}>
                        <Table.Root size="md" interactive bg={tableBg} borderCollapse="collapse">
                            <Table.Header bg={tableHeaderBg}>
                                <Table.Row bg={tableHeaderBg}>
                                    <Table.ColumnHeader textAlign="center" bg={tableHeaderBg} borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor} w="60px">№</Table.ColumnHeader>
                                    <Table.ColumnHeader bg={tableHeaderBg} borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor}>Stanok nomi</Table.ColumnHeader>
                                    <Table.ColumnHeader bg={tableHeaderBg} borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor}>Izoh</Table.ColumnHeader>
                                    <Table.ColumnHeader bg={tableHeaderBg} borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor}>Holati</Table.ColumnHeader>
                                    <Table.ColumnHeader textAlign="center" bg={tableHeaderBg} borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor}>Amallar</Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body bg={tableBg}>
                                {machines.map((machine, index) => (
                                    <Table.Row key={machine.id} bg={tableBg} _hover={{ bg: isDark ? 'rgba(250, 204, 21, 0.06)' : '#FFFBEB' }}>
                                        <Table.Cell borderWidth="0.5px" borderColor={tableBorder} textAlign="center" color={subtitleColor}>{page * PAGE_SIZE + index + 1}</Table.Cell>
                                        <Table.Cell borderWidth="0.5px" borderColor={tableBorder}>
                                            <HStack gap={3}>
                                                <Box p={2} borderRadius="lg" bg={isDark ? 'rgba(250, 204, 21, 0.12)' : '#FEF3C7'} color={accentColor}><LuCog size={18} /></Box>
                                                <Text as={Link} to={`/machines/${machine.id}`} fontWeight="semibold" color={textColor} _hover={{ color: accentColor }}>{machine.name}</Text>
                                            </HStack>
                                        </Table.Cell>
                                        <Table.Cell borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor} maxW="320px">{machine.summary || '—'}</Table.Cell>
                                        <Table.Cell borderWidth="0.5px" borderColor={tableBorder}>{renderStatus(machine)}</Table.Cell>
                                        <Table.Cell borderWidth="0.5px" borderColor={tableBorder}>
                                            <HStack justify="center" gap={1}><Edit machine={machine} /><Delete machine={machine} /></HStack>
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
