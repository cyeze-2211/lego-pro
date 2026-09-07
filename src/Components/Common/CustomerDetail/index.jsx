import { useParams } from 'react-router-dom';
import { LuCalendar, LuPhone, LuUsers, LuWallet } from 'react-icons/lu';
import { useGetCustomerByIdQuery } from '../../../store/services/customer.api';
import { formatNumber } from '../../ui/number-format';
import EntityDetail, { DetailRow, DetailSection, formatDetailDate } from '../EntityDetail';

export default function CustomerDetail() {
    const { id } = useParams();
    const { data: customer, isLoading, isError } = useGetCustomerByIdQuery(id, { skip: !id });
    return <EntityDetail title={customer?.name || 'Mijoz'} icon={LuUsers} backTo="/customers" backLabel="Mijozlar" loading={isLoading} error={isError || !customer}>
        {() => <>
            <DetailSection title="Mijoz ma’lumotlari" icon={LuUsers}>
                <DetailRow label="Nomi" value={customer.name} emphasize />
                <DetailRow label="Telefon" value={<span><LuPhone size={15} style={{ display: 'inline', marginRight: 7 }} />{customer.phone}</span>} />
                <DetailRow label="Izoh" value={customer.summary} />
            </DetailSection>
            <DetailSection title="Hisob-kitob" icon={LuWallet}>
                <DetailRow label="Qoldiq" value={`${formatNumber(Math.abs(Number(customer.balance) || 0))} so‘m ${(Number(customer.balance) || 0) > 0 ? '(qarzdor)' : (Number(customer.balance) || 0) < 0 ? '(kredit)' : ''}`} emphasize />
            </DetailSection>
            <DetailSection title="Tizim ma’lumotlari" icon={LuCalendar}>
                <DetailRow label="Yaratilgan" value={formatDetailDate(customer.createdAt)} />
                <DetailRow label="Yangilangan" value={formatDetailDate(customer.lastModifiedAt)} />
            </DetailSection>
        </>}
    </EntityDetail>;
}
