import { useState, useRef, useEffect } from "react";
import { LogOut, User, ChevronDown, Moon, Sun, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppTheme } from "../../theme/tokens";
import { useAppDispatch } from "../../store/hooks";
import { logoutUser } from "../../store/slices/auth.slice";
import { useLogoutMutation } from "../../store/services/auth.api";
import { useHeaderContext } from "../../context/HeaderContext";

export default function MixerHeader({ user }) {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { isDark, toggleColorMode } = useAppTheme();
    const [logoutApi] = useLogoutMutation();
    const { pageHeader } = useHeaderContext();

    const [isHovered, setIsHovered] = useState(false);
    const [openMenu, setOpenMenu] = useState(false);
    const menuRef = useRef(null);

    const handleLogout = async () => {
        try { await logoutApi().unwrap(); } catch {}
        dispatch(logoutUser());
        localStorage.clear();
        navigate("/login");
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenu(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-30 h-[72px] transition-all duration-300 ${isDark ? "theme-dark" : "theme-light"}`}
            style={{
                background: isDark ? "rgba(14,21,36,0.92)" : "rgba(255,255,255,0.92)",
                backdropFilter: "blur(12px)",
                borderBottom: isDark
                    ? "1px solid rgba(255,255,255,0.07)"
                    : "1px solid rgba(226,232,240,0.8)",
            }}
        >
            <div className="flex h-full items-center justify-between gap-4 px-5 max-w-7xl mx-auto">

                {/* ── Chap: logo yoki back + sarlavha ── */}
                <div className="flex items-center gap-3 min-w-0">
                    {pageHeader ? (
                        /* Faqat back button */
                        <>
                            {pageHeader.backTo && (
                                <button
                                    onClick={() => navigate(pageHeader.backTo)}
                                    className={`flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200 hover:scale-105 ${
                                        isDark
                                            ? "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                                    }`}
                                    aria-label="Orqaga"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </button>
                            )}
                        </>
                    ) : (
                        /* Default: logo + panel nomi */
                        <>
                            <div
                                className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0"
                                style={{ background: "#FACC15" }}
                            >
                                {/* Flask icon */}
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                                    stroke="#0F172A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 3h6M9 3v7l-4 9a1 1 0 0 0 .93 1.37h12.14A1 1 0 0 0 19 19l-4-9V3" />
                                </svg>
                            </div>
                            <span className="text-base font-bold" style={{ color: isDark ? "#F8FAFC" : "#0F172A" }}>
                                Mixer Panel
                            </span>
                        </>
                    )}
                </div>

                {/* ── O'ng: dark toggle + profile ── */}
                <div className="flex items-center gap-3 flex-shrink-0">
                    <button
                        onClick={toggleColorMode}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-all duration-200 ${
                            isDark
                                ? "border-slate-700 bg-slate-900 text-amber-400 hover:bg-slate-800"
                                : "border-slate-200 bg-white text-amber-600 hover:bg-slate-100"
                        } ${isHovered ? "scale-[1.03]" : ""}`}
                        title={isDark ? "Yorug'lik mavzusi" : "Qorong'i mavzu"}
                    >
                        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </button>

                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setOpenMenu((p) => !p)}
                            className={`group flex items-center gap-2.5 rounded-xl border px-2.5 py-1.5 text-sm font-semibold transition-all duration-200 ${
                                isDark
                                    ? "border-amber-400/20 bg-slate-900 text-slate-100 hover:border-amber-400/50 hover:bg-slate-800"
                                    : "border-slate-200 bg-white text-slate-800 hover:border-amber-300 hover:bg-amber-50"
                            }`}
                            aria-expanded={openMenu}
                            aria-haspopup="menu"
                        >
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/20 group-hover:scale-105 transition-transform">
                                <User className="h-4 w-4 text-amber-500" />
                            </div>
                            {user?.fullName && (
                                <span className="hidden sm:block max-w-[110px] truncate">{user.fullName}</span>
                            )}
                            <ChevronDown className={`h-4 w-4 transition-transform ${openMenu ? "rotate-180" : ""}`} />
                        </button>

                        {openMenu && (
                            <div
                                role="menu"
                                className={`absolute right-0 top-[calc(100%+10px)] z-50 w-44 overflow-hidden rounded-xl border p-1.5 shadow-xl ${
                                    isDark
                                        ? "border-slate-700 bg-[#111827] text-slate-100 shadow-black/30"
                                        : "border-slate-200 bg-white text-slate-800 shadow-slate-200/70"
                                }`}
                            >
                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={handleLogout}
                                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                                        isDark ? "text-red-400 hover:bg-red-400/10" : "text-red-600 hover:bg-red-50"
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
    );
}
