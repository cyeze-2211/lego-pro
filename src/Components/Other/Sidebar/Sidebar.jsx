import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown, X } from "lucide-react";
import { useAppTheme } from "../../../theme/tokens";
import YellowLogo from "../../../Images/Yellow Unified Lego Outlined.svg";
import { Box } from "@chakra-ui/react";
import { SIDEBAR_GROUPS, WAREHOUSE_SIDEBAR_GROUPS, ZAYAVKACHI_SIDEBAR_GROUPS, BUXGALTER_SIDEBAR_GROUPS, KASSIR_SIDEBAR_GROUPS, XIMIK_SIDEBAR_GROUPS, STANOKCHI_SIDEBAR_GROUPS } from "../../../app/navigation/sidebar.config";
import { useAppSelector } from "../../../store/hooks";
import { ROLES, WAREHOUSE_ROLES, ZAYAVKACHI_ROLES, BUXGALTER_ROLES, KASSIR_ROLES, XIMIK_ROLES } from "../../../app/permissions/roles";

const ACTIVE_LINK_CSS = `
    html body aside.sidebar a.sidebar-link-active,
    html body aside.sidebar a.sidebar-link-active *,
    html body aside.sidebar.theme-dark a.sidebar-link-active,
    html body aside.sidebar.theme-dark a.sidebar-link-active *,
    html body aside.sidebar.theme-light a.sidebar-link-active,
    html body aside.sidebar.theme-light a.sidebar-link-active * {
        color: #000000 !important;
        stroke: #000000 !important;
    }
`;

const BLACK = { color: "#000000" };

export default function Sidebar({ open, mobileOpen, onMobileClose, footer }) {
    const { isDark } = useAppTheme();
    const { pathname } = useLocation();
    const role = useAppSelector((state) => state.auth.role);

    const isWarehouseStaff = WAREHOUSE_ROLES.includes(role);
    const isZayavkachi = ZAYAVKACHI_ROLES.includes(role);
    const isBuxgalter = BUXGALTER_ROLES.includes(role);
    const isKassir = KASSIR_ROLES.includes(role);
    const isXimik = XIMIK_ROLES.includes(role);
    const isStanokchi = role === ROLES.STANOKCHI;
    const groups = isStanokchi
        ? STANOKCHI_SIDEBAR_GROUPS
        : isWarehouseStaff
        ? WAREHOUSE_SIDEBAR_GROUPS
        : isZayavkachi
            ? ZAYAVKACHI_SIDEBAR_GROUPS
            : isBuxgalter
                ? BUXGALTER_SIDEBAR_GROUPS
                : isKassir
                    ? KASSIR_SIDEBAR_GROUPS
                    : isXimik
                        ? XIMIK_SIDEBAR_GROUPS
                        : SIDEBAR_GROUPS;

    const [expandedGroups, setExpandedGroups] = useState(() => {
        // Kichik menyular (10 tagacha punkt) — hammasi ochiq; katta menyuda faqat joriy sahifa guruhi ochiq
        const totalItems = groups.reduce((sum, g) => sum + g.items.length, 0);
        if (totalItems <= 10) return groups.map((g) => g.label).filter((l) => l !== "Asosiy");
        const active = groups.find((g) => g.items.some((item) => pathname === item.path || pathname.startsWith(`${item.path}/`)));
        return active && active.label !== "Asosiy" ? [active.label] : [];
    });

    useEffect(() => {
        const activeGroup = groups.find((group) =>
            group.items.some((item) => pathname === item.path || pathname.startsWith(`${item.path}/`))
        );
        if (activeGroup && activeGroup.label !== "Asosiy") {
            setExpandedGroups((prev) =>
                prev.includes(activeGroup.label) ? prev : [...prev, activeGroup.label]
            );
        }
    }, [pathname, groups]);

    const toggleGroup = (label) =>
        setExpandedGroups((prev) =>
            prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]
        );

    const renderLink = (item) => (
        <NavLink
            key={item.path}
            to={item.path}
            end={Boolean(item.exact)}
            title={!open ? item.label : undefined}
            onClick={onMobileClose}
            style={({ isActive }) => (isActive ? BLACK : undefined)}
            className={({ isActive }) =>
                `flex items-center ${open || mobileOpen ? "justify-start" : "justify-center"} gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${isActive
                    ? "sidebar-link-active bg-amber-400 hover:bg-amber-500"
                    : "hover:bg-slate-200 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200"
                }`
            }
        >
            {({ isActive }) => (
                <>
                    <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-transparent"
                        style={isActive ? BLACK : undefined}
                    >
                        <item.icon
                            className="h-5 w-5"
                            color={isActive ? "#000000" : undefined}
                            style={isActive ? BLACK : undefined}
                        />
                    </span>
                    {(open || mobileOpen) && (
                        <span className="truncate" style={isActive ? BLACK : undefined}>
                            {item.label}
                        </span>
                    )}
                </>
            )}
        </NavLink>
    );

    return (
        <>
            <style>{ACTIVE_LINK_CSS}</style>

            {/* ── Desktop sidebar ─────────────────────────────────────────── */}
            <aside
                className={`sidebar fixed left-0 top-0 bottom-0 z-40 hidden lg:flex flex-col transition-all duration-300 ${isDark ? "theme-dark" : "theme-light"
                    } ${open ? "w-[13.75rem]" : "w-[5.5rem]"}`}
            >
                <SidebarContent
                    groups={groups}
                    showLabels={open}
                    expandedGroups={expandedGroups}
                    toggleGroup={toggleGroup}
                    pathname={pathname}
                    renderLink={renderLink}
                    isDark={isDark}
                    footer={footer}
                />
            </aside>

            {/* ── Mobile sidebar (slide-in overlay) ───────────────────────── */}
            <aside
                className={`sidebar fixed left-0 top-0 bottom-0 z-50 flex flex-col w-[17.5rem] max-w-[85vw] lg:hidden transition-transform duration-300 ease-in-out ${isDark ? "theme-dark" : "theme-light"
                    } ${mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`}
            >
                {/* Header qismi: logo + yopish tugmasi */}
                <div className={`flex items-center justify-between px-3 pt-3 pb-1`}>
                    <span className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        Menyu
                    </span>
                    <button
                        type="button"
                        onClick={onMobileClose}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${isDark
                                ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                                : "border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        aria-label="Yopish"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <SidebarContent
                    groups={groups}
                    showLabels={true}
                    expandedGroups={expandedGroups}
                    toggleGroup={toggleGroup}
                    pathname={pathname}
                    renderLink={renderLink}
                    isDark={isDark}
                    footer={footer}
                    onItemClick={onMobileClose}
                />
            </aside>
        </>
    );
}

