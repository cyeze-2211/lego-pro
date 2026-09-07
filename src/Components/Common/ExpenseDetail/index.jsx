import { useParams } from 'react-router-dom';
import { HStack, Text } from '@chakra-ui/react';
import { LuCalendar, LuReceiptText, LuWallet } from 'react-icons/lu';
import { useGetExpenseByIdQuery } from '../../../store/services/expense.api';
import { formatNumber } from '../../ui/number-format';
import EntityDetail, { DetailRow, DetailSection, formatDetailDate } from '../EntityDetail';

export default function ExpenseDetail() {
    const { id } = useParams();
    const { data: expense, isLoading, isError } = useGetExpenseByIdQuery(id, { skip: !id });
    return <EntityDetail title={expense?.name || 'Xarajat'} icon={LuReceiptText} backTo="/expenses" backLabel="Xarajatlar" loading={isLoading} error={isError || !expense} single accentColorOverride="#FACC15" accentSoftBackground="rgba(250, 204, 21, 0.12)" accentGradient="linear(to-r, #FACC15, #FDE68A)">
        {({ textColor, subtitleColor, accentColor }) => <>
            <DetailSection title="Xarajat ma’lumotlari" icon={LuReceiptText}>
                <DetailRow label="Nomi" value={expense.name} emphasize />
                <DetailRow label="Tavsifi" value={expense.summary} />
                <DetailRow label="Sana" value={expense.expenseDate} />
                <DetailRow label="Summa" value={`-${formatNumber(expense.amount)} so‘m`} emphasize />
            </DetailSection>
            <HStack mt={5} pt={4} borderTopWidth="1px" borderColor={subtitleColor} justifyContent="space-between" flexWrap="wrap" gap={2}><HStack gap={2}><LuWallet size={16} color={accentColor} /><Text color={subtitleColor} fontWeight="semibold">Kassa</Text></HStack><Text color={textColor} fontWeight="semibold">{expense.cashboxName}</Text></HStack>
            <HStack mt={2} justifyContent="space-between" flexWrap="wrap" gap={2}><HStack gap={2}><LuCalendar size={16} color={accentColor} /><Text color={subtitleColor} fontWeight="semibold">Yaratilgan</Text></HStack><Text color={textColor}>{formatDetailDate(expense.createdAt)}</Text></HStack>
        </>}
    </EntityDetail>;
}
