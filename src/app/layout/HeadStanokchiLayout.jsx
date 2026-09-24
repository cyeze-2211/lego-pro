// app/layout/HeadStanokchiLayout.jsx
import { useState, useEffect, Suspense, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { Menu, Moon, Sun, ChevronDown, User, LogOut, UserCog, ArrowLeft } from 'lucide-react';
import { useAppTheme } from '../../theme/tokens';
import { useGetUserByIdQuery } from '../../store/services/user.api';
import { useAppDispatch } from '../../store/hooks';
import { logoutUser } from '../../store/slices/auth.slice';
import { useLogoutMutation } from '../../store/services/auth.api';
import HeadStanokchiSidebar from '../../Components/Stanokchi/HeadStanokchiSidebar';
import { useStanokchiMode } from '../../context/StanokchiModeContext';
import Loading from '../../Components/Other/UI/Loadings/Loading';
import { HeaderProvider, useHeaderContext } from '../../context/HeaderContext';

// Inner layout — HeaderProvider ichida ishlaydi
function HeadStanokchiLayoutInner() {
    const { isDark, toggleColorMode } = useAppTheme();
    const { switchToWorker } = useStanokchiMode();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const userId = Cookies.get('user_id');
    const { pageHeader } = useHeaderContext();

    const { data: user } = useGetUserByIdQuery(userId, { skip: !userId });
    const [logoutApi] = useLogoutMutation();

    // Sidebar state — same pattern as MainLayout
    const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024);
    const [mobileOpen, setMobileOpen] = useState(false);

    // Profile dropdown
    const [openMenu, setOpenMenu] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const onResize = () => {
            if (window.innerWidth >= 1024) setMobileOpen(false);
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpenMenu(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const toggleSidebar = () => {
        if (window.innerWidth < 1024) {
            setMobileOpen((p) => !p);
        } else {
            setSidebarOpen((p) => !p);
        }
    };

    const isMobile = window.innerWidth < 1024;
    const effectiveSidebarOpen = isMobile ? false : sidebarOpen;

    const handleLogout = async () => {
        try { await logoutApi().unwrap(); } catch { /* ignore */ }
        dispatch(logoutUser());
        localStorage.clear();
        navigate('/login');
    };

    const headerBg = isDark
        ? 'rgba(14,21,36,0.92)'
        : 'rgba(255,255,255,0.92)';
    const headerBorder = isDark
        ? '1px solid rgba(255,255,255,0.07)'
        : '1px solid rgba(226,232,240,0.8)';

    return (
        <div className={`min-h-screen w-full transition-colors duration-300 ${isDark ? 'theme-dark' : 'theme-light'}`}>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                    aria-hidden="true"
                />
            )}

            <HeadStanokchiSidebar
                open={effectiveSidebarOpen}
                mobileOpen={mobileOpen}
                onMobileClose={() => setMobileOpen(false)}
            />

            <div
                className={`relative min-h-screen transition-all duration-300 ${
                    effectiveSidebarOpen ? 'lg:pl-[220px]' : 'lg:pl-[88px]'
                }`}
            >
                {/* ── Header ── */}
                <header
                    className="fixed top-0 right-0 z-20 h-[72px] transition-all duration-300"
                    style={{
                        left: isMobile ? 0 : (effectiveSidebarOpen ? 220 : 88),
                        background: headerBg,
                        backdropFilter: 'blur(12px)',
                        borderBottom: headerBorder,
                    }}
                >
                    <div className="flex h-full items-center justify-between px-4 lg:px-3">
                        {/* Left: hamburger + sarlavha */}
                        <div className="flex items-center gap-3 min-w-0">
                            <button
                                type="button"
                                onClick={toggleSidebar}
                                className={`flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-lg border transition-all ${
                                    isDark
                                        ? 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
                                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                                }`}
                                aria-label="Sidebar"
                            >
                                <Menu className="h-4 w-4" />
                            </button>

                            {pageHeader ? (
                                /* Sahifadan sarlavha kelgan — back button + title */
                                <div className="flex items-center gap-2.5 min-w-0">
                                    {pageHeader.backTo && (
                                        <button
                                            type="button"
                                            onClick={() => navigate(pageHeader.backTo)}
                                            className={`flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-200 hover:scale-105 ${
                                                isDark
                                                    ? 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
                                                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                            }`}
                                            aria-label="Orqaga"
                                        >
                                            <ArrowLeft className="h-4 w-4" />
                                        </button>
                                    )}
                                    {pageHeader.backTo && (
                                        <span
                                            className="flex-shrink-0 w-px h-5"
                                            style={{
                                                background: isDark
                                                    ? 'rgba(255,255,255,0.1)'
                                                    : 'rgba(0,0,0,0.1)',
                                            }}
                                        />
                                    )}
                                    <div className="min-w-0">
                                        <span
                                            className="block text-sm font-bold truncate"
                                            style={{ color: isDark ? '#F1F5F9' : '#0F172A' }}
                                        >
                                            {pageHeader.title}
                                        </span>
                                        {pageHeader.subtitle && (
                                            <span
                                                className="block text-xs truncate"
                                                style={{ color: isDark ? '#94A3B8' : '#64748B' }}
                                            >
                                                {pageHeader.subtitle}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                /* Default: panel nomi */
                                <span
                                    className="text-base font-bold tracking-wide hidden sm:block"
                                    style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}
                                >
                                    Stanokchi Panel
                                </span>
                            )}
                        </div>

                        {/* Right: theme + profile */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                            {/* Dark/light toggle */}
                            <button
                                type="button"
                                onClick={toggleColorMode}
                                className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-all ${
                                    isDark
                                        ? 'border-slate-700 bg-slate-900 text-amber-400 hover:bg-slate-800'
                                        : 'border-slate-200 bg-white text-amber-600 hover:bg-slate-100'
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
                                            ? 'border-amber-400/20 bg-slate-900 text-slate-100 hover:border-amber-400/50 hover:bg-slate-800'
                                            : 'border-slate-200 bg-white text-slate-800 hover:border-amber-300 hover:bg-amber-50'
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
                                        className={`h-4 w-4 transition-transform duration-200 ${openMenu ? 'rotate-180' : ''}`}
                                    />
                                </button>

                                {openMenu && (
                                    <div
                                        role="menu"
                                        className={`absolute right-0 top-[calc(100%+10px)] z-50 w-52 overflow-hidden rounded-xl border p-1.5 shadow-xl ${
                                            isDark
                                                ? 'border-slate-700 bg-[#111827] text-slate-100 shadow-black/30'
                                                : 'border-slate-200 bg-white text-slate-800 shadow-slate-200/70'
                                        }`}
                                    >
                                        {/* Switch to worker */}
                                        <button
                                            type="button"
                                            role="menuitem"
                                            onClick={() => { switchToWorker(); setOpenMenu(false); }}
                                            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                                                isDark
                                                    ? 'text-amber-400 hover:bg-amber-400/10'
                                                    : 'text-amber-700 hover:bg-amber-50'
                                            }`}
                                        >
                                            <UserCog className="h-4 w-4" />
                                            <span>Xodim rejimi</span>
                                        </button>

                                        <div style={{ height: 1, margin: '4px 0', background: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }} />

                                        {/* Logout */}
                                        <button
                                            type="button"
                                            role="menuitem"
                                            onClick={handleLogout}
                                            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                                                isDark
                                                    ? 'text-red-400 hover:bg-red-400/10'
                                                    : 'text-red-600 hover:bg-red-50'
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

                {/* ── Main content ── */}
                <main className="px-3 pb-8 pt-[88px] sm:px-4 md:px-6">
                    <Suspense fallback={<Loading />}>
                        <Outlet />
                    </Suspense>
                </main>
            </div>
        </div>
    );
}

export default function HeadStanokchiLayout() {
    return (
        <HeaderProvider>
            <HeadStanokchiLayoutInner />
        </HeaderProvider>
    );
}