function SidebarContent({ groups, showLabels, expandedGroups, toggleGroup, pathname, renderLink, isDark, footer, onItemClick }) {
    return (
        <div className="flex h-full flex-col px-3 py-4">
            {/* Logo */}
            <div className="mb-2 pb-4">
                <div className={`flex items-center ${showLabels ? "gap-3 px-1" : "justify-center"}`}>
                    <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        px={2}
                        py={1.5}
                        borderRadius="10px"
                        bg={isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(15, 23, 42, 0.04)"}
                        border="1px solid"
                        borderColor={isDark ? "rgb(var(--accent-400) / 0.2)" : "rgba(148, 163, 184, 0.2)"}
                        w="max-content"
                        mx="auto"
                    >
                        <img src={YellowLogo} alt="PLASTPRO logo" className="h-16 w-16 object-contain" />
                    </Box>
                </div>
            </div>

            {/* Navigation */}
            <div className="sidebar-scrollbar flex-1 overflow-y-auto">
                <nav className="space-y-2">
                    {groups.map((group) => {
                        // "Asosiy" va mustaqil punktlar (masalan, Sozlamalar) sarlavhasiz ko‘rsatiladi
                        const isBasic = group.label === "Asosiy" || group.standalone;
                        const expanded = expandedGroups.includes(group.label);
                        const hasActiveItem = group.items.some((item) => pathname === item.path || pathname.startsWith(`${item.path}/`));

                        return (
                            <div key={group.label} className={isBasic ? "" : "pt-2"}>
                                {showLabels && !isBasic && (
                                    <button
                                        type="button"
                                        onClick={() => toggleGroup(group.label)}
                                        aria-expanded={expanded}
                                        className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${hasActiveItem
                                                ? "bg-amber-400/10 text-amber-600 dark:text-amber-300"
                                                : "text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-200"
                                            }`}
                                    >
                                        <span>{group.label}</span>
                                        <span
                                            className={`flex h-6 w-6 items-center justify-center rounded-lg transition-all duration-300 ${expanded
                                                    ? "bg-amber-400 shadow-sm"
                                                    : "group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
                                                }`}
                                        >
                                            <ChevronDown
                                                className={`h-4 w-4 transition-transform duration-300 ease-out ${expanded ? "rotate-180 text-slate-950" : "text-slate-500 dark:text-slate-300"
                                                    }`}
                                                strokeWidth={2.5}
                                            />
                                        </span>
                                    </button>
                                )}

                                {isBasic || !showLabels ? (
                                    <div className="space-y-1.5">{group.items.map(renderLink)}</div>
                                ) : (
                                    <div
                                        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                                            }`}
                                    >
                                        <div className="min-h-0 overflow-hidden">
                                            <div
                                                className={`space-y-1.5 px-1 pt-1 transition-all duration-300 ease-out ${expanded ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
                                                    }`}
                                            >
                                                {group.sections
                                                    ? group.sections.map((section) => (
                                                        <div key={section.label} className="space-y-1.5 pt-2 first:pt-0">
                                                            <div className={`px-3 pb-1 text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                                                                {section.label}
                                                            </div>
                                                            {section.items.map(renderLink)}
                                                        </div>
                                                    ))
                                                    : group.items.map(renderLink)}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>
            </div>

            {/* Rolga xos pastki blok (masalan, stanokchi uchun «Xodim rejimi») */}
            {footer && (
                <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : '#E2E8F0'}` }}>
                    {footer({ showLabels, onItemClick })}
                </div>
            )}
        </div>
    );
}

const sidebarItemPropType = PropTypes.shape({
    label: PropTypes.string.isRequired,
    path: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
});

SidebarContent.propTypes = {
    groups: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string.isRequired,
        standalone: PropTypes.bool,
        items: PropTypes.arrayOf(sidebarItemPropType).isRequired,
        sections: PropTypes.arrayOf(PropTypes.shape({
            label: PropTypes.string.isRequired,
            items: PropTypes.arrayOf(sidebarItemPropType).isRequired,
        })),
    })).isRequired,
    showLabels: PropTypes.bool.isRequired,
    footer: PropTypes.func,
    onItemClick: PropTypes.func,
    expandedGroups: PropTypes.arrayOf(PropTypes.string).isRequired,
    toggleGroup: PropTypes.func.isRequired,
    pathname: PropTypes.string.isRequired,
    renderLink: PropTypes.func.isRequired,
    isDark: PropTypes.bool.isRequired,
};

Sidebar.propTypes = {
    open: PropTypes.bool.isRequired,
    mobileOpen: PropTypes.bool,
    onMobileClose: PropTypes.func,
    footer: PropTypes.func,
};

Sidebar.defaultProps = {
    mobileOpen: false,
    onMobileClose: () => { },
};