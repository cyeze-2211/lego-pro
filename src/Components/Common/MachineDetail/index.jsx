import { useParams } from 'react-router-dom';
import { Badge } from '@chakra-ui/react';
import { LuActivity, LuCalendar, LuCog } from 'react-icons/lu';
import { useGetMachineByIdQuery } from '../../../store/services/machine.api';
import EntityDetail, { DetailRow, DetailSection, formatDetailDate } from '../EntityDetail';

export default function MachineDetail() {
    const { id } = useParams();
    const { data: machine, isLoading, isError } = useGetMachineByIdQuery(id, { skip: !id });
    const run = machine?.currentRun;
    return <EntityDetail title={machine?.name || 'Stanok'} icon={LuCog} backTo="/machines" backLabel="Stanoklar" loading={isLoading} error={isError || !machine}>
        {({ isDark, subtitleColor }) => <>
            <DetailSection title="Stanok ma’lumotlari" icon={LuCog}>
                <DetailRow label="Nomi" value={machine.name} emphasize />
                <DetailRow label="Izoh" value={machine.summary} />
                <DetailRow label="Holati" value={<Badge borderRadius="full" px={3} py={1} bg={machine.isWorking ? (isDark ? 'rgba(34,197,94,.14)' : '#DCFCE7') : (isDark ? 'rgba(148,163,184,.15)' : '#F1F5F9')} color={machine.isWorking ? (isDark ? 'green.300' : 'green.700') : subtitleColor}>{machine.isWorking ? 'Ishlayapti' : 'Bo‘sh'}</Badge>} />
            </DetailSection>
            {run && <DetailSection title="Joriy ishlab chiqarish" icon={LuActivity}>
                <DetailRow label="Mahsulot" value={run.productName} emphasize />
                <DetailRow label="Boshlangan" value={formatDetailDate(run.startedAt)} />
            </DetailSection>}
            <DetailSection title="Tizim ma’lumotlari" icon={LuCalendar}>
                <DetailRow label="Yaratilgan" value={formatDetailDate(machine.createdAt)} />
                <DetailRow label="Yangilangan" value={formatDetailDate(machine.lastModifiedAt)} />
            </DetailSection>
        </>}
    </EntityDetail>;
}
