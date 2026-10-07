// store/index.js
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { authApi } from './services/auth.api';
import authReducer from './slices/auth.slice';
import { warehouseApi } from './services/warehouse.api';
import { productApi } from './services/product.api';
import { rawMaterialApi } from './services/raw.api';
import { machineApi } from './services/machine.api';
import { customerApi } from './services/customer.api';
import { recipeApi } from './services/productRecept.api';
import { userApi } from './services/user.api';
import { cashboxApi } from './services/cashbox.api';
import { expenseApi } from './services/expense.api';
import { deviceApi } from './services/device.api';
import { productStockApi } from './services/productStock.api';
import { roleApi } from './services/role.api';
import { rawMaterialStockApi } from './services/rawMaterialStock.api';
import { salesOrderApi } from './services/salesOrder.api';
import { productionTaskApi } from './services/productionTask.api';
import { auditApi } from './services/audit.api';
import { paymentApi } from './services/payment.api';
import { machineOutputApi } from './services/machineOutput.api';
import { brandApi } from './services/brand.api';
import { customerAgentApi } from './services/customerAgent.api';
import { productColorApi } from './services/productColor.api';
import { productCategoryApi } from './services/productCategory.api';
import { expenseCategoryApi } from './services/expenseCategory.api';
import { paymentReminderApi } from './services/paymentReminder.api';

export const store = configureStore({
    reducer: {
        auth: authReducer,              
        [authApi.reducerPath]: authApi.reducer,
        [warehouseApi.reducerPath]: warehouseApi.reducer,
        [productApi.reducerPath]: productApi.reducer,
        [rawMaterialApi.reducerPath]: rawMaterialApi.reducer,
        [machineApi.reducerPath]: machineApi.reducer,
        [customerApi.reducerPath]: customerApi.reducer,
        [recipeApi.reducerPath]: recipeApi.reducer,
        [userApi.reducerPath]: userApi.reducer,
        [cashboxApi.reducerPath]: cashboxApi.reducer,
        [expenseApi.reducerPath]: expenseApi.reducer,
        [deviceApi.reducerPath]: deviceApi.reducer,
        [productStockApi.reducerPath]: productStockApi.reducer,
        [roleApi.reducerPath]: roleApi.reducer,
        [rawMaterialStockApi.reducerPath]: rawMaterialStockApi.reducer,
        [salesOrderApi.reducerPath]: salesOrderApi.reducer,
        [productionTaskApi.reducerPath]: productionTaskApi.reducer,
        [auditApi.reducerPath]: auditApi.reducer,
        [paymentApi.reducerPath]: paymentApi.reducer,
        [machineOutputApi.reducerPath]: machineOutputApi.reducer,
        [brandApi.reducerPath]: brandApi.reducer,
        [customerAgentApi.reducerPath]: customerAgentApi.reducer,
        [productColorApi.reducerPath]: productColorApi.reducer,
        [productCategoryApi.reducerPath]: productCategoryApi.reducer,
        [expenseCategoryApi.reducerPath]: expenseCategoryApi.reducer,
        [paymentReminderApi.reducerPath]: paymentReminderApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(authApi.middleware, warehouseApi.middleware, productApi.middleware, rawMaterialApi.middleware, machineApi.middleware, customerApi.middleware, recipeApi.middleware, userApi.middleware, cashboxApi.middleware, expenseApi.middleware, deviceApi.middleware, productStockApi.middleware, roleApi.middleware, rawMaterialStockApi.middleware, salesOrderApi.middleware, productionTaskApi.middleware, auditApi.middleware, paymentApi.middleware, machineOutputApi.middleware, brandApi.middleware, customerAgentApi.middleware, productColorApi.middleware, productCategoryApi.middleware, expenseCategoryApi.middleware, paymentReminderApi.middleware),
});

setupListeners(store.dispatch);
export default store;
