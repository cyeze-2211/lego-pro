import { useParams } from 'react-router-dom';
import { Badge } from '@chakra-ui/react';
import { LuCalendar, LuMonitorCog, LuUserRound } from 'react-icons/lu';
import { useGetUserByIdQuery } from '../../../store/services/user.api';
import EntityDetail, { DetailRow, DetailSection, formatDetailDate } from '../EntityDetail';

export default function UserDetail() {
    const { id } = useParams();
    const { data: user, isLoading, isError } = useGetUserByIdQuery(id, { skip: !id });
    return <EntityDetail title={user?.username || 'Foydalanuvchi'} icon={LuUserRound} backTo="/users" backLabel="Foydalanuvchilar" loading={isLoading} error={isError || !user}>
        {() => <>
            <DetailSection title="Foydalanuvchi ma’lumotlari" icon={LuUserRound}>
                <DetailRow label="Username" value={user.username} emphasize />
                <DetailRow label="Rol" value={<Badge borderRadius="full" px={3} py={1} bg="rgba(250,204,21,.14)" color="yellow.700">{user.roleName}</Badge>} />
                <DetailRow label="Oxirgi kirish" value={user.lastLoginAt ? formatDetailDate(user.lastLoginAt) : 'Kirilmagan'} />
            </DetailSection>
            <DetailSection title="Biriktirilgan qurilma" icon={LuMonitorCog}>
                <DetailRow label="Qurilma" value={user.deviceName || '—'} emphasize />
            </DetailSection>
            <DetailSection title="Tizim ma’lumotlari" icon={LuCalendar}>
                <DetailRow label="Yaratilgan" value={formatDetailDate(user.createdAt)} />
                <DetailRow label="Yangilangan" value={formatDetailDate(user.lastModifiedAt)} />
            </DetailSection>
        </>}
    </EntityDetail>;
}
