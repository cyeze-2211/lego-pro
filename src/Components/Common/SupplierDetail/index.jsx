import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { HStack, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { LuCalendar, LuTruck } from 'react-icons/lu';
import { useGetSupplierByIdQuery } from '../../../store/services/supplier.api';
import { ROLES } from '../../../app/permissions/roles';
import { useAppSelector } from '../../../store/hooks';
import { formatNumber } from '../../ui/number-format';
import EntityDetail, { DetailRow, DetailSection, formatDetailDate } from '../EntityDetail';
import Edit from '../Supplier/__components/Edit';
import PaymentModal from '../Supplier/__components/PaymentModal';
import SupplierPaymentHistory from '../SupplierPaymentHistory';

export default function SupplierDetail() {
    const { id } = useParams();
    const [paymentOpen, setPaymentOpen] = useState(false);
    const { data: supplier, isLoading, isError } = useGetSupplierByIdQuery(id, { skip: !id });
    const role = useAppSelector((state) => state.auth.role);
    const canManageSupplier = role === ROLES.MANAGER;

    const balance = Number(supplier?.balance) || 0;
    const balanceLabel = balance > 0
        ? `${formatNumber(balance)} so‘m — oldindan to‘langan`
        : balance < 0
            ? `${formatNumber(Math.abs(balance))} so‘m — biz qarzdormiz`
            : '0 so‘m';

    return (
        <>
            <EntityDetail
                title={supplier?.name || 'Yetkazib beruvchi'}
                icon={LuTruck}
                backTo="/suppliers"
                backLabel="Yetkazib beruvchilar"
                loading={isLoading}
                error={isError || !supplier}
                single
                payment="Balansni to‘ldirish"
                onPayment={() => setPaymentOpen(true)}
            >
                {({ isDark: dark, textColor: tc, accentColor: accent }) => (
                    <VStack align="stretch" gap={5}>
                        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                            <DetailSection title="Yetkazib beruvchi ma’lumotlari" icon={LuTruck} accentColor={accent}>
                                <DetailRow label="Nomi" value={supplier.name} emphasize />
                                <DetailRow label="Telefon" value={supplier.phone} />
                                <DetailRow label="Viloyat" value={supplier.region?.name} />
                                <DetailRow label="Manzil" value={supplier.address} />
                                <DetailRow label="INN / STIR" value={supplier.inn} />
                            </DetailSection>
                            <DetailSection title="Balans va tizim ma’lumotlari" icon={LuCalendar} accentColor={accent}>
                                <DetailRow
                                    label="Joriy balans"
                                    value={<Text as="span" fontWeight="bold" color={balance < 0 ? (dark ? 'red.300' : 'red.600') : balance > 0 ? (dark ? 'green.300' : 'green.700') : tc}>{balanceLabel}</Text>}
                                    emphasize
                                />
                                <DetailRow label="Yaratilgan" value={formatDetailDate(supplier.createdAt)} />
                                <DetailRow label="Yangilangan" value={formatDetailDate(supplier.lastModifiedAt)} />
                                <DetailRow label="Izoh" value={supplier.summary} />
                                {canManageSupplier && <HStack justify="flex-end" pt={2}><Edit supplier={supplier} /></HStack>}
                            </DetailSection>
                        </SimpleGrid>
                        <SupplierPaymentHistory supplier={supplier} />
                    </VStack>
                )}
            </EntityDetail>
            {supplier && (
                <PaymentModal
                    open={paymentOpen}
                    onClose={() => setPaymentOpen(false)}
                    supplierId={supplier.id}
                    supplierName={supplier.name}
                />
            )}
        </>
    );
}
