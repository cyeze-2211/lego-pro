// navigation/sidebar.config.js
import { ROLES } from '../permissions/roles';
import { Boxes, Cog, LayoutDashboard, MonitorCog, Package, ReceiptText, UserRound, Users, Wallet, Warehouse } from 'lucide-react';

export const SIDEBAR_CONFIG = [
    {
        label: 'Dashboard',
        path: '/',
        icon: LayoutDashboard,
        roles: [ROLES.MANAGER],
    },
    {
        label: 'Omborlar',
        path: '/warehouses',
        icon: Warehouse,
        roles: [ROLES.MANAGER],
    },
    {
        label: 'Maxsulotlar',
        path: '/products',
        icon: Package,
        roles: [ROLES.MANAGER],
    },
    {
        label: 'Xom ashyo',
        path: '/raw',
        icon: Package,
        roles: [ROLES.MANAGER],
    },
    {
        label: 'Retseptlar',
        path: '/recipes',
        icon: Boxes,
        roles: [ROLES.MANAGER],
    },
    {
        label: 'Stanoklar',
        path: '/machines',
        icon: Cog,
        roles: [ROLES.MANAGER],
    },
    {
        label: 'Mijozlar',
        path: '/customers',
        icon: Users,
        roles: [ROLES.MANAGER],
    },
    {
        label: 'Kassalar',
        path: '/cashboxes',
        icon: Wallet,
        roles: [ROLES.MANAGER],
    },
    {
        label: 'Xarajatlar',
        path: '/expenses',
        icon: ReceiptText,
        roles: [ROLES.MANAGER],
    },
    {
        label: 'Foydalanuvchilar',
        path: '/users',
        icon: UserRound,
        roles: [ROLES.MANAGER],
    },
    {
        label: 'Qurilmalar',
        path: '/devices',
        icon: MonitorCog,
        roles: [ROLES.MANAGER],
    },
];

export const SIDEBAR_GROUPS = [
    { label: 'Asosiy', items: SIDEBAR_CONFIG.filter((item) => item.path === '/') },
    { label: 'Ishlab chiqarish', items: SIDEBAR_CONFIG.filter((item) => ['/warehouses', '/products', '/raw', '/recipes', '/machines'].includes(item.path)) },
    { label: 'Moliya', items: SIDEBAR_CONFIG.filter((item) => ['/cashboxes', '/expenses'].includes(item.path)) },
    { label: 'Userlar', items: SIDEBAR_CONFIG.filter((item) => ['/customers', '/users', '/devices'].includes(item.path)) },
];
