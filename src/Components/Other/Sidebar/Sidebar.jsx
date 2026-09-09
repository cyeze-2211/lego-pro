import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown, X } from "lucide-react";
import { useAppTheme } from "../../../theme/tokens";
import YellowLogo from "../../../Images/Yellow Unified Lego Outlined.svg";
import { Box } from "@chakra-ui/react";
import { SIDEBAR_GROUPS, STAFF_SIDEBAR_GROUPS, RAW_STAFF_SIDEBAR_GROUPS } from "../../../app/navigation/sidebar.config";
import { useAppSelector } from "../../../store/hooks";
import { PRODUCT_WAREHOUSE_ROLES, RAW_WAREHOUSE_ROLES } from "../../../app/permissions/roles";

export default function Sidebar({ open, mobileOpen, onMobileClose }) {
    const { isDark } = useAppTheme();
    const { pathname } = useLocation();
    const role = useAppSelector((state) => state.auth.role);

    const isProductStaff = PRODUCT_WAREHOUSE_ROLES.includes(role);
    const isRawStaff     = RAW_WAREHOUSE_ROLES.includes(role);
    const groups = isProductStaff
        ? STAFF_SIDEBAR_GROUPS
        : isRawStaff
        ? RAW_STAFF_SIDEBAR_GROUPS
        : SIDEBAR_GROUPS;

    const [expandedGroups, setExpandedGroups] = useState(() =>
        groups.map((g) => g.label).filter((l) => l !== "Asosiy")
    );

    useEffect(() => {
        const activeGroup = groups.find((group) =>
            group.items.some((item) => item.path === pathname)
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
            title={!open ? item.label : undefined}
            onClick={onMobileClose}
            className={({ isActive }) =>
                `flex items-center ${open || mobileOpen ? "justify-start" : "justify-center"} gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                    isActive
                        ? "bg-amber-400 text-slate-900 dark:bg-amber-400 dark:text-slate-900 hover:bg-amber-500 hover:dark:bg-amber-500"
                        : "hover:bg-slate-200 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200"
                }`
            }
        >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-transparent">
                <item.icon className="h-5 w-5" />
            </span>
            {(open || mobileOpen) && <span className="truncate">{item.label}</span>}
        </NavLink>
    );

    // On mobile the sidebar slides in as a full panel (mobileOpen controls visibility)
    // On desktop it collapses to icon-only mode (open prop)
    const showLabels = open || mobileOpen;

    return (
        <>
            {/* ── Desktop sidebar ─────────────────────────────────────────── */}
            <aside
                className={`sidebar fixed left-0 top-0 bottom-0 z-40 hidden lg:flex flex-col transition-all duration-300 ${
                    isDark ? "theme-dark" : "theme-light"
                } ${open ? "w-[220px]" : "w-[88px]"}`}
            >
                <SidebarContent
                    groups={groups}
                    showLabels={open}
                    expandedGroups={expandedGroups}
                    toggleGroup={toggleGroup}
                    pathname={pathname}
                    renderLink={renderLink}
                    isDark={isDark}
                    open={open}
                    onMobileClose={onMobileClose}
                />
            </aside>

            {/* ── Mobile sidebar (slide-in overlay) ───────────────────────── */}
            <aside
                className={`sidebar fixed left-0 top-0 bottom-0 z-40 flex flex-col w-[260px] lg:hidden transition-transform duration-300 ease-in-out ${
                    isDark ? "theme-dark" : "theme-light"
                } ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
            >
                {/* Close button on mobile */}
                <button
                    type="button"
                    onClick={onMobileClose}
                    className={`absolute top-4 right-3 flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                        isDark
                            ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                            : "border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                    aria-label="Yopish"
                >
                    <X className="h-4 w-4" />
                </button>

                <SidebarContent
                    groups={groups}
                    showLabels={true}
                    expandedGroups={expandedGroups}
                    toggleGroup={toggleGroup}
                    pathname={pathname}
                    renderLink={renderLink}
                    isDark={isDark}
                    open={true}
                    onMobileClose={onMobileClose}
                />
            </aside>
        </>
    );
}

function SidebarContent({ groups, showLabels, expandedGroups, toggleGroup, pathname, renderLink, isDark, open }) {
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
                        borderColor={isDark ? "rgba(250, 204, 21, 0.2)" : "rgba(148, 163, 184, 0.2)"}
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
                        const isBasic = group.label === "Asosiy";
                        const expanded = expandedGroups.includes(group.label);
                        const hasActiveItem = group.items.some((item) => item.path === pathname);

                        return (
                            <div key={group.label} className={isBasic ? "" : "pt-2"}>
                                {showLabels && !isBasic && (
                                    <button
                                        type="button"
                                        onClick={() => toggleGroup(group.label)}
                                        aria-expanded={expanded}
                                        className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                                            hasActiveItem
                                                ? "bg-amber-400/10 text-amber-600 dark:text-amber-300"
                                                : "text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-200"
                                        }`}
                                    >
                                        <span>{group.label}</span>
                                        <span
                                            className={`flex h-6 w-6 items-center justify-center rounded-lg transition-all duration-300 ${
                                                expanded
                                                    ? "bg-amber-400 shadow-sm"
                                                    : "group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
                                            }`}
                                        >
                                            <ChevronDown
                                                className={`h-4 w-4 transition-transform duration-300 ease-out ${
                                                    expanded ? "rotate-180 text-slate-950" : "text-slate-500 dark:text-slate-300"
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
                                        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                                            expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                                        }`}
                                    >
                                        <div className="min-h-0 overflow-hidden">
                                            <div
                                                className={`space-y-1.5 px-1 pt-1 transition-all duration-300 ease-out ${
                                                    expanded ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
                                                }`}
                                            >
                                                {group.items.map(renderLink)}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}

Sidebar.propTypes = {
    open: PropTypes.bool.isRequired,
    mobileOpen: PropTypes.bool,
    onMobileClose: PropTypes.func,
};

Sidebar.defaultProps = {
    mobileOpen: false,
    onMobileClose: () => {},
};
