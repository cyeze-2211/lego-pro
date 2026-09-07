import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Button, HStack, Heading, Table, Text } from '@chakra-ui/react';
import { LuChevronLeft, LuChevronRight, LuReceiptText, LuSearch, LuX } from 'react-icons/lu';
import { useGetExpensesQuery } from '../../../store/services/expense.api';
import { useGetCashboxesQuery } from '../../../store/services/cashbox.api';
import { BRAND_COLORS, useAppTheme } from '../../../theme/tokens';
import { Alert } from '../../Other/UI/Alert/Alert';
import Loading from '../../Other/UI/Loadings/Loading';
import EmptyData from '../../Other/UI/NoData/EmptyData';
import FormControl from '../../ui/FormControl';
import { formatNumber } from '../../ui/number-format';
import Create from './__components/Create';
import Edit from './__components/Edit';
import Delete from './__components/Delete';

const PAGE_SIZE = 20;

export default function Expense() {
    const [filters, setFilters] = useState({ cashboxId: '', dateFrom: '', dateTo: '' });
    const [applied, setApplied] = useState(filters);
    const [page, setPage] = useState(0);
    const { data: result, isLoading, error } = useGetExpensesQuery({ ...applied, page, size: PAGE_SIZE });
    const { data: cashboxes = [] } = useGetCashboxesQuery();
    const { isDark, pageBg, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();
    const expenses = result?.items || [];
    const totalPages = result?.pagination?.totalPages || 0;
    const tableBg = isDark ? BRAND_COLORS.darkCardBg : cardBg;
    const tableHeaderBg = isDark ? tableBg : '#F8FAFC';
    const tableBorder = isDark ? cardBorder : '#CBD5E1';

    useEffect(() => { if (error) Alert(error?.data?.message || 'Xarajatlarni yuklashda xatolik', 'error'); }, [error]);
    const applyFilters = (event) => { event.preventDefault(); setPage(0); setApplied(filters); };
    const clearFilters = () => { const empty = { cashboxId: '', dateFrom: '', dateTo: '' }; setFilters(empty); setApplied(empty); setPage(0); };
    const hasFilters = Object.values(filters).some(Boolean);

    return <Box my={2} bg={pageBg} color={textColor} minH="100%">
        <HStack justify="space-between" align="start" flexWrap="wrap" gap={4} mb={4}><Heading className="text-[35px] font-semibold" color={textColor}>Xarajatlar</Heading><Create cashboxes={cashboxes} /></HStack>
        <HStack as="form" onSubmit={applyFilters} align={{ base: 'stretch', lg: 'end' }} flexDirection={{ base: 'column', lg: 'row' }} gap={3} mb={4} p={3} bg={cardBg} borderWidth="1px" borderColor={cardBorder} borderRadius="xl">
            <Box flex="1" w="100%"><Text fontSize="sm" mb={1} color={subtitleColor}>Kassa</Text><FormControl as="select" value={filters.cashboxId} onChange={(e) => setFilters({ ...filters, cashboxId: e.target.value })}><option value="">Barcha kassalar</option>{cashboxes.map((cashbox) => <option key={cashbox.id} value={cashbox.id}>{cashbox.name}</option>)}</FormControl></Box>
            <Box w={{ base: '100%', lg: '180px' }}><Text fontSize="sm" mb={1} color={subtitleColor}>Dan</Text><FormControl type="date" value={filters.dateFrom} max={filters.dateTo || undefined} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} /></Box>
            <Box w={{ base: '100%', lg: '180px' }}><Text fontSize="sm" mb={1} color={subtitleColor}>Gacha</Text><FormControl type="date" value={filters.dateTo} min={filters.dateFrom || undefined} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} /></Box>
            <Button type="submit" bg={accentColor} color="black" borderRadius="xl" px={6}><HStack gap={2}><LuSearch size={18}/><span>Qidirish</span></HStack></Button>
            {hasFilters && <Button type="button" variant="ghost" onClick={clearFilters} color={subtitleColor} aria-label="Filtrlarni tozalash"><LuX size={18}/></Button>}
        </HStack>
        {isLoading ? <Loading /> : error ? <Box p={8} textAlign="center" color="red.500">Ma&apos;lumotlarni yuklashda xatolik</Box> : expenses.length === 0 ? <EmptyData text="Xarajatlar topilmadi" description="Yangi xarajat qo‘shib boshlang." action={<Create cashboxes={cashboxes} />} /> : <>
            <Box overflowX="auto" bg={tableBg} borderWidth="0.5px" borderColor={tableBorder} borderRadius="10px" boxShadow={isDark ? '0 16px 40px rgba(0, 0, 0, 0.22)' : '0 8px 24px rgba(15, 23, 42, 0.10)'}><Table.Root size="md" interactive bg={tableBg} borderCollapse="collapse"><Table.Header bg={tableHeaderBg}><Table.Row bg={tableHeaderBg}>{['№', 'Xarajat', 'Kassa', 'Sana', 'Summa', 'Amallar'].map((label) => <Table.ColumnHeader key={label} textAlign={label === '№' || label === 'Amallar' ? 'center' : undefined} bg={tableHeaderBg} borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor}>{label}</Table.ColumnHeader>)}</Table.Row></Table.Header><Table.Body bg={tableBg}>{expenses.map((expense, index) => <Table.Row key={expense.id} bg={tableBg} _hover={{ bg: isDark ? 'rgba(250, 204, 21, 0.06)' : '#FFFBEB' }}><Table.Cell textAlign="center" color={subtitleColor} borderWidth="0.5px" borderColor={tableBorder}>{page * PAGE_SIZE + index + 1}</Table.Cell><Table.Cell borderWidth="0.5px" borderColor={tableBorder}><HStack gap={3}><Box p={2} borderRadius="lg" bg={isDark ? 'rgba(250,204,21,.12)' : '#FEF3C7'} color={accentColor}><LuReceiptText size={18}/></Box><Box><Text as={Link} to={`/expenses/${expense.id}`} fontWeight="semibold" color={textColor} _hover={{ color: accentColor }}>{expense.name}</Text><Text fontSize="sm" color={subtitleColor}>{expense.summary || '—'}</Text></Box></HStack></Table.Cell><Table.Cell color={textColor} borderWidth="0.5px" borderColor={tableBorder}>{expense.cashboxName}</Table.Cell><Table.Cell color={subtitleColor} borderWidth="0.5px" borderColor={tableBorder}>{expense.expenseDate}</Table.Cell><Table.Cell borderWidth="0.5px" borderColor={tableBorder}><Text fontWeight="bold" color={isDark ? 'red.300' : 'red.600'}>-{formatNumber(expense.amount)} so‘m</Text></Table.Cell><Table.Cell borderWidth="0.5px" borderColor={tableBorder}><HStack justify="center" gap={1}><Edit expense={expense}/><Delete expense={expense}/></HStack></Table.Cell></Table.Row>)}</Table.Body></Table.Root></Box>
            {totalPages > 1 && <HStack justify="center" mt={8} gap={3}><Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}><LuChevronLeft/></Button><Text color={subtitleColor} fontSize="sm">{page + 1} / {totalPages}</Text><Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}><LuChevronRight/></Button></HStack>}
        </>}
    </Box>;
}
