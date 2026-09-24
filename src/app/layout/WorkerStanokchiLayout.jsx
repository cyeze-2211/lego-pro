// app/layout/WorkerStanokchiLayout.jsx
import { Suspense, useRef, useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { Moon, Sun, LogOut, ChevronDown, User, ShieldCheck } from "lucide-react";
import { useAppTheme } from "../../theme/tokens";
import { useGetUserByIdQuery } from "../../store/services/user.api";
import { useAppDispatch } from "../../store/hooks";
import { logoutUser } from "../../store/slices/auth.slice";
import { useLogoutMutation } from "../../store/services/auth.api";
import { useStanokchiMode } from "../../context/StanokchiModeContext";
import Loading from "../../Components/Other/UI/Loadings/Loading";

export default function WorkerStanokchiLayout() {
    const { isDark, toggleColorMode } = useAppTheme();
    const { resetMode } = useStanokchiMode();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const userId = Cookies.get("user_id");

    const { data: user } = useGetUserByIdQuery(userId, { skip: !userId });
    const [logoutApi] = useLogoutMutation();

    const [openMenu, setOpenMenu] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpenMenu(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleLogout = async () => {
        try { await logoutApi().unwrap(); } catch { /* ignore */ }
        dispatch(logoutUser());
        resetMode();
        localStorage.clear();
        navigate("/login");
    };

    const headerBg = isDark
        ? "rgba(14,21,36,0.95)"
        : "rgba(255,255,255,0.95)";
    const headerBorder = isDark
        ? "1px solid rgba(255,255,255,0.07)"
        : "1px solid rgba(226,232,240,0.8)";

    return (
        <div
            className={`min-h-screen w-full transition-colors duration-300 ${
                isDark ? "theme-dark" : "theme-light"
            }`}
        >
            {/* ── Worker Header ── */}
            <header
                className="fixed top-0 left-0 right-0 z-30 h-[72px]"
                style={{
                    background: headerBg,
                    backdropFilter: "blur(12px)",
                    borderBottom: headerBorder,
                }}
            >
                <div className="flex h-full items-center justify-between px-5 max-w-7xl mx-auto">
                    {/* Logo / title */}
                    <div className="flex items-center gap-3">
                        <div
                            className="flex items-center justify-center w-9 h-9 rounded-xl"
                            style={{ background: "#FACC15" }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                                stroke="#0F172A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="3" />
                                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
                            </svg>
                        </div>
                        <span
                            className="text-base font-bold tracking-wide"
                            style={{ color: isDark ? "#F8FAFC" : "#0F172A" }}
                        >
                            Xodim Panel
                        </span>
                    </div>

                    {/* Right actions */}
                    <div className="flex items-center gap-3">
                        {/* Theme toggle */}
                        <button
                            type="button"
                            onClick={toggleColorMode}
                            className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-all ${
                                isDark
                                    ? "border-slate-700 bg-slate-900 text-amber-400 hover:bg-slate-800"
                                    : "border-slate-200 bg-white text-amber-600 hover:bg-slate-100"
                            }`}
                            title={isDark ? "Yorug'lik mavzusi" : "Qorong'i mavzu"}
                        >
                            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        </button>

                        {/* Profile dropdown */}
                        <div className="relative" ref={menuRef}>
                            <button
                                type="button"
                                onClick={() => setOpenMenu((p) => !p)}
                                className={`group flex items-center gap-2.5 rounded-xl border px-2.5 py-1.5 text-sm font-semibold transition-all ${
                                    isDark
                                        ? "border-amber-400/20 bg-slate-900 text-slate-100 hover:border-amber-400/50 hover:bg-slate-800"
                                        : "border-slate-200 bg-white text-slate-800 hover:border-amber-300 hover:bg-amber-50"
                                }`}
                                aria-expanded={openMenu}
                                aria-haspopup="menu"
                            >
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/20">
                                    <User className="h-4 w-4 text-amber-500" />
                                </div>
                                {user?.fullName && (
                                    <span className="hidden sm:block max-w-[120px] truncate">
                                        {user.fullName}
                                    </span>
                                )}
                                <ChevronDown
                                    className={`h-4 w-4 transition-transform duration-200 ${openMenu ? "rotate-180" : ""}`}
                                />
                            </button>

                            {openMenu && (
                                <div
                                    role="menu"
                                    className={`absolute right-0 top-[calc(100%+10px)] z-50 w-52 overflow-hidden rounded-xl border p-1.5 shadow-xl ${
                                        isDark
                                            ? "border-slate-700 bg-[#111827] text-slate-100 shadow-black/30"
                                            : "border-slate-200 bg-white text-slate-800 shadow-slate-200/70"
                                    }`}
                                >
                                    {/* Logout only — to switch to head the user must re-login */}
                                    <button
                                        type="button"
                                        role="menuitem"
                                        onClick={handleLogout}
                                        className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                                            isDark
                                                ? "text-red-400 hover:bg-red-400/10"
                                                : "text-red-600 hover:bg-red-50"
                                        }`}
                                    >
                                        <LogOut className="h-4 w-4" />
                                        <span>Chiqish</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Main ── */}
            <main className="pt-[88px] pb-8 px-3 sm:px-4 md:px-6 max-w-7xl mx-auto">
                <Suspense fallback={<Loading />}>
                    <Outlet />
                </Suspense>
            </main>
        </div>
    );
}
