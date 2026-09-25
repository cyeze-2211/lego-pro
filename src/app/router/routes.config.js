import { lazy } from 'react';
import { ROLES, PRODUCT_WAREHOUSE_ROLES, RAW_WAREHOUSE_ROLES, WAREHOUSE_ROLES, ZAYAVKACHI_ROLES, BUXGALTER_ROLES, KASSIR_ROLES } from '../permissions/roles';

export const STANOKCHI_ROLES = [ROLES.STANOKCHI];
export const MIKSERCHI_ROLES = [ROLES.MIKSERCHI];


export const ROUTES = [
    // ── Manager routes ───────────────────────────────────────────────────
    {
        path: '/',
        component: lazy(() => import('../../Components/Common/Dashboard')),
        roles: ROLES.MANAGER,
    },
    {
        path: '/profile',
        component: lazy(() => import('../../Components/Common/Profile')),
        roles: [ROLES.MANAGER, ...PRODUCT_WAREHOUSE_ROLES, ...RAW_WAREHOUSE_ROLES, ...ZAYAVKACHI_ROLES, ...BUXGALTER_ROLES, ...KASSIR_ROLES],
    },
    {
        path: '/warehouses',
        component: lazy(() => import('../../Components/Common/WarehousePage')),
        roles: ROLES.MANAGER,
    },
    {
        path: '/warehouses/:id',
        component: lazy(() => import('../../Components/Common/WarehouseDetail')),
        roles: ROLES.MANAGER,
    },
    {
        path: '/products',
        component: lazy(() => import('../../Components/Common/Product')),
        roles: ROLES.MANAGER,
    },
    {
        path: '/raw',
        component: lazy(() => import('../../Components/Common/Raw')),
        roles: ROLES.MANAGER,
    },
    {
        path: '/raw/:id',
        component: lazy(() => import('../../Components/Common/RawDetail')),
        roles: ROLES.MANAGER,
    },
    {
        path: '/recipes',
        component: lazy(() => import('../../Components/Common/Recipe')),
        roles: ROLES.MANAGER,
    },
    {
        path: '/recipes/:id',
        component: lazy(() => import('../../Components/Common/RecipeDetail')),
        roles: ROLES.MANAGER,
    },
    {
        path: '/machines',
        component: lazy(() => import('../../Components/Common/Machine')),
        roles: ROLES.MANAGER,
    },
    {
        path: '/machines/:id',
        component: lazy(() => import('../../Components/Common/MachineDetail')),
        roles: ROLES.MANAGER,
    },
    {
        path: '/customers',
        component: lazy(() => import('../../Components/Common/Customer')),
        roles: ROLES.MANAGER,
    },
    {
        path: '/users',
        component: lazy(() => import('../../Components/Common/User')),
        roles: ROLES.MANAGER,
    },
    {
        path: '/users/:id',
        component: lazy(() => import('../../Components/Common/UserDetail')),
        roles: ROLES.MANAGER,
    },
    {
        path: '/devices',
        component: lazy(() => import('../../Components/Common/Device')),
        roles: ROLES.MANAGER,
    },
    {
        path: '/devices/:id',
        component: lazy(() => import('../../Components/Common/DeviceDetail')),
        roles: ROLES.MANAGER,
    },
    {
        path: '/customers/:id',
        component: lazy(() => import('../../Components/Common/CustomerDetail')),
        roles: ROLES.MANAGER,
    },
    {
        path: '/cashboxes',
        component: lazy(() => import('../../Components/Common/Cashbox')),
        roles: ROLES.MANAGER,
    },
    {
        path: '/cashboxes/:id',
        component: lazy(() => import('../../Components/Common/CashboxDetail')),
        roles: ROLES.MANAGER,
    },
    {
        path: '/expenses',
        component: lazy(() => import('../../Components/Common/Expense')),
        roles: ROLES.MANAGER,
    },
    {
        path: '/expenses/:id',
        component: lazy(() => import('../../Components/Common/ExpenseDetail')),
        roles: ROLES.MANAGER,
    },
    {
        path: '/products/:id',
        component: lazy(() => import('../../Components/Common/ProductDetail')),
        roles: ROLES.MANAGER,
    },
    {
        path: '/orders',
        component: lazy(() => import('../../Components/Zayavkachi/Orders')),
        roles: ROLES.MANAGER,
    },
    {
        path: '/orders/new',
        component: lazy(() => import('../../Components/Zayavkachi/OrderCreate')),
        roles: ROLES.MANAGER,
    },
    {
        path: '/orders/:id',
        component: lazy(() => import('../../Components/Zayavkachi/OrderDetail')),
        roles: ROLES.MANAGER,
    },
    {
        path: '/orders/:id/edit',
        component: lazy(() => import('../../Components/Zayavkachi/OrderEdit')),
        roles: ROLES.MANAGER,
    },

    // ── Staff (Product Storekeeper) routes ──────────────────────────────
    {
        path: '/staff',
        component: lazy(() => import('../../Components/Staff/Dashboard')),
        roles: PRODUCT_WAREHOUSE_ROLES,
    },
    {
        path: '/staff/orders',
        component: lazy(() => import('../../Components/Staff/Orders')),
        roles: PRODUCT_WAREHOUSE_ROLES,
    },
    {
        path: '/staff/orders/:id',
        component: lazy(() => import('../../Components/Staff/OrderDetail')),
        roles: PRODUCT_WAREHOUSE_ROLES,
    },
    {
        path: '/staff/income',
        component: lazy(() => import('../../Components/Staff/Income')),
        roles: PRODUCT_WAREHOUSE_ROLES,
    },
    {
        path: '/staff/outcome',
        component: lazy(() => import('../../Components/Staff/Outcome')),
        roles: PRODUCT_WAREHOUSE_ROLES,
    },
    {
        path: '/staff/warehouse',
        component: lazy(() => import('../../Components/Staff/StockWarehouse')),
        roles: PRODUCT_WAREHOUSE_ROLES,
    },
    {
        path: '/staff/history',
        component: lazy(() => import('../../Components/Staff/History')),
        roles: PRODUCT_WAREHOUSE_ROLES,
    },

    // ── Stanokchi routes ─────────────────────────────────────────────────
    // /stanokchi — bosh sahifa (head: dashboard xulosa, worker: stanoklar ro'yxati)
    {
        path: '/stanokchi',
        component: lazy(() => import('../../Components/Stanokchi/Dashboard')),
        roles: STANOKCHI_ROLES,
    },
    // /stanokchi/machines — head mode uchun alohida stanoklar ro'yxati
    {
        path: '/stanokchi/machines',
        component: lazy(() => import('../../Components/Stanokchi/Machines')),
        roles: STANOKCHI_ROLES,
    },
    {
        path: '/stanokchi/machines/:id',
        component: lazy(() => import('../../Components/Stanokchi/MachineDetail')),
        roles: STANOKCHI_ROLES,
    },
    // ── Mixer routes ─────────────────────────────────────────────────────
    {
        path: '/mixer',
        component: lazy(() => import('../../Components/Mixer/Dashboard')),
        roles: MIKSERCHI_ROLES,
    },
    {
        path: '/mixer/recipes/:id',
        component: lazy(() => import('../../Components/Mixer/RecipeDetail')),
        roles: MIKSERCHI_ROLES,
    },

    // ── Raw Staff (Raw Material Storekeeper) routes ──────────────────────
    {
        path: '/raw-staff',
        component: lazy(() => import('../../Components/RawStaff/Dashboard')),
        roles: RAW_WAREHOUSE_ROLES,
    },
    {
        path: '/raw-staff/income',
        component: lazy(() => import('../../Components/RawStaff/Income')),
        roles: RAW_WAREHOUSE_ROLES,
    },
    {
        path: '/raw-staff/outcome',
        component: lazy(() => import('../../Components/RawStaff/Outcome')),
        roles: RAW_WAREHOUSE_ROLES,
    },
    {
        path: '/raw-staff/warehouse',
        component: lazy(() => import('../../Components/RawStaff/StockWarehouse')),
        roles: RAW_WAREHOUSE_ROLES,
    },
    {
        path: '/raw-staff/history',
        component: lazy(() => import('../../Components/RawStaff/History')),
        roles: RAW_WAREHOUSE_ROLES,
    },

    // ── Zayavkachi routes ────────────────────────────────────────────────
    {
        path: '/zayavkachi',
        component: lazy(() => import('../../Components/Zayavkachi/Dashboard')),
        roles: [...ZAYAVKACHI_ROLES, ...BUXGALTER_ROLES],
    },
    {
        path: '/zayavkachi/orders',
        component: lazy(() => import('../../Components/Zayavkachi/Orders')),
        roles: [...ZAYAVKACHI_ROLES, ...BUXGALTER_ROLES],
    },
    {
        path: '/zayavkachi/orders/new',
        component: lazy(() => import('../../Components/Zayavkachi/OrderCreate')),
        roles: [...ZAYAVKACHI_ROLES, ...BUXGALTER_ROLES],
    },
    {
        path: '/zayavkachi/orders/:id',
        component: lazy(() => import('../../Components/Zayavkachi/OrderDetail')),
        roles: [...ZAYAVKACHI_ROLES, ...BUXGALTER_ROLES],
    },
    {
        path: '/zayavkachi/orders/:id/edit',
        component: lazy(() => import('../../Components/Zayavkachi/OrderEdit')),
        roles: [...ZAYAVKACHI_ROLES, ...BUXGALTER_ROLES],
    },
    {
        path: '/zayavkachi/customers',
        component: lazy(() => import('../../Components/Zayavkachi/Customers')),
        roles: [...ZAYAVKACHI_ROLES, ...BUXGALTER_ROLES],
    },
    {
        path: '/zayavkachi/customers/new',
        component: lazy(() => import('../../Components/Zayavkachi/CustomerCreate')),
        roles: [...ZAYAVKACHI_ROLES, ...BUXGALTER_ROLES],
    },
    {
        path: '/zayavkachi/customers/:id',
        component: lazy(() => import('../../Components/Zayavkachi/CustomerDetail')),
        roles: [...ZAYAVKACHI_ROLES, ...BUXGALTER_ROLES],
    },
    {
        path: '/zayavkachi/customers/:id/edit',
        component: lazy(() => import('../../Components/Zayavkachi/CustomerEdit')),
        roles: [...ZAYAVKACHI_ROLES, ...BUXGALTER_ROLES],
    },
    {
        path: '/zayavkachi/customers/:id/orders/new',
        component: lazy(() => import('../../Components/Zayavkachi/CustomerOrderCreate')),
        roles: [...ZAYAVKACHI_ROLES, ...BUXGALTER_ROLES],
    },

    // ── Kassir routes ────────────────────────────────────────────────────
    {
        path: '/kassir',
        component: lazy(() => import('../../Components/Kassir/Dashboard')),
        roles: KASSIR_ROLES,
    },
    // Kassalar
    {
        path: '/kassir/cashboxes',
        component: lazy(() => import('../../Components/Common/Cashbox')),
        roles: KASSIR_ROLES,
    },
    {
        path: '/kassir/cashboxes/:id',
        component: lazy(() => import('../../Components/Common/CashboxDetail')),
        roles: KASSIR_ROLES,
    },
    // Mijozlar
    {
        path: '/kassir/customers',
        component: lazy(() => import('../../Components/Zayavkachi/Customers')),
        roles: KASSIR_ROLES,
    },
    {
        path: '/kassir/customers/new',
        component: lazy(() => import('../../Components/Zayavkachi/CustomerCreate')),
        roles: KASSIR_ROLES,
    },
    {
        path: '/kassir/customers/:id',
        component: lazy(() => import('../../Components/Zayavkachi/CustomerDetail')),
        roles: KASSIR_ROLES,
    },
    {
        path: '/kassir/customers/:id/edit',
        component: lazy(() => import('../../Components/Zayavkachi/CustomerEdit')),
        roles: KASSIR_ROLES,
    },
    {
        path: '/kassir/customers/:id/orders/new',
        component: lazy(() => import('../../Components/Zayavkachi/CustomerOrderCreate')),
        roles: KASSIR_ROLES,
    },
    // Xarajatlar
    {
        path: '/kassir/expenses',
        component: lazy(() => import('../../Components/Common/Expense')),
        roles: KASSIR_ROLES,
    },
    {
        path: '/kassir/expenses/:id',
        component: lazy(() => import('../../Components/Common/ExpenseDetail')),
        roles: KASSIR_ROLES,
    },
    // Buyurtmalar
    {
        path: '/kassir/orders',
        component: lazy(() => import('../../Components/Zayavkachi/Orders')),
        roles: KASSIR_ROLES,
    },
    {
        path: '/kassir/orders/new',
        component: lazy(() => import('../../Components/Zayavkachi/OrderCreate')),
        roles: KASSIR_ROLES,
    },
    {
        path: '/kassir/orders/:id',
        component: lazy(() => import('../../Components/Zayavkachi/OrderDetail')),
        roles: KASSIR_ROLES,
    },
    {
        path: '/kassir/orders/:id/edit',
        component: lazy(() => import('../../Components/Zayavkachi/OrderEdit')),
        roles: KASSIR_ROLES,
    },
];