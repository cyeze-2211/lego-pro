import { useParams } from 'react-router-dom';
import { LuCalendar, LuFileText } from 'react-icons/lu';
import { useGetRawMaterialByIdQuery } from '../../../store/services/raw.api';
import EntityDetail, { DetailRow, DetailSection, formatDetailDate } from '../EntityDetail';

export default function RawDetail() {
    const { id } = useParams();
    const { data: raw, isLoading, isError } = useGetRawMaterialByIdQuery(id, { skip: !id });
    return <EntityDetail title={raw?.name || 'Xom ashyo'} icon={LuFileText} backTo="/raw" backLabel="Xom ashyolar" loading={isLoading} error={isError || !raw}>
        {() => <>
            <DetailSection title="Asosiy ma’lumotlar" icon={LuFileText}>
                <DetailRow label="Nomi" value={raw.name} emphasize />
                <DetailRow label="Tavsifi" value={raw.summary} />
            </DetailSection>
            <DetailSection title="Tizim ma’lumotlari" icon={LuCalendar}>
                <DetailRow label="Yaratilgan" value={formatDetailDate(raw.createdAt)} />
                <DetailRow label="Yangilangan" value={formatDetailDate(raw.lastModifiedAt)} />
            </DetailSection>
        </>}
    </EntityDetail>;
}
