import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';

export const rawMaterialStockApi = createApi({
    reducerPath: 'rawMaterialStockApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['RawMaterialStock', 'RawMaterialTransaction'],
    endpoints: (builder) => ({

        // GET /api/v1/raw-material-stocks — joriy qoldiqlar
        getRawMaterialStocks: builder.query({
            query: ({ rawMaterialId, warehouseId, unit = 'KG', page = 0, size = 20 } = {}) => ({
                url: '/raw-material-stocks',
                method: 'GET',
                params: {
                    ...(rawMaterialId ? { rawMaterialId } : {}),
                    ...(warehouseId   ? { warehouseId }   : {}),
                    unit,
                    page,
                    size,
                },
            }),
            providesTags: [{ type: 'RawMaterialStock', id: 'LIST' }],
        }),

        // GET /api/v1/raw-material-stock-transactions — kirim/chiqim tarixi
        getRawMaterialTransactions: builder.query({
            query: ({ rawMaterialId, warehouseId, action, unit = 'KG', page = 0, size = 20 } = {}) => ({
                url: '/raw-material-stock-transactions',
                method: 'GET',
                params: {
                    ...(rawMaterialId ? { rawMaterialId } : {}),
                    ...(warehouseId   ? { warehouseId }   : {}),
                    ...(action        ? { action }         : {}),
                    unit,
                    page,
                    size,
                },
            }),
            providesTags: [{ type: 'RawMaterialTransaction', id: 'LIST' }],
        }),

        // POST /api/v1/raw-material-stock-transactions — kirim yoki chiqim
        createRawMaterialTransaction: builder.mutation({
            query: (data) => ({
                url: '/raw-material-stock-transactions',
                method: 'POST',
                data,
            }),
            invalidatesTags: [
                { type: 'RawMaterialStock',    id: 'LIST' },
                { type: 'RawMaterialTransaction', id: 'LIST' },
            ],
        }),
    }),
});

export const {
    useGetRawMaterialStocksQuery,
    useGetRawMaterialTransactionsQuery,
    useCreateRawMaterialTransactionMutation,
} = rawMaterialStockApi;
