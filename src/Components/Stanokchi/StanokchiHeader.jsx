import { useState, useRef, useEffect } from "react";
import { LogOut, User, ChevronDown, Moon, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppTheme } from "../../theme/tokens";
import { useAppDispatch } from "../../store/hooks";
import { logout } from "../../store/slices/auth.slice";

export default function StanokchiHeader({ user }) {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { isDark, toggleColorMode } = useAppTheme();

    const [isHovered, setIsHovered] = useState(false);
    const [openMenu, setOpenMenu] = useState(false);
    const menuRef = useRef(null);

    const handleLogout = () => {
        dispatch(logout());
        localStorage.clear();
        navigate("/login");
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpenMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-30 h-[72px] transition-all duration-300 ${
                isDark ? "theme-dark" : "theme-light"
            }`}
            style={{
                background: isDark
                    ? "rgba(14, 21, 36, 0.92)"
                    : "rgba(255, 255, 255, 0.92)",
                backdropFilter: "blur(12px)",
                borderBottom: isDark
                    ? "1px solid rgba(255,255,255,0.07)"
                    : "1px solid rgba(226,232,240,0.8)",
            }}
        >
            <div className="flex h-full items-center justify-between px-5 max-w-7xl mx-auto">
                {/* Logo / Title */}
                <div className="flex items-center gap-3">
                    <div
                        className="flex items-center justify-center w-9 h-9 rounded-xl"
                        style={{ background: "#FACC15" }}
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#0F172A"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="12" cy="12" r="3" />
                            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
                        </svg>
                    </div>
                    <span
                        className="text-base font-bold tracking-wide"
                        style={{ color: isDark ? "#F8FAFC" : "#0F172A" }}
                    >
                        Stanokchi Panel
                    </span>
                </div>

                {/* Right actions */}
                <div className="flex items-center gap-3">
                    {/* Dark / Light toggle */}
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
                        {isDark ? (
                            <Sun className="h-4 w-4" />
                        ) : (
                            <Moon className="h-4 w-4" />
                        )}
                    </button>

                    {/* Profile dropdown */}
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setOpenMenu((prev) => !prev)}
                            className={`group flex items-center gap-2.5 rounded-xl border px-2.5 py-1.5 text-sm font-semibold transition-all duration-200 ${
                                isDark
                                    ? "border-amber-400/20 bg-slate-900 text-slate-100 hover:border-amber-400/50 hover:bg-slate-800"
                                    : "border-slate-200 bg-white text-slate-800 hover:border-amber-300 hover:bg-amber-50"
                            }`}
                            aria-expanded={openMenu}
                            aria-haspopup="menu"
                        >
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/20 transition-transform duration-200 group-hover:scale-105">
                                <User className="h-4 w-4 text-amber-500" />
                            </div>
                            {user?.fullName && (
                                <span className="hidden sm:block max-w-[120px] truncate">
                                    {user.fullName}
                                </span>
                            )}
                            <ChevronDown
                                className={`h-4 w-4 transition-transform duration-200 ${
                                    openMenu ? "rotate-180" : ""
                                }`}
                            />
                        </button>

                        {openMenu && (
                            <div
                                role="menu"
                                className={`absolute right-0 top-[calc(100%+10px)] z-50 w-48 overflow-hidden rounded-xl border p-1.5 shadow-xl ${
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
    );
}
