// navigation/sidebar.config.js
import { ROLES, WAREHOUSE_ROLES, ZAYAVKACHI_ROLES, BUXGALTER_ROLES, KASSIR_ROLES, XIMIK_ROLES } from '../permissions/roles';
import {
    Boxes, ClipboardList, Cog, History, LayoutDashboard, LogIn, LogOut,
    CalendarClock, Layers3, MonitorCog, Package, Palette, ReceiptText, ShieldCheck, UserRound, Users, Wallet, Warehouse, FileSpreadsheet, UserCheck, Truck,
    ChartArea, FlaskConical, Settings,
} from 'lucide-react';

// ── Sozlamalar (barcha rollar) ─────────────────────────────────────────────
// "Tizim" bo‘limi bor rolda — shu bo‘lim ichida; yo‘q rollarda — sarlavhasiz mustaqil punkt.
const settingsItem = (path = '/settings') => ({ label: 'Sozlamalar', path, icon: Settings });
const settingsGroup = (path) => ({ label: 'Sozlamalar', standalone: true, items: [settingsItem(path)] });

// ── Manager ────────────────────────────────────────────────────────────────
// Tartib: kundalik ish (savdo) → katalog → ishlab chiqarish → moliya → tizim
export const SIDEBAR_CONFIG = [
    // Asosiy
    { label: 'Dashboard', path: '/', icon: LayoutDashboard, roles: [ROLES.MANAGER] },

    // Savdo
    { label: 'Buyurtmalar', path: '/orders', icon: ClipboardList, roles: [ROLES.MANAGER] },
    { label: 'Mijozlar', path: '/customers', icon: Users, roles: [ROLES.MANAGER] },
    { label: 'Agentlar', path: '/customer-agents', icon: UserCheck, roles: [ROLES.MANAGER] },
    { label: 'Akt sverka', path: '/reconciliation', icon: FileSpreadsheet, roles: [ROLES.MANAGER] },
    { label: 'To\u2019lov eslatmalari', path: '/reminders', icon: CalendarClock, roles: [ROLES.MANAGER] },

    // Katalog
    { label: 'Mahsulotlar', path: '/products', icon: Package, roles: [ROLES.MANAGER] },
    { label: 'Kategoriyalar', path: '/product-categories', icon: Layers3, roles: [ROLES.MANAGER] },
    { label: 'Ranglar', path: '/product-colors', icon: Palette, roles: [ROLES.MANAGER] },
    { label: 'Brendlar', path: '/brand', icon: Boxes, roles: [ROLES.MANAGER] },

    // Ishlab chiqarish
    { label: 'Omborlar', path: '/warehouses', icon: Warehouse, roles: [ROLES.MANAGER] },
    { label: 'Xom ashyo', path: '/raw', icon: Package, roles: [ROLES.MANAGER] },
    { label: 'Retseptlar', path: '/recipes', icon: FlaskConical, roles: [ROLES.MANAGER] },
    { label: 'Stanoklar', path: '/machines', icon: Cog, roles: [ROLES.MANAGER] },

    // Moliya
    { label: 'Kassalar', path: '/cashboxes', icon: Wallet, roles: [ROLES.MANAGER] },
    { label: 'Xarajatlar', path: '/expenses', icon: ReceiptText, roles: [ROLES.MANAGER] },
    { label: 'Xarajat kategoriyalari', path: '/expense-categories', icon: Layers3, roles: [ROLES.MANAGER] },
    { label: 'Yetkazib beruvchilar', path: '/suppliers', icon: Truck, roles: [ROLES.MANAGER, ...BUXGALTER_ROLES] },

    // Tizim
    { label: 'Foydalanuvchilar', path: '/users', icon: UserRound, roles: [ROLES.MANAGER] },
    { label: 'Rollar', path: '/roles', icon: ShieldCheck, roles: [ROLES.MANAGER] },
    { label: 'Qurilmalar', path: '/devices', icon: MonitorCog, roles: [ROLES.MANAGER] },
    { ...settingsItem(), roles: [ROLES.MANAGER] },
];

const pick = (paths) => paths.map((path) => SIDEBAR_CONFIG.find((i) => i.path === path)).filter(Boolean);

export const SIDEBAR_GROUPS = [
    { label: 'Asosiy', items: pick(['/']) },
    { label: 'Savdo', items: pick(['/orders', '/customers', '/customer-agents', '/reconciliation', '/reminders']) },
    { label: 'Katalog', items: pick(['/products', '/product-categories', '/product-colors', '/brand']) },
    { label: 'Ishlab chiqarish', items: pick(['/warehouses', '/raw', '/recipes', '/machines']) },
    { label: 'Moliya', items: pick(['/cashboxes', '/expenses', '/expense-categories', '/suppliers']) },
    { label: 'Tizim', items: pick(['/users', '/roles', '/devices', '/settings']) },
];

