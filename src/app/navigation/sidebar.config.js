// navigation/sidebar.config.js
import { ROLES, PRODUCT_WAREHOUSE_ROLES, RAW_WAREHOUSE_ROLES, ZAYAVKACHI_ROLES } from '../permissions/roles';
import {
    Boxes, ClipboardList, Cog, History, LayoutDashboard, LogIn, LogOut,
    MonitorCog, Package, ReceiptText, UserRound, Users, Wallet, Warehouse,
} from 'lucide-react';

// ── Manager ────────────────────────────────────────────────────────────────
export const SIDEBAR_CONFIG = [
    { label: 'Dashboard',        path: '/',          icon: LayoutDashboard, roles: [ROLES.MANAGER] },
    { label: 'Omborlar',         path: '/warehouses',icon: Warehouse,       roles: [ROLES.MANAGER] },
    { label: 'Maxsulotlar',      path: '/products',  icon: Package,         roles: [ROLES.MANAGER] },
    { label: 'Xom ashyo',        path: '/raw',       icon: Package,         roles: [ROLES.MANAGER] },
    { label: 'Retseptlar',       path: '/recipes',   icon: Boxes,           roles: [ROLES.MANAGER] },
    { label: 'Stanoklar',        path: '/machines',  icon: Cog,             roles: [ROLES.MANAGER] },
    { label: 'Mijozlar',         path: '/customers', icon: Users,           roles: [ROLES.MANAGER] },
    { label: 'Kassalar',         path: '/cashboxes', icon: Wallet,          roles: [ROLES.MANAGER] },
    { label: 'Xarajatlar',       path: '/expenses',  icon: ReceiptText,     roles: [ROLES.MANAGER] },
    { label: 'Foydalanuvchilar', path: '/users',     icon: UserRound,       roles: [ROLES.MANAGER] },
    { label: 'Qurilmalar',       path: '/devices',   icon: MonitorCog,      roles: [ROLES.MANAGER] },
];

export const SIDEBAR_GROUPS = [
    { label: 'Asosiy',           items: SIDEBAR_CONFIG.filter((i) => i.path === '/') },
    { label: 'Ishlab chiqarish', items: SIDEBAR_CONFIG.filter((i) => ['/warehouses', '/products', '/raw', '/recipes', '/machines'].includes(i.path)) },
    { label: 'Moliya',           items: SIDEBAR_CONFIG.filter((i) => ['/cashboxes', '/expenses'].includes(i.path)) },
    { label: 'Userlar',          items: SIDEBAR_CONFIG.filter((i) => ['/customers', '/users', '/devices'].includes(i.path)) },
];

// ── Product Storekeeper ────────────────────────────────────────────────────
export const STAFF_SIDEBAR_CONFIG = [
    { label: 'Dashboard', path: '/staff',           icon: LayoutDashboard, roles: PRODUCT_WAREHOUSE_ROLES },
    { label: 'Kirim',     path: '/staff/income',    icon: LogIn,           roles: PRODUCT_WAREHOUSE_ROLES },
    { label: 'Chiqim',    path: '/staff/outcome',   icon: LogOut,          roles: PRODUCT_WAREHOUSE_ROLES },
    { label: 'Ombor',     path: '/staff/warehouse', icon: Warehouse,       roles: PRODUCT_WAREHOUSE_ROLES },
    { label: 'Tarix',     path: '/staff/history',   icon: History,         roles: PRODUCT_WAREHOUSE_ROLES },
];

export const STAFF_SIDEBAR_GROUPS = [
    { label: 'Asosiy', items: STAFF_SIDEBAR_CONFIG.filter((i) => i.path === '/staff') },
    { label: 'Ombor',  items: STAFF_SIDEBAR_CONFIG.filter((i) => ['/staff/income', '/staff/outcome', '/staff/warehouse', '/staff/history'].includes(i.path)) },
];

// ── Raw Material Storekeeper ───────────────────────────────────────────────
export const RAW_STAFF_SIDEBAR_CONFIG = [
    { label: 'Dashboard', path: '/raw-staff',           icon: LayoutDashboard, roles: RAW_WAREHOUSE_ROLES },
    { label: 'Kirim',     path: '/raw-staff/income',    icon: LogIn,           roles: RAW_WAREHOUSE_ROLES },
    { label: 'Chiqim',    path: '/raw-staff/outcome',   icon: LogOut,          roles: RAW_WAREHOUSE_ROLES },
    { label: 'Ombor',     path: '/raw-staff/warehouse', icon: Warehouse,       roles: RAW_WAREHOUSE_ROLES },
    { label: 'Tarix',     path: '/raw-staff/history',   icon: History,         roles: RAW_WAREHOUSE_ROLES },
];

export const RAW_STAFF_SIDEBAR_GROUPS = [
    { label: 'Asosiy',    items: RAW_STAFF_SIDEBAR_CONFIG.filter((i) => i.path === '/raw-staff') },
    { label: 'Xom ashyo', items: RAW_STAFF_SIDEBAR_CONFIG.filter((i) => ['/raw-staff/income', '/raw-staff/outcome', '/raw-staff/warehouse', '/raw-staff/history'].includes(i.path)) },
];

// ── Zayavkachi ─────────────────────────────────────────────────────────────
export const ZAYAVKACHI_SIDEBAR_CONFIG = [
    { label: 'Dashboard',   path: '/zayavkachi',        icon: LayoutDashboard, roles: ZAYAVKACHI_ROLES },
    { label: 'Buyurtmalar', path: '/zayavkachi/orders', icon: ClipboardList,   roles: ZAYAVKACHI_ROLES },
];

export const ZAYAVKACHI_SIDEBAR_GROUPS = [
    { label: 'Asosiy', items: ZAYAVKACHI_SIDEBAR_CONFIG.filter((i) => i.path === '/zayavkachi') },
    { label: 'Savdo',  items: ZAYAVKACHI_SIDEBAR_CONFIG.filter((i) => ['/zayavkachi/orders'].includes(i.path)) },
];
