import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';
import { machineApi } from './machine.api';
import { machineOutputApi } from './machineOutput.api';

export const productStockApi = createApi({
    reducerPath: 'productStockApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['ProductStock', 'StockTransaction'],
    endpoints: (builder) => ({

        // GET /api/v1/product-stocks — joriy qoldiqlar
        getProductStocks: builder.query({
            query: ({
                productId, warehouseId, name, barcode, article, productSize, brandId,
                colorId, categoryId,
                lowStock, priceFrom, priceTo, pending, page = 0, size = 20, sort,
            } = {}) => {
                const params = pending === true
                    ? {
                        ...(productId ? { productId } : {}),
                        pending: true,
                    }
                    : {
                        ...(productId   ? { productId }   : {}),
                        ...(warehouseId ? { warehouseId } : {}),
                        ...(name        ? { name }        : {}),
                        ...(barcode     ? { barcode }     : {}),
                        ...(article     ? { article }     : {}),
                        ...(productSize ? { productSize } : {}),
                        ...(brandId     ? { brandId }     : {}),
                        ...(colorId     ? { colorId }     : {}),
                        ...(categoryId  ? { categoryId }  : {}),
                        ...(lowStock === true ? { lowStock: true } : {}),
                        ...(priceFrom != null ? { priceFrom } : {}),
                        ...(priceTo   != null ? { priceTo }   : {}),
                        page,
                        size,
                        ...(sort ? { sort } : {}),
                    };
                return {
                    url: '/product-stocks',
                    method: 'GET',
                    params,
                };
            },
            transformResponse: (response) => ({
                items:      response.data       ?? [],
                pagination: response.pagination ?? null,
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
            // PRODUCE stanok holati va ishlab chiqarish tarixini o‘zgartiradi — ularning keshini ham yangilaymiz
            onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
                try {
                    await queryFulfilled;
                    if (arg?.machineId) {
                        dispatch(machineApi.util.invalidateTags([{ type: 'Machine', id: arg.machineId }, { type: 'Machine', id: 'LIST' }]));
                        dispatch(machineOutputApi.util.invalidateTags(['MachineOutput']));
                    }
                } catch { /* xatolik chaqiruvchi tomonda ko‘rsatiladi */ }
            },
        }),
    }),
});

export const {
    useGetProductStocksQuery,
    useGetStockTransactionsQuery,
    useCreateStockTransactionMutation,
} = productStockApi;
