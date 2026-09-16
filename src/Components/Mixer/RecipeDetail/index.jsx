import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    LuCheck,
    LuFlaskConical,
    LuScale,
    LuTriangleAlert,
    LuWarehouse,
} from 'react-icons/lu';
import { useGetRecipeByIdQuery } from '../../../store/services/productRecept.api';
import { useGetWarehousesQuery } from '../../../store/services/warehouse.api';
import { useCreateRawMaterialTransactionMutation } from '../../../store/services/rawMaterialStock.api';
import { useAppTheme, BRAND_COLORS } from '../../../theme/tokens';
import { useHeaderContext } from '../../../context/HeaderContext';
import { Alert } from '../../Other/UI/Alert/Alert';
import Loading from '../../Other/UI/Loadings/Loading';

const UNIT_LABELS = { GRAM: 'g', KG: 'kg', TON: 't' };

export default function MixerRecipeDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: recipe, isLoading, isError } = useGetRecipeByIdQuery(id, { skip: !id });
    const { data: warehouses = [] } = useGetWarehousesQuery('RAW_MATERIAL');
    const [createTransaction, { isLoading: isSaving }] = useCreateRawMaterialTransactionMutation();

    const { isDark, pageBg, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();
    const { setPageHeader } = useHeaderContext();

    const [warehouseId, setWarehouseId]     = useState('');
    const [warehouseSelected, setWarehouseSelected] = useState(false); // ko'p omborda tanlangandan keyin true
    const [completedStep, setCompletedStep] = useState(0);
    const [errorMsg, setErrorMsg]           = useState(null);

    // Header da faqat back button
    useEffect(() => {
        setPageHeader({ backTo: '/mixer' });
        return () => setPageHeader(null);
    }, []);

    // 1 ta ombor — avtomatik tanlash, cardlar darhol ko'rinadi
    useEffect(() => {
        if (warehouses.length === 1) {
            setWarehouseId(warehouses[0].id);
            setWarehouseSelected(true);
        }
    }, [warehouses]);

    const items      = recipe?.items || [];
    const totalSteps = items.length;
    const allDone    = completedStep >= totalSteps;

    // Ko'p omborda foydalanuvchi tanlasa
    const handleWarehouseChange = (e) => {
        setWarehouseId(e.target.value);
        setWarehouseSelected(!!e.target.value);
        setCompletedStep(0); // tanlash o'zgarganda progressni reset
    };

    const handleFinish = async () => {
        if (!warehouseId || items.length === 0) return;
        setErrorMsg(null);
        try {
            await createTransaction({
                warehouseId,
                action: 'OUT',
                items: items.map(({ rawMaterialId, quantity, unit }) => ({
                    rawMaterialId,
                    quantity: Number(quantity),
                    unit,
                })),
            }).unwrap();
            Alert('Xom ashyo chiqimi muvaffaqiyatli qayd etildi', 'success');
            navigate('/mixer');
        } catch (err) {
            setErrorMsg(err?.data?.message || 'Xom ashyo chiqimini saqlashda xatolik.');
        }
    };

    if (isLoading) return <Loading />;
    if (isError || !recipe) return (
        <p className="py-16 text-center text-rose-500">Retsept topilmadi.</p>
    );

    return (
        <div style={{ background: pageBg, color: textColor, minHeight: '100%' }}>

            {/* ── Sahifa sarlavhasi ── */}
            <div className="flex items-center gap-3 mb-5">
                <div
                    className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0"
                    style={{ background: isDark ? 'rgba(250,204,21,0.12)' : '#FEF3C7' }}
                >
                    <LuFlaskConical size={20} style={{ color: accentColor }} />
                </div>
                <div>
                    <h1 className="text-xl font-bold leading-tight" style={{ color: textColor }}>
                        {recipe.name}
                    </h1>
                    <p className="text-xs mt-0.5" style={{ color: subtitleColor }}>
                        {totalSteps} ta xom ashyo
                    </p>
                </div>
            </div>

            {/* ── Ombor bloki — faqat 2+ ombor bo'lsa ko'rinadi ── */}
            {warehouses.length > 1 && (
                <div
                    className="flex flex-wrap items-center gap-3 mb-5 p-4 rounded-2xl border"
                    style={{
                        background: cardBg,
                        borderColor: warehouseSelected
                            ? (isDark ? 'rgba(250,204,21,0.4)' : '#FDE68A')
                            : cardBorder,
                        boxShadow: isDark ? '0 2px 10px rgba(0,0,0,0.18)' : '0 2px 8px rgba(15,23,42,0.05)',
                        transition: 'border-color 0.2s',
                    }}
                >
                    <div className="flex items-center gap-2">
                        <LuWarehouse size={15} style={{ color: accentColor }} />
                        <span className="text-sm font-semibold" style={{ color: textColor }}>
                            Xom ashyo ombori:
                        </span>
                    </div>

                    <div className="relative">
                        <select
                            required
                            value={warehouseId}
                            onChange={handleWarehouseChange}
                            style={{
                                height: 36,
                                paddingLeft: 12,
                                paddingRight: 32,
                                borderRadius: 12,
                                border: `1.5px solid ${warehouseId
                                    ? (isDark ? 'rgba(250,204,21,0.55)' : '#FDE68A')
                                    : cardBorder}`,
                                background: isDark ? BRAND_COLORS.darkInputBg : '#fff',
                                color: warehouseId ? textColor : subtitleColor,
                                fontSize: 13,
                                fontWeight: 600,
                                outline: 'none',
                                appearance: 'none',
                                cursor: 'pointer',
                                minWidth: 180,
                            }}
                        >
                            <option value="">Omborni tanlang</option>
                            {warehouses.map((w) => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                        </select>
                        <svg
                            style={{
                                position: 'absolute', right: 10, top: '50%',
                                transform: 'translateY(-50%)', pointerEvents: 'none',
                                color: subtitleColor,
                            }}
                            width="12" height="12" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        >
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </div>
                </div>
            )}

            {/* ── Xom ashyo cardlar — ombor tanlangandan keyin ko'rinadi ── */}
            {warehouseSelected && (
                <>
                    <div className="flex flex-col gap-2.5 mb-5">
                        {items.map((item, index) => {
                            const stepNum  = index + 1;
                            const isDone   = completedStep >= stepNum;
                            const isActive = completedStep === index;
                            const isLocked = completedStep < index;

                            return (
                                <RawItemCard
                                    key={item.rawMaterialId || item.itemId || index}
                                    item={item}
                                    stepNum={stepNum}
                                    isDone={isDone}
                                    isActive={isActive}
                                    isLocked={isLocked}
                                    isDark={isDark}
                                    cardBg={cardBg}
                                    cardBorder={cardBorder}
                                    textColor={textColor}
                                    subtitleColor={subtitleColor}
                                    accentColor={accentColor}
                                    onDone={() => setCompletedStep(stepNum)}
                                />
                            );
                        })}
                    </div>

                    {/* ── Xato xabar ── */}
                    {errorMsg && (
                        <div
                            className="flex items-center gap-2 mb-4 rounded-xl px-4 py-3 text-sm"
                            style={{
                                background: isDark ? 'rgba(239,68,68,0.1)' : '#FEE2E2',
                                border: `1px solid ${isDark ? 'rgba(239,68,68,0.25)' : '#FECACA'}`,
                                color: isDark ? '#FCA5A5' : '#991B1B',
                            }}
                        >
                            <LuTriangleAlert size={16} style={{ flexShrink: 0 }} />
                            {errorMsg}
                        </div>
                    )}

                    {/* ── Tugatish — to'liq kenglikda, eng pastda ── */}
                    {allDone && (
                        <button
                            onClick={handleFinish}
                            disabled={isSaving || !warehouseId}
                            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl font-bold text-sm transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                background: 'linear-gradient(135deg,#FACC15,#EAB308)',
                                color: '#0F172A',
                                boxShadow: '0 6px 20px rgba(250,204,21,0.3)',
                                border: 'none',
                                cursor: isSaving || !warehouseId ? 'not-allowed' : 'pointer',
                            }}
                        >
                            <LuCheck size={17} />
                            {isSaving ? 'Saqlanmoqda...' : 'Tugatish'}
                        </button>
                    )}
                </>
            )}

            {/* Ombor tanlanmagan holda yo'riqnoma */}
            {!warehouseSelected && warehouses.length > 1 && (
                <div
                    className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl border"
                    style={{
                        borderColor: cardBorder,
                        borderStyle: 'dashed',
                        color: subtitleColor,
                    }}
                >
                    <LuWarehouse size={36} style={{ opacity: 0.3 }} />
                    <p className="text-sm">Xom ashyo omborini tanlang</p>
                </div>
            )}
        </div>
    );
}

