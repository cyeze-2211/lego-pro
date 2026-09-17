import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Badge, Box, Button, HStack, Table, Text } from '@chakra-ui/react';
import { LuCalendar, LuChevronLeft, LuChevronRight, LuClipboardList, LuPhone, LuUsers, LuWallet } from 'react-icons/lu';
import { useGetCustomerByIdQuery } from '../../../store/services/customer.api';
import { useGetSalesOrdersQuery } from '../../../store/services/salesOrder.api';
import { formatNumber } from '../../ui/number-format';
import EntityDetail, { DetailRow, DetailSection, formatDetailDate } from '../EntityDetail';

const PAGE_SIZE = 10;

const STATUS_FILTERS = [
    { value: '', label: 'Barchasi' },
    { value: 'PENDING', label: 'Kutilmoqda' },
    { value: 'APPROVED', label: 'Tasdiqlangan' },
    { value: 'REJECTED', label: 'Rad etilgan' },
];

const STATUS_LABELS = {
    PENDING: 'Kutilmoqda',
    APPROVED: 'Tasdiqlangan',
    REJECTED: 'Rad etilgan',
};

export default function CustomerDetail() {
    const { id } = useParams();
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(0);
    const { data: customer, isLoading, isError } = useGetCustomerByIdQuery(id, { skip: !id });
    const { data: orderResult, isFetching: ordersFetching } = useGetSalesOrdersQuery(
        { customerId: id, status: status || undefined, page, size: PAGE_SIZE },
        { skip: !id }
    );

    const orders = orderResult?.items || [];
    const pagination = orderResult?.pagination;
    const totalPages = pagination?.totalPages || 0;
    const totalOrders = pagination?.totalElements ?? 0;

    const statusBadge = (value, isDark, subtitleColor) => {
        const map = {
            PENDING: { bg: isDark ? 'rgba(250,204,21,.14)' : '#FEF3C7', color: isDark ? 'yellow.200' : '#92400E' },
            APPROVED: { bg: isDark ? 'rgba(34,197,94,.14)' : '#DCFCE7', color: isDark ? 'green.300' : 'green.700' },
            REJECTED: { bg: isDark ? 'rgba(239,68,68,.14)' : '#FEE2E2', color: isDark ? 'red.300' : 'red.700' },
        };
        const style = map[value] || { bg: isDark ? 'rgba(148,163,184,.15)' : '#F1F5F9', color: subtitleColor };
        return <Badge borderRadius="full" px={3} py={1} bg={style.bg} color={style.color} whiteSpace="nowrap">{STATUS_LABELS[value] || value}</Badge>;
    };

    return <EntityDetail title={customer?.name || 'Mijoz'} icon={LuUsers} backTo="/customers" backLabel="Mijozlar" loading={isLoading} error={isError || !customer}>
        {({ isDark, textColor, subtitleColor, accentColor, cardBorder, cardBg }) => <>
            <DetailSection title="Mijoz ma’lumotlari" icon={LuUsers}>
                <DetailRow label="Nomi" value={customer.name} emphasize />
                <DetailRow label="Telefon" value={<span><LuPhone size={15} style={{ display: 'inline', marginRight: 7 }} />{customer.phone}</span>} />
                <DetailRow label="Izoh" value={customer.summary} />
            </DetailSection>
            <DetailSection title="Hisob-kitob" icon={LuWallet}>
                <DetailRow label="Qoldiq" value={`${formatNumber(Math.abs(Number(customer.balance) || 0))} so‘m ${(Number(customer.balance) || 0) > 0 ? '(qarzdor)' : (Number(customer.balance) || 0) < 0 ? '(kredit)' : ''}`} emphasize />
                <DetailRow label="Buyurtmalar soni" value={formatNumber(totalOrders)} />
            </DetailSection>
            <DetailSection title="Tizim ma’lumotlari" icon={LuCalendar}>
                <DetailRow label="Yaratilgan" value={formatDetailDate(customer.createdAt)} />
                <DetailRow label="Yangilangan" value={formatDetailDate(customer.lastModifiedAt)} />
            </DetailSection>

            <DetailSection title="Buyurtmalar" icon={LuClipboardList} gridColumn={{ base: 'auto', lg: '1 / -1' }}>
                <HStack gap={1} flexWrap="wrap" mb={1}>
                    {STATUS_FILTERS.map((option) => {
                        const isActive = status === option.value;
                        return (
                            <Button
                                key={option.value || 'all'}
                                size="sm"
                                borderRadius="full"
                                px={4}
                                fontWeight="medium"
                                onClick={() => { setStatus(option.value); setPage(0); }}
                                bg={isActive ? accentColor : 'transparent'}
                                color={isActive ? 'black' : textColor}
                                borderWidth="1px"
                                borderColor={isActive ? accentColor : cardBorder}
                                _hover={{ bg: isActive ? accentColor : (isDark ? 'whiteAlpha.100' : 'gray.50') }}
                            >
                                {option.label}
                            </Button>
                        );
                    })}
                </HStack>

                {ordersFetching ? (
                    <Text color={subtitleColor} py={6} textAlign="center">Yuklanmoqda...</Text>
                ) : orders.length === 0 ? (
                    <Text color={subtitleColor} py={6} textAlign="center">
                        {status ? 'Bu holatdagi buyurtmalar topilmadi' : 'Bu mijozda hozircha buyurtmalar yo‘q'}
                    </Text>
                ) : (
                    <>
                        <Box overflowX="auto" borderWidth="1px" borderColor={cardBorder} borderRadius="xl">
                            <Table.Root size="md" bg={cardBg} borderCollapse="collapse">
                                <Table.Header>
                                    <Table.Row>
                                        <Table.ColumnHeader color={subtitleColor} w="60px" textAlign="center">№</Table.ColumnHeader>
                                        <Table.ColumnHeader color={subtitleColor}>Mahsulotlar</Table.ColumnHeader>
                                        <Table.ColumnHeader color={subtitleColor}>Izoh</Table.ColumnHeader>
                                        <Table.ColumnHeader color={subtitleColor} textAlign="right">Summa</Table.ColumnHeader>
                                        <Table.ColumnHeader color={subtitleColor}>Holati</Table.ColumnHeader>
                                        <Table.ColumnHeader color={subtitleColor}>Sana</Table.ColumnHeader>
                                    </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                    {orders.map((order, index) => (
                                        <Table.Row key={order.id} _hover={{ bg: isDark ? 'rgba(250,204,21,.06)' : '#FFFBEB' }}>
                                            <Table.Cell color={subtitleColor} textAlign="center">{page * PAGE_SIZE + index + 1}</Table.Cell>
                                            <Table.Cell color={textColor} fontWeight="semibold" whiteSpace="nowrap">{order.items?.length ?? 0} ta</Table.Cell>
                                            <Table.Cell color={subtitleColor} maxW="280px">{order.summary || '—'}</Table.Cell>
                                            <Table.Cell color={textColor} fontWeight="bold" textAlign="right" whiteSpace="nowrap">{formatNumber(order.totalAmount ?? 0)} so‘m</Table.Cell>
                                            <Table.Cell>{statusBadge(order.status, isDark, subtitleColor)}</Table.Cell>
                                            <Table.Cell color={subtitleColor} whiteSpace="nowrap">{formatDetailDate(order.createdAt)}</Table.Cell>
                                        </Table.Row>
                                    ))}
                                </Table.Body>
                            </Table.Root>
                        </Box>
                        <HStack justify="space-between" mt={4} flexWrap="wrap" gap={3}>
                            <Text color={subtitleColor} fontSize="sm">Jami: {formatNumber(totalOrders)} ta buyurtma</Text>
                            {totalPages > 1 && <HStack gap={3}>
                                <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((value) => value - 1)}><LuChevronLeft /></Button>
                                <Text color={subtitleColor} fontSize="sm">{page + 1} / {totalPages}</Text>
                                <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage((value) => value + 1)}><LuChevronRight /></Button>
                            </HStack>}
                        </HStack>
                    </>
                )}
            </DetailSection>
        </>}
    </EntityDetail>;
}
