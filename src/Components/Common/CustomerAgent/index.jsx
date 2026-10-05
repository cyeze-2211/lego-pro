import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Box,
    Button,
    HStack,
    Heading,
    Spinner,
    Table,
    Text,
    VStack,
} from '@chakra-ui/react';
import {
    LuChevronLeft,
    LuChevronRight,
    LuPhone,
    LuSearch,
    LuX,
    LuCalendar,
    LuUserCheck,
    LuSend,
} from 'react-icons/lu';
import { useGetCustomerAgentsQuery } from '../../../store/services/customerAgent.api';
import { BRAND_COLORS, useAppTheme } from '../../../theme/tokens';
import { Alert } from '../../Other/UI/Alert/Alert';
import Create from './__components/Create';
import Edit from './__components/Edit';
import Delete from './__components/Delete';
import Loading from '../../Other/UI/Loadings/Loading';
import EmptyData from '../../Other/UI/NoData/EmptyData';
import FormControl from '../../ui/FormControl';

const PAGE_SIZE = 20;
const DEBOUNCE_MS = 400;

const formatDate = (value) => {
    if (!value) return '—';
    try {
        const d = new Date(value);
        return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
    } catch {
        return value;
    }
};

export default function CustomerAgent() {
    const [nameSearch,  setNameSearch]  = useState('');
    const [phoneSearch, setPhoneSearch] = useState('');
    const [nameQuery,   setNameQuery]   = useState('');
    const [phoneQuery,  setPhoneQuery]  = useState('');
    const [page, setPage] = useState(0);
    const isFirst = useRef(true);

    const { isDark, pageBg, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();

    // Debounce name
    useEffect(() => {
        if (isFirst.current) { isFirst.current = false; return; }
        const t = setTimeout(() => { setNameQuery(nameSearch.trim()); setPage(0); }, DEBOUNCE_MS);
        return () => clearTimeout(t);
    }, [nameSearch]);

    // Debounce phone
    useEffect(() => {
        const t = setTimeout(() => { setPhoneQuery(phoneSearch.trim()); setPage(0); }, DEBOUNCE_MS);
        return () => clearTimeout(t);
    }, [phoneSearch]);

    const { data, isLoading, error } = useGetCustomerAgentsQuery({
        name:  nameQuery  || undefined,
        phone: phoneQuery || undefined,
        page,
        size: PAGE_SIZE,
    });

    const agents     = data?.items      ?? [];
    const pagination = data?.pagination ?? {};
    const totalPages = pagination.totalPages ?? 0;

    const tableBg       = isDark ? BRAND_COLORS.darkCardBg : cardBg;
    const tableHeaderBg = isDark ? tableBg : '#F8FAFC';
    const tableBorder   = isDark ? cardBorder : '#CBD5E1';

    const cellBorder = {
        borderWidth: '0.5px', borderColor: tableBorder,
        verticalAlign: 'middle', px: 3, py: 2.5,
    };
    const headerCell = {
        ...cellBorder,
        bg: tableHeaderBg, color: subtitleColor,
        fontSize: '11px', fontWeight: 'semibold',
        textTransform: 'uppercase', letterSpacing: 'wider',
    };

    useEffect(() => {
        if (error) Alert(error?.data?.message || 'Agentlarni yuklashda xatolik', 'error');
    }, [error]);

    return (
        <Box my={2} bg={pageBg} color={textColor} minH="100%">

            {/* Header */}
            <HStack justify="space-between" align="start" flexWrap="wrap" gap={4} mb={4}>
                <Box>
                    <Heading className="text-[35px] font-semibold" color={textColor}>
                        Mijoz Agentlari
                    </Heading>
                    <Text color={subtitleColor} fontSize="sm" mt={1}>
                        Jami: {pagination.totalElements ?? 0} ta agent
                    </Text>
                </Box>
                <Create />
            </HStack>

            {/* Filters */}
            <HStack
                w="100%"
                gap={3}
                mb={4}
                p={3}
                bg={cardBg}
                borderWidth="1px"
                borderColor={cardBorder}
                borderRadius="xl"
                flexWrap="wrap"
                boxShadow={isDark ? 'none' : '0 6px 18px rgba(15,23,42,0.06)'}
            >
                {/* Ism bo'yicha */}
                <Box position="relative" flex="1" minW="200px">
                    <Box position="absolute" left={4} top="50%" transform="translateY(-50%)"
                        color={accentColor} zIndex={1} pointerEvents="none">
                        <LuSearch size={16} />
                    </Box>
                    <FormControl
                        value={nameSearch}
                        onChange={(e) => setNameSearch(e.target.value)}
                        placeholder="Ism bo'yicha qidiring..."
                        pl={10} pr={nameSearch ? 9 : 4} minH="40px"
                    />
                    {nameSearch && (
                        <Button type="button" variant="ghost" size="sm"
                            position="absolute" right={2} top="50%" transform="translateY(-50%)"
                            color={subtitleColor} minW="28px" h="28px" p={0} borderRadius="full"
                            onClick={() => setNameSearch('')}
                            _hover={{ bg: isDark ? 'whiteAlpha.100' : 'gray.100' }}>
                            <LuX size={14} />
                        </Button>
                    )}
                </Box>

                {/* Telefon bo'yicha */}
                <Box position="relative" flex="1" minW="200px">
                    <Box position="absolute" left={4} top="50%" transform="translateY(-50%)"
                        color={accentColor} zIndex={1} pointerEvents="none">
                        <LuPhone size={16} />
                    </Box>
                    <FormControl
                        value={phoneSearch}
                        onChange={(e) => setPhoneSearch(e.target.value)}
                        placeholder="Telefon raqami..."
                        pl={10} pr={phoneSearch ? 9 : 4} minH="40px"
                    />
                    {phoneSearch && (
                        <Button type="button" variant="ghost" size="sm"
                            position="absolute" right={2} top="50%" transform="translateY(-50%)"
                            color={subtitleColor} minW="28px" h="28px" p={0} borderRadius="full"
                            onClick={() => setPhoneSearch('')}
                            _hover={{ bg: isDark ? 'whiteAlpha.100' : 'gray.100' }}>
                            <LuX size={14} />
                        </Button>
                    )}
                </Box>

                {/* Loading indicator */}
                {isLoading && <Spinner size="sm" color={accentColor} />}
            </HStack>

            {/* Content */}
            {isLoading ? (
                <Loading />
            ) : error ? (
                <Box p={8} textAlign="center" color={isDark ? 'red.300' : 'red.600'}>
                    Ma&apos;lumotlarni yuklashda xatolik
                </Box>
            ) : agents.length === 0 ? (
                <EmptyData
                    text={(nameQuery || phoneQuery) ? 'Qidiruv bo\'yicha agent topilmadi' : 'Hozircha agentlar yo\'q'}
                    description="Yangi agent qo'shib ma'lumotnomani to'ldiring."
                    action={<Create />}
                />
            ) : (
                <>
                    <Box
                        overflowX="auto"
                        bg={tableBg}
                        borderWidth="0.5px"
                        borderColor={tableBorder}
                        borderRadius="10px"
                        boxShadow={isDark ? '0 16px 40px rgba(0,0,0,0.22)' : '0 8px 24px rgba(15,23,42,0.10)'}
                    >
                        <Table.Root size="sm" interactive bg={tableBg} borderCollapse="collapse" minW="800px">
                            <Table.Header bg={tableHeaderBg}>
                                <Table.Row bg={tableHeaderBg}>
                                    <Table.ColumnHeader {...headerCell} textAlign="center" w="50px">№</Table.ColumnHeader>
                                    <Table.ColumnHeader {...headerCell} minW="200px">Agent</Table.ColumnHeader>
                                    <Table.ColumnHeader {...headerCell} minW="160px">Telefon</Table.ColumnHeader>
                                    <Table.ColumnHeader {...headerCell} minW="150px">Telegram ID</Table.ColumnHeader>
                                    <Table.ColumnHeader {...headerCell} minW="120px">Yaratilgan</Table.ColumnHeader>
                                    <Table.ColumnHeader {...headerCell} textAlign="center" w="100px">Amal</Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body bg={tableBg}>
                                {agents.map((agent, index) => (
                                    <Table.Row
                                        key={agent.id}
                                        bg={tableBg}
                                        _hover={{ bg: isDark ? 'rgba(250,204,21,0.06)' : '#FFFBEB' }}
                                        transition="background 0.15s"
                                    >
                                        <Table.Cell {...cellBorder} textAlign="center" color={subtitleColor} fontSize="sm">
                                            {page * PAGE_SIZE + index + 1}
                                        </Table.Cell>

                                        {/* Agent nomi */}
                                        <Table.Cell {...cellBorder}>
                                            <HStack gap={2.5}>
                                                <Box
                                                    p={1.5} borderRadius="md" flexShrink={0}
                                                    bg={isDark ? 'rgba(250,204,21,0.12)' : '#FEF3C7'}
                                                    color={accentColor}
                                                    display="inline-flex" alignItems="center" justifyContent="center"
                                                >
                                                    <LuUserCheck size={14} />
                                                </Box>
                                                <Text
                                                    as={Link}
                                                    to={`/customer-agents/${agent.id}`}
                                                    fontWeight="semibold"
                                                    fontSize="sm"
                                                    color={textColor}
                                                    _hover={{ color: accentColor }}
                                                    noOfLines={1}
                                                >
                                                    {agent.name}
                                                </Text>
                                            </HStack>
                                        </Table.Cell>

                                        {/* Telefon */}
                                        <Table.Cell {...cellBorder}>
                                            <HStack gap={1.5} color={textColor} fontSize="sm">
                                                <LuPhone size={13} color={subtitleColor} />
                                                <span>{agent.phone || '—'}</span>
                                            </HStack>
                                        </Table.Cell>

                                        {/* Telegram ID */}
                                        <Table.Cell {...cellBorder}>
                                            {agent.telegramId ? (
                                                <HStack gap={1.5}>
                                                    <Box
                                                        p={1} borderRadius="md" flexShrink={0}
                                                        bg={isDark ? 'rgba(56,189,248,0.15)' : '#E0F2FE'}
                                                        color={isDark ? 'sky.300' : 'sky.600'}
                                                        display="inline-flex" alignItems="center" justifyContent="center"
                                                    >
                                                        <LuSend size={12} />
                                                    </Box>
                                                    <Text fontFamily="mono" fontSize="sm" color={textColor}>
                                                        {agent.telegramId}
                                                    </Text>
                                                </HStack>
                                            ) : (
                                                <Text color={subtitleColor} fontSize="sm">—</Text>
                                            )}
                                        </Table.Cell>

                                        {/* Sana */}
                                        <Table.Cell {...cellBorder}>
                                            <HStack gap={1.5} color={subtitleColor} fontSize="sm">
                                                <LuCalendar size={13} />
                                                <span>{formatDate(agent.createdAt)}</span>
                                            </HStack>
                                        </Table.Cell>

                                        {/* Amallar */}
                                        <Table.Cell {...cellBorder} textAlign="center">
                                            <HStack justify="center" gap={1}>
                                                <Edit agent={agent} />
                                                <Delete agent={agent} />
                                            </HStack>
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table.Root>
                    </Box>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <HStack justify="center" mt={6} gap={3}>
                            <Button size="sm" variant="outline" borderRadius="lg"
                                disabled={page === 0}
                                onClick={() => setPage((v) => v - 1)}>
                                <LuChevronLeft size={14} />
                            </Button>
                            <Text color={subtitleColor} fontSize="sm" fontWeight="medium">
                                {page + 1} / {totalPages}
                            </Text>
                            <Button size="sm" variant="outline" borderRadius="lg"
                                disabled={page >= totalPages - 1}
                                onClick={() => setPage((v) => v + 1)}>
                                <LuChevronRight size={14} />
                            </Button>
                        </HStack>
                    )}
                </>
            )}
        </Box>
    );
}