/* ════════════════════════════════════════════════════════════
   Xom ashyo karta — gorizontal (to'liq kenglik)
════════════════════════════════════════════════════════════ */
function RawItemCard({
    item, stepNum, isDone, isActive, isLocked,
    isDark, cardBg, cardBorder, textColor, subtitleColor, accentColor,
    onDone,
}) {
    const unitLabel = UNIT_LABELS[item.unit] || item.unit;

    const borderColor = isDone
        ? (isDark ? 'rgba(34,197,94,0.5)'    : '#86EFAC')
        : isActive
            ? (isDark ? 'rgba(250,204,21,0.55)' : '#FCD34D')
            : cardBorder;

    const bg = isDone
        ? (isDark ? 'rgba(34,197,94,0.06)' : '#F0FDF4')
        : isActive
            ? (isDark ? cardBg : '#FFFDF0')
            : cardBg;

    const numBg = isDone
        ? (isDark ? 'rgba(34,197,94,0.18)'    : '#DCFCE7')
        : isActive
            ? (isDark ? 'rgba(250,204,21,0.18)' : '#FEF9C3')
            : (isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9');

    const numColor = isDone
        ? (isDark ? '#86EFAC' : '#166534')
        : isActive ? accentColor : subtitleColor;

    return (
        <div
            className="flex items-stretch overflow-hidden rounded-2xl border transition-all duration-200"
            style={{
                background: bg,
                borderColor,
                opacity: isLocked ? 0.42 : 1,
                boxShadow: isActive
                    ? (isDark
                        ? '0 0 0 2px rgba(250,204,21,0.22), 0 4px 16px rgba(0,0,0,0.2)'
                        : '0 0 0 3px rgba(250,204,21,0.18), 0 4px 12px rgba(15,23,42,0.07)')
                    : isDone
                        ? (isDark ? '0 0 0 1.5px rgba(34,197,94,0.2)' : '0 0 0 2px rgba(34,197,94,0.1)')
                        : (isDark ? '0 1px 6px rgba(0,0,0,0.15)'     : '0 1px 4px rgba(15,23,42,0.04)'),
            }}
        >
            {/* Left accent bar */}
            <div
                className="w-[3px] flex-shrink-0"
                style={{
                    background: isDone
                        ? 'linear-gradient(180deg,#22C55E,#16A34A)'
                        : isActive
                            ? 'linear-gradient(180deg,#FACC15,#EAB308)'
                            : (isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0'),
                }}
            />

            {/* Raqam */}
            <div className="flex items-center px-5">
                <span
                    className="flex-shrink-0 flex items-center justify-center rounded-xl font-black text-base"
                    style={{
                        width: 44, height: 44,
                        background: numBg,
                        color: numColor,
                        letterSpacing: '-0.5px',
                    }}
                >
                    {String(stepNum).padStart(2, '0')}
                </span>
            </div>

            {/* Nom */}
            <div className="flex-1 flex items-center py-7 min-w-0">
                <span
                    className="font-bold text-base leading-snug truncate"
                    style={{ color: isLocked ? subtitleColor : textColor }}
                >
                    {item.rawMaterialName}
                </span>
            </div>

            {/* Miqdor + Birlik */}
            <div className="flex items-center gap-2 px-4 flex-shrink-0">
                <div
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
                    style={{
                        background: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
                        border: `1px solid ${cardBorder}`,
                    }}
                >
                    <LuScale size={14} style={{ color: subtitleColor }} />
                    <span className="text-sm font-bold" style={{ color: isLocked ? subtitleColor : textColor }}>
                        {item.quantity}
                    </span>
                </div>
                <div
                    className="flex items-center justify-center rounded-xl text-sm font-bold px-4 py-2.5"
                    style={{
                        background: isDark ? 'rgba(250,204,21,0.09)' : '#FEF9C3',
                        border: `1px solid ${isDark ? 'rgba(250,204,21,0.2)' : '#FDE68A'}`,
                        color: accentColor,
                        minWidth: 48,
                    }}
                >
                    {unitLabel}
                </div>
            </div>

            {/* Bo'ldi / Bajarildi */}
            {!isLocked && (
                <div className="flex items-center pr-5 pl-2 flex-shrink-0">
                    {isDone ? (
                        <div
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold"
                            style={{
                                background: isDark ? 'rgba(34,197,94,0.1)' : '#DCFCE7',
                                color: isDark ? '#86EFAC' : '#166534',
                                border: `1px solid ${isDark ? 'rgba(34,197,94,0.28)' : '#BBF7D0'}`,
                                whiteSpace: 'nowrap',
                            }}
                        >
                            <LuCheck size={15} /> Bajarildi
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={onDone}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-[0.97]"
                            style={{
                                background: 'linear-gradient(135deg,#FACC15,#EAB308)',
                                color: '#0F172A',
                                border: 'none',
                                cursor: 'pointer',
                                boxShadow: '0 3px 12px rgba(250,204,21,0.3)',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            <LuCheck size={15} /> Bo&apos;ldi
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
