import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';

export const rawMaterialStockApi = createApi({
    reducerPath: 'rawMaterialStockApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['RawMaterialStock', 'RawMaterialTransaction'],
    endpoints: (builder) => ({

        // GET /api/v1/raw-material-stocks — joriy qoldiqlar
        getRawMaterialStocks: builder.query({
            query: ({ rawMaterialId, warehouseId, lowStock, unit = 'KG', page = 0, size = 20, sort } = {}) => ({
                url: '/raw-material-stocks',
                method: 'GET',
                params: {
                    ...(rawMaterialId ? { rawMaterialId } : {}),
                    ...(warehouseId   ? { warehouseId }   : {}),
                    ...(lowStock === true ? { lowStock: true } : {}),
                    unit,
                    page,
                    size,
                    ...(sort ? { sort } : {}),
                },
            }),
            transformResponse: (response) => ({
                items:      response.data       ?? [],
                pagination: response.pagination ?? null,
            }),
            providesTags: [{ type: 'RawMaterialStock', id: 'LIST' }],
        }),

        // GET /api/v1/raw-material-stock-transactions — kirim/chiqim tarixi
        getRawMaterialTransactions: builder.query({
            query: ({ rawMaterialId, warehouseId, action, unit = 'KG', dateFrom, dateTo, page = 0, size = 20 } = {}) => ({
                url: '/raw-material-stock-transactions',
                method: 'GET',
                params: {
                    ...(rawMaterialId ? { rawMaterialId } : {}),
                    ...(warehouseId   ? { warehouseId }   : {}),
                    ...(action        ? { action }        : {}),
                    ...(dateFrom      ? { dateFrom }      : {}),
                    ...(dateTo        ? { dateTo }        : {}),
                    unit,
                    page,
                    size,
                },
            }),
            providesTags: [{ type: 'RawMaterialTransaction', id: 'LIST' }],
        }),

        // GET /api/v1/raw-material-stock-transactions/summary — yig'indi
        getRawMaterialTransactionsSummary: builder.query({
            query: ({ warehouseId, action, fromDateTime, toDateTime, unit = 'KG' } = {}) => ({
                url: '/raw-material-stock-transactions/summary',
                method: 'GET',
                params: {
                    warehouseId,
                    action,
                    ...(fromDateTime ? { fromDateTime } : {}),
                    ...(toDateTime   ? { toDateTime }   : {}),
                    unit,
                },
            }),
            transformResponse: (response) => response.data ?? [],
            providesTags: [{ type: 'RawMaterialTransaction', id: 'SUMMARY' }],
        }),

        // POST /api/v1/raw-material-stock-transactions — kirim yoki chiqim
        createRawMaterialTransaction: builder.mutation({
            query: (data) => ({
                url: '/raw-material-stock-transactions',
                method: 'POST',
                data,
            }),
            invalidatesTags: [
                { type: 'RawMaterialStock',       id: 'LIST' },
                { type: 'RawMaterialTransaction', id: 'LIST' },
            ],
        }),
    }),
});

export const {
    useGetRawMaterialStocksQuery,
    useGetRawMaterialTransactionsQuery,
    useGetRawMaterialTransactionsSummaryQuery,
    useCreateRawMaterialTransactionMutation,
} = rawMaterialStockApi;
