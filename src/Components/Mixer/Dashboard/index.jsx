import { Link } from 'react-router-dom';
import { LuArrowRight, LuChevronLeft, LuChevronRight, LuFlaskConical } from 'react-icons/lu';
import { useState } from 'react';
import { useGetAllRecipesQuery } from '../../../store/services/productRecept.api';
import { useAppTheme } from '../../../theme/tokens';
import Loading from '../../Other/UI/Loadings/Loading';

const PAGE_SIZE = 12;

/* accentColor (#RRGGBB) asosida rgba fon rangi hosil qilish — barcha
   "yumshoq sariq fon"lar shu bitta manbadan keladi, shu sabab har doim mos keladi */
function hexToRgba(hex, alpha = 1) {
    if (!hex) return `rgba(250,204,21,${alpha})`;
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function MixerDashboard() {
    const [page, setPage] = useState(0);
    const { data, isLoading, error } = useGetAllRecipesQuery({ page, size: PAGE_SIZE });
    const { isDark, pageBg, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();
    const recipes = data?.items || [];
    const totalPages = data?.pagination?.totalPages || 0;

    // Aksent asosidagi yordamchi ranglar — bitta manba, har joyda bir xil
    const accentSoftBg = hexToRgba(accentColor, isDark ? 0.11 : 0.12);
    const accentBadgeBg = hexToRgba(accentColor, isDark ? 0.1 : 0.14);
    const accentBarGradient = `linear-gradient(180deg, ${hexToRgba(accentColor, 1)}, ${hexToRgba(accentColor, 0.75)})`;

    return (
        <div style={{ background: pageBg, color: textColor, minHeight: '100%' }}>
            {/* Header */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl font-bold" style={{ color: textColor }}>Retseptlar</h1>
                <div
                    className="flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold"
                    style={{ borderColor: cardBorder, background: cardBg, color: subtitleColor }}
                >
                    <LuFlaskConical size={14} style={{ color: accentColor }} />
                    {data?.pagination?.totalElements ?? recipes.length} ta
                </div>
            </div>

            {isLoading && <Loading />}
            {error && !isLoading && (
                <p className="py-16 text-center text-sm text-rose-500">Retseptlarni yuklashda xatolik.</p>
            )}
            {!isLoading && !error && recipes.length === 0 && (
                <p className="py-16 text-center text-sm" style={{ color: subtitleColor }}>
                    Hozircha retseptlar yo&apos;q.
                </p>
            )}

            {!isLoading && !error && recipes.length > 0 && (
                <>
                    <div className="flex flex-col gap-2.5">
                        {recipes.map((recipe) => (
                            <RecipeCard
                                key={recipe.recipeId}
                                recipe={recipe}
                                isDark={isDark}
                                cardBg={cardBg}
                                cardBorder={cardBorder}
                                textColor={textColor}
                                subtitleColor={subtitleColor}
                                accentColor={accentColor}
                                accentSoftBg={accentSoftBg}
                                accentBadgeBg={accentBadgeBg}
                                accentBarGradient={accentBarGradient}
                            />
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="mt-8 flex items-center justify-center gap-3">
                            <button
                                disabled={page === 0}
                                onClick={() => setPage((p) => p - 1)}
                                className="rounded-xl border p-2 disabled:opacity-40 transition-all hover:opacity-70"
                                style={{ borderColor: cardBorder, background: cardBg, color: textColor }}
                            >
                                <LuChevronLeft size={16} />
                            </button>
                            <span className="text-sm" style={{ color: subtitleColor }}>
                                {page + 1} / {totalPages}
                            </span>
                            <button
                                disabled={page >= totalPages - 1}
                                onClick={() => setPage((p) => p + 1)}
                                className="rounded-xl border p-2 disabled:opacity-40 transition-all hover:opacity-70"
                                style={{ borderColor: cardBorder, background: cardBg, color: textColor }}
                            >
                                <LuChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

/* ── Gorizontal karta ─────────────────────────────────────── */
function RecipeCard({
    recipe,
    isDark,
    cardBg,
    cardBorder,
    textColor,
    subtitleColor,
    accentColor,
    accentSoftBg,
    accentBadgeBg,
    accentBarGradient,
}) {
    const items = recipe.items || [];

    return (
        <Link
            to={`/mixer/recipes/${recipe.recipeId}`}
            className="group flex items-stretch overflow-hidden rounded-2xl border transition-all duration-200 hover:shadow-lg hover:-translate-y-[1px]"
            style={{
                background: cardBg,
                borderColor: cardBorder,
                boxShadow: isDark
                    ? '0 1px 8px rgba(0,0,0,0.22)'
                    : '0 1px 6px rgba(15,23,42,0.05)',
                textDecoration: 'none',
            }}
        >
            {/* Left accent bar */}
            <div
                className="w-[3px] flex-shrink-0"
                style={{ background: accentBarGradient }}
            />

            {/* Icon */}
            <div className="flex items-center px-4">
                <div
                    className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0"
                    style={{ background: accentSoftBg }}
                >
                    <LuFlaskConical size={18} style={{ color: accentColor }} />
                </div>
            </div>

            {/* Text — name + ingredients */}
            <div className="flex-1 py-3.5 pr-3 min-w-0 flex flex-col justify-center gap-1">
                <div className="flex items-center gap-2 flex-wrap">
                    <span
                        className="text-sm font-bold leading-tight"
                        style={{ color: textColor }}
                    >
                        {recipe.name}
                    </span>
                    <span
                        className="flex-shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{
                            background: accentBadgeBg,
                            color: accentColor,
                        }}
                    >
                        {items.length} ta xom ashyo
                    </span>
                </div>

                {items.length > 0 && (
                    <p
                        className="text-[11px] leading-snug"
                        style={{
                            color: subtitleColor,
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                        }}
                    >
                        {items.map((it) => it.rawMaterialName).join('  ·  ')}
                    </p>
                )}
            </div>

            {/* Arrow */}
            <div className="flex items-center pr-4 flex-shrink-0">
                <LuArrowRight
                    size={16}
                    className="transition-transform duration-200 group-hover:translate-x-1"
                    style={{ color: subtitleColor }}
                />
            </div>
        </Link>
    );
}