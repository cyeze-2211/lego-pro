import { Link } from 'react-router-dom';
import { LuArrowRight, LuChevronLeft, LuChevronRight, LuFlaskConical, LuListChecks } from 'react-icons/lu';
import { useState } from 'react';
import { useGetAllRecipesQuery } from '../../../store/services/productRecept.api';
import { useAppTheme } from '../../../theme/tokens';
import Loading from '../../Other/UI/Loadings/Loading';

const PAGE_SIZE = 12;
const UNIT_LABELS = { GRAM: 'g', KG: 'kg', TON: 't' };

export default function MixerDashboard() {
    const [page, setPage] = useState(0);
    const { data, isLoading, error } = useGetAllRecipesQuery({ page, size: PAGE_SIZE });
    const { isDark, pageBg, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();
    const recipes = data?.items || [];
    const totalPages = data?.pagination?.totalPages || 0;

    return (
        <div style={{ background: pageBg, color: textColor, minHeight: '100%' }}>
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div>
                    <p className="mb-1 text-xs font-bold uppercase tracking-widest text-amber-500">Ishlab chiqarish</p>
                    <h1 className="text-3xl font-bold">Retseptlar</h1>
                    <p className="mt-1 text-sm" style={{ color: subtitleColor }}>Aralashtirish uchun retseptni tanlang.</p>
                </div>
                <div className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm" style={{ borderColor: cardBorder, background: cardBg }}>
                    <LuFlaskConical size={17} style={{ color: accentColor }} />
                    <span style={{ color: subtitleColor }}>{data?.pagination?.totalElements || recipes.length} ta retsept</span>
                </div>
            </div>

            {isLoading && <Loading />}
            {error && !isLoading && <p className="py-16 text-center text-sm text-rose-500">Retseptlarni yuklashda xatolik yuz berdi.</p>}
            {!isLoading && !error && recipes.length === 0 && <p className="py-16 text-center text-sm" style={{ color: subtitleColor }}>Hozircha retseptlar yo&apos;q.</p>}

            {!isLoading && !error && recipes.length > 0 && <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {recipes.map((recipe) => (
                        <Link
                            key={recipe.recipeId}
                            to={`/mixer/recipes/${recipe.recipeId}`}
                            className="group overflow-hidden rounded-2xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
                            style={{ background: cardBg, borderColor: cardBorder }}
                        >
                            <div className="h-1 bg-gradient-to-r from-amber-300 to-yellow-500" />
                            <div className="p-5">
                                <div className="mb-5 flex items-start justify-between gap-3">
                                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/15 text-amber-500">
                                        <LuFlaskConical size={22} />
                                    </span>
                                    <LuArrowRight className="text-slate-400 transition-transform group-hover:translate-x-1" size={18} />
                                </div>
                                <h2 className="mb-1 text-lg font-bold" style={{ color: textColor }}>{recipe.name}</h2>
                                <div className="mb-5 flex items-center gap-2 text-xs" style={{ color: subtitleColor }}>
                                    <LuListChecks size={14} /> {recipe.items?.length || 0} ta xom ashyo
                                </div>
                                <div className="space-y-2 border-t pt-4" style={{ borderColor: cardBorder }}>
                                    {(recipe.items || []).slice(0, 3).map((item) => (
                                        <div key={item.itemId || item.stepOrder} className="flex justify-between gap-3 text-sm">
                                            <span className="truncate" style={{ color: subtitleColor }}>{item.rawMaterialName}</span>
                                            <span className="shrink-0 font-semibold" style={{ color: textColor }}>{item.quantity} {UNIT_LABELS[item.unit] || item.unit}</span>
                                        </div>
                                    ))}
                                    {recipe.items?.length > 3 && <span className="text-xs text-amber-500">+ yana {recipe.items.length - 3} ta</span>}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
                {totalPages > 1 && <div className="mt-8 flex items-center justify-center gap-3">
                    <button disabled={page === 0} onClick={() => setPage((value) => value - 1)} className="rounded-lg border p-2 disabled:opacity-40" style={{ borderColor: cardBorder, background: cardBg }}><LuChevronLeft /></button>
                    <span className="text-sm" style={{ color: subtitleColor }}>{page + 1} / {totalPages}</span>
                    <button disabled={page >= totalPages - 1} onClick={() => setPage((value) => value + 1)} className="rounded-lg border p-2 disabled:opacity-40" style={{ borderColor: cardBorder, background: cardBg }}><LuChevronRight /></button>
                </div>}
            </>}
        </div>
    );
}