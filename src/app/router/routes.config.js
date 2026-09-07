import { lazy } from 'react';
import { ROLES } from '../permissions/roles';


export const ROUTES = [
    {
        path: '/',
        component: lazy(() => import('../../Components/Common/Dashboard')),
        roles:ROLES.MANAGER,
    },
    {
        path: '/profile',
        component: lazy(() => import('../../Components/Common/Profile')),
        roles:ROLES.MANAGER,
    },
    {
        path: '/warehouses',
        component: lazy(() => import('../../Components/Common/WarehousePage')),
        roles:ROLES.MANAGER,
    },
    {
        path: '/warehouses/:id',
        component: lazy(() => import('../../Components/Common/WarehouseDetail')),
        roles:ROLES.MANAGER,
    },
    {
        path: '/products',
        component: lazy(() => import('../../Components/Common/Product')),
        roles:ROLES.MANAGER,
    },
    {
        path: '/raw',
        component: lazy(() => import('../../Components/Common/Raw')),
        roles:ROLES.MANAGER,
    },
    {
        path: '/raw/:id',
        component: lazy(() => import('../../Components/Common/RawDetail')),
        roles:ROLES.MANAGER,
    },
    {
        path: '/recipes',
        component: lazy(() => import('../../Components/Common/Recipe')),
        roles:ROLES.MANAGER,
    },
    {
        path: '/recipes/:id',
        component: lazy(() => import('../../Components/Common/RecipeDetail')),
        roles:ROLES.MANAGER,
    },
    {
        path: '/machines',
        component: lazy(() => import('../../Components/Common/Machine')),
        roles:ROLES.MANAGER,
    },
    {
        path: '/machines/:id',
        component: lazy(() => import('../../Components/Common/MachineDetail')),
        roles:ROLES.MANAGER,
    },
    {
        path: '/customers',
        component: lazy(() => import('../../Components/Common/Customer')),
        roles:ROLES.MANAGER,
    },
    {
        path: '/users',
        component: lazy(() => import('../../Components/Common/User')),
        roles:ROLES.MANAGER,
    },
    {
        path: '/users/:id',
        component: lazy(() => import('../../Components/Common/UserDetail')),
        roles:ROLES.MANAGER,
    },
    {
        path: '/devices',
        component: lazy(() => import('../../Components/Common/Device')),
        roles:ROLES.MANAGER,
    },
    {
        path: '/customers/:id',
        component: lazy(() => import('../../Components/Common/CustomerDetail')),
        roles:ROLES.MANAGER,
    },
    {
        path: '/cashboxes',
        component: lazy(() => import('../../Components/Common/Cashbox')),
        roles:ROLES.MANAGER,
    },
    {
        path: '/cashboxes/:id',
        component: lazy(() => import('../../Components/Common/CashboxDetail')),
        roles:ROLES.MANAGER,
    },
    {
        path: '/expenses',
        component: lazy(() => import('../../Components/Common/Expense')),
        roles:ROLES.MANAGER,
    },
    {
        path: '/expenses/:id',
        component: lazy(() => import('../../Components/Common/ExpenseDetail')),
        roles:ROLES.MANAGER,
    },
    {
        path: '/products/:id',
        component: lazy(() => import('../../Components/Common/ProductDetail')),
        roles:ROLES.MANAGER,
    },
];
