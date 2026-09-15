import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LuArrowLeft, LuCheck, LuFlaskConical, LuMinus, LuPlus, LuScale, LuTriangleAlert } from 'react-icons/lu';
import { useGetRecipeByIdQuery } from '../../../store/services/productRecept.api';
import { useGetWarehousesQuery } from '../../../store/services/warehouse.api';
import { useCreateRawMaterialTransactionMutation } from '../../../store/services/rawMaterialStock.api';
import { useAppTheme } from '../../../theme/tokens';
import Loading from '../../Other/UI/Loadings/Loading';

const UNITS = ['GRAM', 'KG', 'TON'];
const UNIT_LABELS = { GRAM: 'g', KG: 'kg', TON: 't' };

export default function MixerRecipeDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: recipe, isLoading, isError } = useGetRecipeByIdQuery(id, { skip: !id });
    const { data: warehouses = [] } = useGetWarehousesQuery('RAW_MATERIAL');
    const [createTransaction, { isLoading: isSaving }] = useCreateRawMaterialTransactionMutation();
    const { isDark, pageBg, cardBg, cardBorder, textColor, subtitleColor } = useAppTheme();
    const [warehouseId, setWarehouseId] = useState('');
    const [items, setItems] = useState([]);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        if (recipe?.items) {
            setItems(recipe.items.map((item) => ({
                rawMaterialId: item.rawMaterialId,
                rawMaterialName: item.rawMaterialName,
                quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
                unit: item.unit,
            })));
        }
    }, [recipe]);

    const updateItem = (rawMaterialId, field, value) => setItems((current) => current.map((item) => item.rawMaterialId === rawMaterialId ? { ...item, [field]: value } : item));
    const stepQuantity = (rawMaterialId, delta) => setItems((current) => current.map((item) => item.rawMaterialId === rawMaterialId ? { ...item, quantity: Math.max(1, Math.min(1000000000, item.quantity + delta)) } : item));

    const handleFinish = async (event) => {
        event.preventDefault();
        if (!warehouseId || items.length === 0) return;
        setMessage(null);
        try {
            await createTransaction({ warehouseId, action: 'OUT', items: items.map(({ rawMaterialId, quantity, unit }) => ({ rawMaterialId, quantity: Number(quantity), unit })) }).unwrap();
            navigate('/mixer', { state: { completed: true } });
        } catch (error) {
            setMessage(error?.data?.message || 'Xom ashyo chiqimini saqlashda xatolik yuz berdi.');
        }
    };

    if (isLoading) return <Loading />;
    if (isError || !recipe) return <p className="py-16 text-center text-rose-500">Retsept topilmadi.</p>;

    return (
        <div style={{ background: pageBg, color: textColor, minHeight: '100%' }}>
            <button onClick={() => navigate('/mixer')} className="mb-5 flex items-center gap-2 text-sm font-semibold text-amber-500 hover:text-amber-600"><LuArrowLeft size={16} /> Retseptlar</button>
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div><p className="mb-1 text-xs font-bold uppercase tracking-widest text-amber-500">Chiqim tayyorlash</p><h1 className="text-3xl font-bold">{recipe.name}</h1><p className="mt-1 text-sm" style={{ color: subtitleColor }}>Har bir xom ashyoni tarozidagi haqiqiy miqdor bilan tekshiring.</p></div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-500"><LuScale size={24} /></div>
            </div>

            <form onSubmit={handleFinish} className="overflow-hidden rounded-2xl border shadow-sm" style={{ background: cardBg, borderColor: cardBorder }}>
                <div className="border-b p-5" style={{ borderColor: cardBorder }}>
                    <label className="mb-2 block text-sm font-semibold" htmlFor="mixer-warehouse">Xom ashyo ombori</label>
                    <select id="mixer-warehouse" required value={warehouseId} onChange={(event) => setWarehouseId(event.target.value)} className={`h-12 w-full rounded-xl border px-4 text-sm outline-none sm:max-w-md ${isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 bg-white text-slate-900'}`}>
                        <option value="">Omborni tanlang</option>
                        {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
                    </select>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[680px] text-sm">
                        <thead><tr className="text-left text-xs uppercase tracking-wide" style={{ color: subtitleColor, background: isDark ? 'rgba(15,23,42,.35)' : '#f8fafc' }}><th className="px-5 py-4">Xom ashyo</th><th className="px-5 py-4">Tarozi miqdori</th><th className="px-5 py-4">Birlik</th></tr></thead>
                        <tbody>{items.map((item, index) => <tr key={item.rawMaterialId} className="border-t" style={{ borderColor: cardBorder }}>
                            <td className="px-5 py-4"><div className="flex items-center gap-3"><span className="text-xs font-bold text-amber-500">{String(index + 1).padStart(2, '0')}</span><span className="font-semibold">{item.rawMaterialName}</span></div></td>
                            <td className="px-5 py-4"><div className="inline-flex items-center overflow-hidden rounded-xl border" style={{ borderColor: cardBorder }}><button type="button" onClick={() => stepQuantity(item.rawMaterialId, -1)} className="flex h-11 w-10 items-center justify-center bg-slate-500/10"><LuMinus size={15} /></button><input aria-label={`${item.rawMaterialName} miqdori`} type="number" min="1" max="1000000000" step="1" required value={item.quantity} onChange={(event) => updateItem(item.rawMaterialId, 'quantity', Math.max(1, Math.min(1000000000, Number.parseInt(event.target.value, 10) || 1)))} className="h-11 w-24 border-x bg-transparent text-center font-bold outline-none" style={{ borderColor: cardBorder, color: textColor }} /><button type="button" onClick={() => stepQuantity(item.rawMaterialId, 1)} className="flex h-11 w-10 items-center justify-center bg-slate-500/10"><LuPlus size={15} /></button></div></td>
                            <td className="px-5 py-4"><div className="inline-flex overflow-hidden rounded-xl border" style={{ borderColor: cardBorder }}>{UNITS.map((unit) => <button type="button" key={unit} onClick={() => updateItem(item.rawMaterialId, 'unit', unit)} className={`h-11 px-4 text-xs font-bold ${item.unit === unit ? 'bg-amber-400 text-slate-900' : 'bg-slate-500/10'}`}>{UNIT_LABELS[unit]}</button>)}</div></td>
                        </tr>)}</tbody>
                    </table>
                </div>
                {message && <div className="mx-5 my-4 flex items-center gap-2 rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-500"><LuTriangleAlert size={17} /> {message}</div>}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t p-5" style={{ borderColor: cardBorder }}><p className="text-xs" style={{ color: subtitleColor }}>{items.length} ta ingredient bitta tranzaksiyada chiqim qilinadi.</p><button type="submit" disabled={isSaving || !warehouseId} className="flex h-12 items-center gap-2 rounded-xl bg-amber-400 px-6 text-sm font-bold text-slate-900 shadow-lg shadow-amber-400/20 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50">{isSaving ? 'Saqlanmoqda...' : <><LuCheck size={17} /> Tugatish</>}</button></div>
            </form>
        </div>
    );
}