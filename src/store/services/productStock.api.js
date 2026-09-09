import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';

export const productStockApi = createApi({
    reducerPath: 'productStockApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['ProductStock', 'StockTransaction'],
    endpoints: (builder) => ({

        // GET /api/v1/product-stocks — joriy qoldiqlar
        getProductStocks: builder.query({
            query: ({ productId, warehouseId, page = 0, size = 20, sort } = {}) => ({
                url: '/product-stocks',
                method: 'GET',
                params: {
                    ...(productId ? { productId } : {}),
                    ...(warehouseId ? { warehouseId } : {}),
                    page,
                    size,
                    ...(sort ? { sort } : {}),
                },
            }),
            providesTags: [{ type: 'ProductStock', id: 'LIST' }],
        }),

        // GET /api/v1/product-stock-transactions — kirim/chiqim tarixi
        getStockTransactions: builder.query({
            query: ({ productId, warehouseId, action, page = 0, size = 20, sort } = {}) => ({
                url: '/product-stock-transactions',
                method: 'GET',
                params: {
                    ...(productId ? { productId } : {}),
                    ...(warehouseId ? { warehouseId } : {}),
                    ...(action ? { action } : {}),
                    page,
                    size,
                    ...(sort ? { sort } : {}),
                },
            }),
            providesTags: [{ type: 'StockTransaction', id: 'LIST' }],
        }),

        // POST /api/v1/product-stock-transactions — kirim yoki chiqim yaratish
        createStockTransaction: builder.mutation({
            query: (data) => ({
                url: '/product-stock-transactions',
                method: 'POST',
                data,
            }),
            invalidatesTags: [
                { type: 'ProductStock', id: 'LIST' },
                { type: 'StockTransaction', id: 'LIST' },
            ],
        }),
    }),
});

export const {
    useGetProductStocksQuery,
    useGetStockTransactionsQuery,
    useCreateStockTransactionMutation,
} = productStockApi;