// ── Unified Storekeeper ────────────────────────────────────────────────────
const PRODUCT_STOREKEEPER_ITEMS = [
    { label: 'Buyurtmalar', path: '/staff/orders', icon: ClipboardList, roles: WAREHOUSE_ROLES },
    { label: 'Kirim', path: '/staff/income', icon: LogIn, roles: WAREHOUSE_ROLES },
    // { label: 'Chiqim', path: '/staff/outcome', icon: LogOut, roles: WAREHOUSE_ROLES },
    { label: 'Ombor', path: '/staff/warehouse', icon: Warehouse, roles: WAREHOUSE_ROLES },
    { label: 'Tarix', path: '/staff/history', icon: History, roles: WAREHOUSE_ROLES },
];

const RAW_STOREKEEPER_ITEMS = [
    { label: 'Kirim', path: '/raw-staff/income', icon: LogIn, roles: WAREHOUSE_ROLES },
    { label: 'Chiqim', path: '/raw-staff/outcome', icon: LogOut, roles: WAREHOUSE_ROLES },
    { label: 'Ombor', path: '/raw-staff/warehouse', icon: Warehouse, roles: WAREHOUSE_ROLES },
    { label: 'Tarix', path: '/raw-staff/history', icon: History, roles: WAREHOUSE_ROLES },
];

export const WAREHOUSE_SIDEBAR_GROUPS = [
    {
        label: 'Asosiy',
        items: [
            { label: 'Dashboard', path: '/staff', icon: LayoutDashboard, roles: WAREHOUSE_ROLES, exact: true },
        ],
    },
    {
        label: 'Tovar ombori',
        items: PRODUCT_STOREKEEPER_ITEMS,
    },
    {
        label: 'Xom ashyo ombori',
        items: RAW_STOREKEEPER_ITEMS,
    },
    settingsGroup(),
];

// ── Zayavkachi ─────────────────────────────────────────────────────────────
export const ZAYAVKACHI_SIDEBAR_CONFIG = [
    { label: 'Dashboard', path: '/zayavkachi', icon: LayoutDashboard, roles: ZAYAVKACHI_ROLES, exact: true },
    { label: 'To\u2019lov eslatmalari', path: '/reminders', icon: CalendarClock, roles: ZAYAVKACHI_ROLES },
    { label: 'Buyurtmalar', path: '/zayavkachi/orders', icon: ClipboardList, roles: ZAYAVKACHI_ROLES },
    { label: 'Mijozlar', path: '/zayavkachi/customers', icon: Users, roles: ZAYAVKACHI_ROLES },
    { label: 'Sverka', path: '/zayavkachi/reconciliation', icon: FileSpreadsheet, roles: [ZAYAVKACHI_ROLES] },
    { label: 'Kassalar', path: '/zayavkachi/cashboxes', icon: Wallet, roles: ZAYAVKACHI_ROLES },
    { label: 'Mahsulot ombori qoldiqlari', path: '/zayavkachi/warehouse', icon: Warehouse, roles: ZAYAVKACHI_ROLES },
    { label: 'Xom ashyo ombori qoldiqlari', path: '/zayavkachi/raw-warehouse', icon: Package, roles: ZAYAVKACHI_ROLES },

];

export const ZAYAVKACHI_SIDEBAR_GROUPS = [
    { label: 'Asosiy', items: ZAYAVKACHI_SIDEBAR_CONFIG.filter((i) => i.path === '/zayavkachi') },
    { label: 'Savdo', items: ZAYAVKACHI_SIDEBAR_CONFIG.filter((i) => ['/zayavkachi/orders', '/zayavkachi/customers', '/zayavkachi/reconciliation', '/zayavkachi/cashboxes', '/reminders'].includes(i.path)) },
    { label: 'Ombor qoldiqlari', items: ZAYAVKACHI_SIDEBAR_CONFIG.filter((i) => ['/zayavkachi/warehouse', '/zayavkachi/raw-warehouse'].includes(i.path)) },
    settingsGroup(),
];

// ── Buxgalter ──────────────────────────────────────────────────────────────
export const BUXGALTER_SIDEBAR_CONFIG = [
    { label: 'Dashboard', path: '/buxgalter', icon: LayoutDashboard, roles: BUXGALTER_ROLES, exact: true },
    { label: 'Buyurtmalar', path: '/zayavkachi/orders', icon: ClipboardList, roles: BUXGALTER_ROLES },
    { label: 'Mijozlar', path: '/customers', icon: Users, roles: BUXGALTER_ROLES },
    { label: 'Mahsulot statistikasi', path: '/zayavkachi/chart', icon: ChartArea, roles: BUXGALTER_ROLES },
    { label: 'Agentlar', path: '/customer-agents', icon: UserCheck, roles: BUXGALTER_ROLES },
    { label: 'Mahsulot katalogi', path: '/products', icon: Package, roles: BUXGALTER_ROLES },
    { label: 'Tovar ombori qoldiqlari', path: '/zayavkachi/warehouse', icon: Warehouse, roles: BUXGALTER_ROLES },
    { label: 'Mijozlar sverkasi', path: '/reconciliation', icon: FileSpreadsheet, roles: BUXGALTER_ROLES },
];

