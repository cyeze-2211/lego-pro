// app/layout/WorkerStanokchiLayout.jsx — xodim (kiosk) rejimi: ixcham yuqori panel, qolgan joy stanoklarga
import { Suspense } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { Moon, Sun, LogOut } from "lucide-react";
import FullscreenButton from "../../Components/ui/FullscreenButton";
import { useAppTheme } from "../../theme/tokens";
import { clearStorageKeepingPreferences } from "../../theme/preferences";
import { useGetUserByIdQuery } from "../../store/services/user.api";
import { useAppDispatch } from "../../store/hooks";
import { logoutUser } from "../../store/slices/auth.slice";
import { useLogoutMutation } from "../../store/services/auth.api";
import { useStanokchiMode } from "../../context/StanokchiModeContext";
import Loading from "../../Components/Other/UI/Loadings/Loading";

export default function WorkerStanokchiLayout() {
    const { isDark, toggleColorMode, cardBg, cardBorder, textColor, subtitleColor } = useAppTheme();
    const { resetMode } = useStanokchiMode();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const userId = Cookies.get("user_id");
    const { data: user } = useGetUserByIdQuery(userId, { skip: !userId });
    const [logoutApi] = useLogoutMutation();

    const handleLogout = async () => {
        if (!window.confirm("Tizimdan chiqishni tasdiqlaysizmi?")) return;
        try { await logoutApi().unwrap(); } catch { /* ignore */ }
        dispatch(logoutUser());
        resetMode();
        clearStorageKeepingPreferences();
        navigate("/login");
    };

    const iconBtn = `flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-all ${
        isDark ? "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
    }`;

    return (
        <div className={`flex h-[100dvh] w-full flex-col overflow-hidden transition-colors duration-300 ${isDark ? "theme-dark" : "theme-light"}`}>
            {/* ── Ixcham panel: faqat kerakli narsalar ── */}
            <div
                className="flex h-12 shrink-0 items-center justify-between gap-2 border-b px-2 sm:px-3"
                style={{ background: isDark ? "rgba(14,21,36,0.95)" : "rgba(255,255,255,0.95)", borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(226,232,240,0.9)" }}
            >
                <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: "rgb(var(--accent-400))" }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
                        </svg>
                    </span>
                    <span className="truncate text-sm font-bold" style={{ color: textColor }}>Stanoklar</span>
                    {user?.fullName && <span className="hidden truncate text-xs sm:block" style={{ color: subtitleColor }}>· {user.fullName}</span>}
                </div>

                <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                    <button type="button" onClick={toggleColorMode} className={iconBtn} title={isDark ? "Yorug'lik mavzusi" : "Qorong'i mavzu"}>
                        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </button>
                    {/* To‘liq ekran — Esc qulflanadi, tasodifan chiqib ketilmaydi */}
                    <FullscreenButton className={iconBtn} lockKeyboard />
                    <button type="button" onClick={handleLogout} className={`${iconBtn} ${isDark ? "text-red-400 hover:bg-red-400/10" : "text-red-600 hover:bg-red-50"}`} title="Chiqish" aria-label="Chiqish">
                        <LogOut className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* ── Asosiy joy: stanoklar bitta ekranga sig‘adi ── */}
            <main className="min-h-0 flex-1 overflow-auto p-2 sm:p-3">
                <Suspense fallback={<Loading />}>
                    <Outlet />
                </Suspense>
            </main>
        </div>
    );
}
