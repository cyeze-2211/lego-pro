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
const WAREHOUSE_SYNC_EVENT = 'production-warehouse-change';

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

    // Boshqa komponentdagi tanlov (masalan, yuqori paneldagi select) o‘zgarsa — bu yerda ham yangilanadi
    useEffect(() => {
        const sync = () => setWarehouseIdState(loadSaved());
        window.addEventListener(WAREHOUSE_SYNC_EVENT, sync);
        window.addEventListener('storage', sync);
        return () => { window.removeEventListener(WAREHOUSE_SYNC_EVENT, sync); window.removeEventListener('storage', sync); };
    }, []);

    const setWarehouseId = (id) => {
        setWarehouseIdState(id);
        try { if (id) localStorage.setItem(PRODUCTION_WAREHOUSE_KEY, id); else localStorage.removeItem(PRODUCTION_WAREHOUSE_KEY); } catch { /* xotira yo‘q */ }
        window.dispatchEvent(new Event(WAREHOUSE_SYNC_EVENT));
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

/* ═══════════════════════════════════════════════════════════════════════════
 * Har bir stanok uchun alohida kirim ombori — OTK (rahbar rejimi) belgilaydi,
 * xodim (kiosk) rejimida ombor tanlanmaydi: «+1 pachka» shu stanokning omboriga kiradi.
 * Backendda stanokda ombor maydoni yo‘q, shuning uchun bog‘lanish shu qurilma xotirasida
 * (localStorage, { [machineId]: warehouseId }). Rahbar va xodim rejimi bitta qurilmada almashinadi.
 * ═══════════════════════════════════════════════════════════════════════════ */
export const MACHINE_WAREHOUSE_KEY = 'machine_warehouse_map';
const MACHINE_WAREHOUSE_EVENT = 'machine-warehouse-change';

const loadMachineMap = () => {
    try {
        const parsed = JSON.parse(localStorage.getItem(MACHINE_WAREHOUSE_KEY) || '{}');
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch { return {}; }
};

/** Stanok uchun belgilangan ombor; belgilanmagan bo‘lsa — eski umumiy tanlov (production_warehouse_id) */
export const getMachineWarehouseId = (machineId) => (machineId && loadMachineMap()[machineId]) || loadSaved();

export const setMachineWarehouseId = (machineId, warehouseId) => {
    const map = loadMachineMap();
    if (warehouseId) map[machineId] = warehouseId; else delete map[machineId];
    try { localStorage.setItem(MACHINE_WAREHOUSE_KEY, JSON.stringify(map)); } catch { /* xotira yo‘q */ }
    window.dispatchEvent(new Event(MACHINE_WAREHOUSE_EVENT));
};

export function useMachineWarehouses() {
    // Barcha omborlar: tayyor mahsulot tovar omboriga, yarim tayyor xom ashyo omboriga ham kirishi mumkin
    const { data: warehouses = [], isLoading, isError } = useGetWarehousesQuery();
    const [map, setMap] = useState(loadMachineMap);

    useEffect(() => {
        const sync = () => setMap(loadMachineMap());
        window.addEventListener(MACHINE_WAREHOUSE_EVENT, sync);
        window.addEventListener('storage', sync);
        return () => { window.removeEventListener(MACHINE_WAREHOUSE_EVENT, sync); window.removeEventListener('storage', sync); };
    }, []);

    const getWarehouseId = (machineId) => map[machineId] || loadSaved();
    const getWarehouse = (machineId) => warehouses.find((w) => w.id === getWarehouseId(machineId)) || null;
    const setWarehouseId = (machineId, warehouseId) => { setMachineWarehouseId(machineId, warehouseId); setMap(loadMachineMap()); };

    return { warehouses, map, getWarehouseId, getWarehouse, setWarehouseId, isLoading, isError };
}

/** Stanok uchun ombor tanlovi — OTK (rahbar) rejimi ekranlari uchun */
export function MachineWarehousePicker({ machineId, state, isDark, textColor, subtitleColor, cardBg, cardBorder, compact = false }) {
    const { warehouses, getWarehouseId, setWarehouseId, isLoading, isError } = state;
    const value = machineId ? (state.map[machineId] || '') : '';
    const effective = getWarehouseId(machineId);
    const missing = !isLoading && !isError && !effective;
    const border = missing ? '#F59E0B' : (cardBorder || (isDark ? '#334155' : '#E2E8F0'));
    const productWarehouses = warehouses.filter((w) => w.category !== 'RAW_MATERIAL');
    const rawWarehouses = warehouses.filter((w) => w.category === 'RAW_MATERIAL');
    return (
        <label
            className={`flex items-center gap-2 rounded-xl border ${compact ? 'px-3 py-1.5' : 'px-4 py-2.5'}`}
            style={{ background: cardBg, borderColor: border, color: textColor, minWidth: compact ? 0 : 260 }}
            title="Bu stanokdan chiqqan mahsulot qaysi omborga kiradi (xodim rejimida shu ombor ishlatiladi)"
            onClick={(e) => e.stopPropagation()}
        >
            <LuWarehouse size={compact ? 15 : 17} style={{ color: missing ? '#F59E0B' : subtitleColor, flexShrink: 0 }} />
            {!compact && <span className="text-sm font-semibold whitespace-nowrap" style={{ color: subtitleColor }}>Kirim ombori:</span>}
            <select
                value={value}
                onChange={(e) => setWarehouseId(machineId, e.target.value)}
                disabled={isLoading || isError || !machineId}
                aria-label="Stanok kirim ombori"
                className="w-full bg-transparent text-sm font-bold outline-none cursor-pointer disabled:cursor-not-allowed"
                style={{ color: textColor, minWidth: 0 }}
            >
                <option value="">
                    {isLoading ? 'Omborlar yuklanmoqda...' : isError ? 'Omborlar yuklanmadi' : 'Omborni belgilang'}
                </option>
                <optgroup label="Tovar omborlari">
                    {productWarehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </optgroup>
                {rawWarehouses.length > 0 && (
                    <optgroup label="Xom ashyo omborlari (yarim tayyor uchun)">
                        {rawWarehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </optgroup>
                )}
            </select>
        </label>
    );
}

MachineWarehousePicker.propTypes = {
    machineId: PropTypes.string,
    state: PropTypes.shape({
        warehouses: PropTypes.array.isRequired,
        map: PropTypes.object.isRequired,
        getWarehouseId: PropTypes.func.isRequired,
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
