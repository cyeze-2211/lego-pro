import React, { useState, useRef, useEffect } from "react";
import { LogOut, User, ChevronDown, Moon, Sun, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppTheme } from "../../../theme/tokens";
import { useAppDispatch } from "../../../store/hooks";
import { logout } from "../../../store/slices/auth.slice";

export default function AdminHeader({ 
    active, 
    sidebarOpen, 
    user,        // данные пользователя из API
    isLoading,   // флаг загрузки
    ...props 
}) {
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
        <header className={`header fixed top-0 right-0 z-30 h-[72px] transition-all duration-300 left-0 ${sidebarOpen ? "lg:header-open" : "lg:header-collapsed"} ${isDark ? "theme-dark" : "theme-light"}`}>
            <div className="flex h-full items-center justify-between gap-4 px-5">
                <div className="flex items-center gap-3">
                    <button
                        onClick={active}
                        className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-all duration-200 ${
                            isDark
                                ? "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                        }`}
                        aria-label="Toggle sidebar"
                    >
                        <Menu className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex items-center gap-3">
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
                            onClick={() => setOpenMenu((isOpen) => !isOpen)}
                            className={`group flex items-center gap-2.5 rounded-xl border px-2.5 py-1.5 text-sm font-semibold transition-all duration-200 ${
                                isDark
                                    ? "border-amber-400/20 bg-slate-900 text-slate-100 hover:border-amber-400/50 hover:bg-slate-800"
                                    : "border-slate-200 bg-white text-slate-800 hover:border-amber-300 hover:bg-amber-50"
                            }`}
                            aria-expanded={openMenu}
                            aria-haspopup="menu"
                        >
                            <div className="profile-badge flex h-8 w-8 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105">
                                <User className="h-4 w-4" />
                            </div>
                            <span>Profile</span>
                            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${openMenu ? "rotate-180" : ""}`} />
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
                                    onClick={() => {
                                        setOpenMenu(false);
                                        navigate("/profile");
                                    }}
                                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                                        isDark ? "hover:bg-slate-800" : "hover:bg-amber-50"
                                    }`}
                                >
                                    <User className="h-4 w-4 text-amber-500" />
                                    <span>Profile</span>
                                </button>
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