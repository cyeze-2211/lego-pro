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
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(authApi.middleware, warehouseApi.middleware, productApi.middleware, rawMaterialApi.middleware, machineApi.middleware, customerApi.middleware, recipeApi.middleware, userApi.middleware, cashboxApi.middleware, expenseApi.middleware, deviceApi.middleware),
});

setupListeners(store.dispatch);
export default store;
