import { useParams } from 'react-router-dom';
import { HStack, Text } from '@chakra-ui/react';
import { LuCalendar, LuWallet } from 'react-icons/lu';
import { useGetCashboxByIdQuery } from '../../../store/services/cashbox.api';
import { formatNumber } from '../../ui/number-format';
import EntityDetail, { DetailRow, DetailSection, formatDetailDate } from '../EntityDetail';

export default function CashboxDetail() {
    const { id } = useParams();
    const { data: cashbox, isLoading, isError } = useGetCashboxByIdQuery(id, { skip: !id });
    return <EntityDetail title={cashbox?.name || 'Kassa'} icon={LuWallet} backTo="/cashboxes" backLabel="Kassalar" loading={isLoading} error={isError || !cashbox} single accentColorOverride="#FACC15" accentSoftBackground="rgba(250, 204, 21, 0.12)" accentGradient="linear(to-r, #FACC15, #FDE68A)">
        {({ accentColor, textColor, subtitleColor }) => <>
            <DetailSection title="Kassa ma’lumotlari" icon={LuWallet} accentColor={accentColor}>
                <DetailRow label="Nomi" value={cashbox.name} emphasize />
                <DetailRow label="Izoh" value={cashbox.summary} />
                <DetailRow label="Joriy balans" value={<span style={{ color: accentColor, fontWeight: 800 }}>{formatNumber(cashbox.balance)} so‘m</span>} emphasize />
            </DetailSection>
            <HStack mt={4} justifyContent="space-between" flexWrap="wrap" gap={2}><HStack gap={2}><LuCalendar size={16} color={accentColor} /><Text color={subtitleColor} fontWeight="semibold">Yaratilgan</Text></HStack><Text color={textColor}>{formatDetailDate(cashbox.createdAt)}</Text></HStack>
            <HStack mt={2} justifyContent="space-between" flexWrap="wrap" gap={2}><HStack gap={2}><LuCalendar size={16} color={accentColor} /><Text color={subtitleColor} fontWeight="semibold">Yangilangan</Text></HStack><Text color={textColor}>{formatDetailDate(cashbox.lastModifiedAt)}</Text></HStack>
        </>}
    </EntityDetail>;
}
