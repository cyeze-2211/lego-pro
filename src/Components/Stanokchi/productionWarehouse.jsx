import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { LuWarehouse } from 'react-icons/lu';
import { useGetWarehousesQuery } from '../../store/services/warehouse.api';

/*
 * Stanokdan chiqqan mahsulot omborga `IN` + `machineId` + `warehouseId` bilan kiradi
 * (`PRODUCE` turi backenddan olib tashlangan). Ombor har doim majburiy — stanokchi tanlaydi.
 * Tanlov brauzerda eslab qolinadi; ombor bitta bo‘lsa o‘zi tanlanadi.
 */
export const PRODUCTION_WAREHOUSE_KEY = 'production_warehouse_id';

const loadSaved = () => { try { return localStorage.getItem(PRODUCTION_WAREHOUSE_KEY) || ''; } catch { return ''; } };

export function useProductionWarehouse() {
    const { data: warehouses = [], isLoading, isError } = useGetWarehousesQuery('PRODUCT');
    const [warehouseId, setWarehouseIdState] = useState(loadSaved);

    // Saqlangan ombor o‘chirilgan bo‘lsa — tozalaymiz; ombor bitta bo‘lsa — o‘zi tanlanadi
    useEffect(() => {
        if (!warehouses.length) return;
        if (warehouseId && !warehouses.some((w) => w.id === warehouseId)) setWarehouseIdState('');
        else if (!warehouseId && warehouses.length === 1) setWarehouseIdState(warehouses[0].id);
    }, [warehouses, warehouseId]);

    const setWarehouseId = (id) => {
        setWarehouseIdState(id);
        try { if (id) localStorage.setItem(PRODUCTION_WAREHOUSE_KEY, id); else localStorage.removeItem(PRODUCTION_WAREHOUSE_KEY); } catch { /* xotira yo‘q */ }
    };

    const warehouse = warehouses.find((w) => w.id === warehouseId) || null;
    return { warehouses, warehouseId, warehouse, setWarehouseId, isLoading, isError };
}

/** Ombor tanlovi — stanokchi ekranlari uchun (inline uslub, worker UI bilan bir xil) */
export function ProductionWarehousePicker({ state, isDark, textColor, subtitleColor, cardBg, cardBorder, compact = false }) {
    const { warehouses, warehouseId, setWarehouseId, isLoading, isError } = state;
    const missing = !isLoading && !isError && !warehouseId;
    const border = missing ? '#F59E0B' : (cardBorder || (isDark ? '#334155' : '#E2E8F0'));
    return (
        <label
            className={`flex items-center gap-2 rounded-xl border ${compact ? 'px-3 py-1.5' : 'px-4 py-2.5'}`}
            style={{ background: cardBg, borderColor: border, color: textColor, minWidth: compact ? 0 : 260 }}
            title="Stanokdan chiqqan mahsulot qaysi omborga kirishi"
        >
            <LuWarehouse size={compact ? 15 : 17} style={{ color: missing ? '#F59E0B' : subtitleColor, flexShrink: 0 }} />
            {!compact && <span className="text-sm font-semibold whitespace-nowrap" style={{ color: subtitleColor }}>Ombor:</span>}
            <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                disabled={isLoading || isError}
                aria-label="Kirim ombori"
                className="w-full bg-transparent text-sm font-bold outline-none cursor-pointer disabled:cursor-not-allowed"
                style={{ color: textColor, minWidth: 0 }}
            >
                <option value="">
                    {isLoading ? 'Omborlar yuklanmoqda...' : isError ? 'Omborlar yuklanmadi' : 'Omborni tanlang'}
                </option>
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
        </label>
    );
}

ProductionWarehousePicker.propTypes = {
    state: PropTypes.shape({
        warehouses: PropTypes.array.isRequired,
        warehouseId: PropTypes.string.isRequired,
        setWarehouseId: PropTypes.func.isRequired,
        isLoading: PropTypes.bool,
        isError: PropTypes.bool,
    }).isRequired,
    isDark: PropTypes.bool,
    textColor: PropTypes.string,
    subtitleColor: PropTypes.string,
    cardBg: PropTypes.string,
    cardBorder: PropTypes.string,
    compact: PropTypes.bool,
};
