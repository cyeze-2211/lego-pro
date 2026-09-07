import { useParams } from 'react-router-dom';
import { LuCalendar, LuLayers, LuPackage, LuWarehouse } from 'react-icons/lu';
import { useGetWarehouseByIdQuery } from '../../../store/services/warehouse.api';
import EntityDetail, { DetailRow, DetailSection, formatDetailDate } from '../EntityDetail';

const CATEGORY_MAP = {
    PRODUCT: { label: 'Tovar ombori', icon: LuPackage },
    RAW_MATERIAL: { label: 'Xom ashyo ombori', icon: LuLayers },
};

export default function WarehouseDetail() {
    const { id } = useParams();
    const { data: warehouse, isLoading, isError } = useGetWarehouseByIdQuery(id, { skip: !id });
    const category = CATEGORY_MAP[warehouse?.category] || { label: warehouse?.category || 'Ombor', icon: LuWarehouse };
    const CategoryIcon = category.icon;

    return <EntityDetail
        title={warehouse?.name || 'Ombor'}
        icon={LuWarehouse}
        backTo="/warehouses"
        backLabel="Omborlar"
        loading={isLoading}
        error={isError || !warehouse}
        accentColorOverride="#2563EB"
        accentSoftBackground="rgba(37, 99, 235, 0.12)"
        accentGradient="linear(to-r, #2563EB, #93C5FD)"
    >
        {({ accentColor }) => <>
            <DetailSection title="Ombor ma’lumotlari" icon={LuWarehouse} accentColor={accentColor}>
                <DetailRow label="Nomi" value={warehouse.name} emphasize />
                <DetailRow label="Tavsifi" value={warehouse.summary} />
                <DetailRow label="Turi" value={<span style={{ color: accentColor, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 7 }}><CategoryIcon size={16} />{category.label}</span>} />
            </DetailSection>
            <DetailSection title="Tizim ma’lumotlari" icon={LuCalendar} accentColor={accentColor}>
                <DetailRow label="Yaratilgan" value={formatDetailDate(warehouse.createdAt)} />
                <DetailRow label="Yangilangan" value={formatDetailDate(warehouse.lastModifiedAt)} />
            </DetailSection>
        </>}
    </EntityDetail>;
}
