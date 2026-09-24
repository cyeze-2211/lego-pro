// Components/Stanokchi/HeadStanokchiSidebar.jsx
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Cog, X, UserCog } from 'lucide-react';
import { useAppTheme } from '../../theme/tokens';
import { useStanokchiMode } from '../../context/StanokchiModeContext';
import YellowLogo from '../../Images/Yellow Unified Lego Outlined.svg';

const NAV_ITEMS = [
    { label: 'Dashboard',   path: '/stanokchi',           icon: LayoutDashboard },
    { label: 'Stanoklar',   path: '/stanokchi/machines',  icon: Cog },
];

export default function HeadStanokchiSidebar({ open, mobileOpen, onMobileClose }) {
    const { isDark } = useAppTheme();
    const { switchToWorker } = useStanokchiMode();

    const handleSwitchToWorker = () => {
        switchToWorker();
        if (onMobileClose) onMobileClose();
    };

    const showLabels = open || mobileOpen;

    const sidebarContent = (
        <div className="flex h-full flex-col px-3 py-4">
            {/* Logo */}
            <div className="mb-4 pb-4 flex items-center justify-center">
                <div
                    className="flex items-center justify-center px-2 py-1.5 rounded-xl border"
                    style={{
                        background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(15,23,42,0.04)',
                        borderColor: isDark ? 'rgba(250,204,21,0.2)' : 'rgba(148,163,184,0.2)',
                    }}
                >
                    <img src={YellowLogo} alt="Logo" className="h-14 w-14 object-contain" />
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 space-y-1.5">
                {NAV_ITEMS.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/stanokchi'}
                        onClick={onMobileClose}
                        title={!showLabels ? item.label : undefined}
                        className={({ isActive }) =>
                            `flex items-center ${showLabels ? 'justify-start gap-3' : 'justify-center'} rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                                isActive
                                    ? 'bg-amber-400 text-slate-900'
                                    : isDark
                                        ? 'text-slate-200 hover:bg-slate-700/50'
                                        : 'text-slate-700 hover:bg-slate-200'
                            }`
                        }
                    >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                            <item.icon className="h-5 w-5" />
                        </span>
                        {showLabels && <span className="truncate">{item.label}</span>}
                    </NavLink>
                ))}
            </nav>

            {/* Switch to worker button */}
            <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : '#E2E8F0'}` }}>
                <button
                    type="button"
                    onClick={handleSwitchToWorker}
                    title={!showLabels ? 'Xodim rejimi' : undefined}
                    className={`flex w-full items-center ${showLabels ? 'justify-start gap-3' : 'justify-center'} rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150`}
                    style={{
                        background: isDark ? 'rgba(250,204,21,0.08)' : '#FFFBEB',
                        color: isDark ? '#FACC15' : '#92400E',
                        border: `1px solid ${isDark ? 'rgba(250,204,21,0.2)' : '#FDE68A'}`,
                    }}
                >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                        <UserCog className="h-5 w-5" />
                    </span>
                    {showLabels && <span className="truncate">Xodim rejimi</span>}
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop */}
            <aside
                className={`fixed left-0 top-0 bottom-0 z-40 hidden lg:flex flex-col transition-all duration-300 ${
                    isDark ? 'theme-dark' : 'theme-light'
                } ${open ? 'w-[220px]' : 'w-[88px]'}`}
                style={{
                    borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : '#E2E8F0'}`,
                }}
            >
                {sidebarContent}
            </aside>

            {/* Mobile overlay */}
            <aside
                className={`fixed left-0 top-0 bottom-0 z-40 flex flex-col w-[260px] lg:hidden transition-transform duration-300 ease-in-out ${
                    isDark ? 'theme-dark' : 'theme-light'
                } ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
                style={{
                    borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : '#E2E8F0'}`,
                }}
            >
                <button
                    type="button"
                    onClick={onMobileClose}
                    className={`absolute top-4 right-3 flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                        isDark
                            ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                            : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    aria-label="Yopish"
                >
                    <X className="h-4 w-4" />
                </button>
                {sidebarContent}
            </aside>
        </>
    );
}