export const BUXGALTER_SIDEBAR_GROUPS = [
    { label: 'Asosiy', items: BUXGALTER_SIDEBAR_CONFIG.filter((i) => i.path === '/buxgalter') },
    { label: 'Savdo', items: BUXGALTER_SIDEBAR_CONFIG.filter((i) => ['/zayavkachi/orders', '/customers', '/customer-agents', '/reconciliation'].includes(i.path)) },
    { label: 'Ombor va katalog', items: BUXGALTER_SIDEBAR_CONFIG.filter((i) => ['/products', '/zayavkachi/warehouse','/zayavkachi/chart'].includes(i.path)) },
    settingsGroup(),
];

// ── Kassir ─────────────────────────────────────────────────────────────────
export const KASSIR_SIDEBAR_CONFIG = [
    { label: 'Dashboard', path: '/kassir', icon: LayoutDashboard, roles: KASSIR_ROLES, exact: true },
    { label: 'Kassalar', path: '/kassir/cashboxes', icon: Wallet, roles: KASSIR_ROLES },
    { label: 'Mijozlar', path: '/kassir/customers', icon: Users, roles: KASSIR_ROLES },
    { label: 'Xarajatlar', path: '/kassir/expenses', icon: ReceiptText, roles: KASSIR_ROLES },
    { label: 'Xarajat kategoriyalari', path: '/kassir/expense-categories', icon: ReceiptText, roles: KASSIR_ROLES },
    { label: 'Yetkazib beruvchilar', path: '/kassir/suppliers', icon: Truck, roles: KASSIR_ROLES },
    { label: 'Sverka', path: '/kassir/reconciliation', icon: FileSpreadsheet, roles: KASSIR_ROLES },
];

export const KASSIR_SIDEBAR_GROUPS = [
    { label: 'Asosiy', items: KASSIR_SIDEBAR_CONFIG.filter((i) => i.path === '/kassir') },
    { label: 'Moliya', items: KASSIR_SIDEBAR_CONFIG.filter((i) => ['/kassir/cashboxes', '/kassir/expenses', '/kassir/expense-categories', '/kassir/suppliers', '/kassir/reconciliation'].includes(i.path)) },
    { label: 'Savdo', items: KASSIR_SIDEBAR_CONFIG.filter((i) => ['/kassir/customers'].includes(i.path)) },
    settingsGroup(),
];

// ── Ximik ──────────────────────────────────────────────────────────────────
export const XIMIK_SIDEBAR_CONFIG = [
    { label: 'Dashboard', path: '/ximik', icon: LayoutDashboard, roles: XIMIK_ROLES, exact: true },
    { label: 'Retseptlar', path: '/recipes', icon: FlaskConical, roles: XIMIK_ROLES },
    { label: 'Xom ashyo', path: '/raw', icon: Package, roles: XIMIK_ROLES },
    { label: 'Stanoklar', path: '/machines', icon: Cog, roles: XIMIK_ROLES },
    { label: 'Tovar ombori qoldiqlari', path: '/ximik/warehouse', icon: Warehouse, roles: XIMIK_ROLES },
    { label: 'Yetkazib beruvchilar', path: '/suppliers', icon: Truck, roles: XIMIK_ROLES },
    { label: 'Xarajatlar', path: '/expenses', icon: ReceiptText, roles: XIMIK_ROLES },
    { label: 'Kassalar', path: '/cashboxes', icon: Wallet, roles: XIMIK_ROLES },
];

export const XIMIK_SIDEBAR_GROUPS = [
    { label: 'Asosiy', items: XIMIK_SIDEBAR_CONFIG.filter((i) => i.path === '/ximik') },
    { label: 'Ishlab chiqarish', items: XIMIK_SIDEBAR_CONFIG.filter((i) => ['/recipes', '/raw', '/machines', '/ximik/warehouse'].includes(i.path)) },
    { label: 'Moliya (ko‘rish)', items: XIMIK_SIDEBAR_CONFIG.filter((i) => ['/suppliers', '/expenses', '/cashboxes'].includes(i.path)) },
    settingsGroup(),
];

// ── Stanokchi (bosh rejim) ─────────────────────────────────────────────────
export const STANOKCHI_SIDEBAR_CONFIG = [
    { label: 'Dashboard', path: '/stanokchi', icon: LayoutDashboard, roles: [ROLES.STANOKCHI], exact: true },
    { label: 'Stanoklar', path: '/stanokchi/machines', icon: Cog, roles: [ROLES.STANOKCHI] },
    { label: 'Kirim (qo‘lda)', path: '/stanokchi/income', icon: LogIn, roles: [ROLES.STANOKCHI] },
];

export const STANOKCHI_SIDEBAR_GROUPS = [
    { label: 'Asosiy', items: STANOKCHI_SIDEBAR_CONFIG.filter((i) => i.path === '/stanokchi') },
    { label: 'Ishlab chiqarish', items: STANOKCHI_SIDEBAR_CONFIG.filter((i) => ['/stanokchi/machines', '/stanokchi/income'].includes(i.path)) },
    settingsGroup('/stanokchi/settings'),
];
