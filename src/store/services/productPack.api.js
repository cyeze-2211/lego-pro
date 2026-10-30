import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';
import { productStockApi } from './productStock.api';

/*
 * Pachkalar (product packs). Stanokdan chiqqan har bir pachkaning o‘z 13 xonali barcode‘i bor.
 * Qoldiq ikki qismdan iborat: barcode‘li pachkalar (packQuantity) va donaviy qoldiq (pieceQuantity).
 * - GET /product-packs?productId&warehouseId&status — ro‘yxat (IN_STOCK | SHIPPED | OPENED)
 * - GET /product-packs/by-barcode/{barcode} — skanerlangan kod qaysi pachka (mahsulot, dona, ombor, stanok, vaqt)
 * - POST /product-packs { productId, warehouseId, packQuantity } — donaviy qoldiqdan pachka yaratish (yorliq uchun)
 * Yorliq: GET /product-packs/label?ids=…&copies=N yoki /product-packs/{id}/label — labelPrinter.js da.
 */
export const PACK_STATUS_LABEL = {
    IN_STOCK: 'Omborda',
    SHIPPED: 'Chiqib ketgan',
    OPENED: 'Ochilgan',
};

export const productPackApi = createApi({
    reducerPath: 'productPackApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['ProductPack'],
    endpoints: (builder) => ({
        getProductPacks: builder.query({
            query: ({ productId, warehouseId, status, page = 0, size = 20, sort } = {}) => ({
                url: '/product-packs',
                method: 'GET',
                params: {
                    ...(productId ? { productId } : {}),
                    ...(warehouseId ? { warehouseId } : {}),
                    ...(status ? { status } : {}),
                    page,
                    size,
                    ...(sort ? { sort } : {}),
                },
            }),
            transformResponse: (response) => ({
                items: response.data ?? [],
                pagination: response.pagination ?? null,
            }),
            providesTags: [{ type: 'ProductPack', id: 'LIST' }],
        }),

        getPackByBarcode: builder.query({
            query: (barcode) => ({ url: `/product-packs/by-barcode/${encodeURIComponent(barcode)}`, method: 'GET' }),
            transformResponse: (response) => response.data,
            // Pachka holati har harakatda o‘zgaradi — keshlamaymiz
            keepUnusedDataFor: 0,
        }),

        createProductPacks: builder.mutation({
            query: (data) => ({ url: '/product-packs', method: 'POST', data }),
            transformResponse: (response) => response.data ?? [],
            invalidatesTags: [{ type: 'ProductPack', id: 'LIST' }],
            // Donaviy qoldiq pachkalarga o‘tadi — qoldiqlar ro‘yxati yangilansin
            onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
                try {
                    await queryFulfilled;
                    dispatch(productStockApi.util.invalidateTags([{ type: 'ProductStock', id: 'LIST' }]));
                } catch { /* xatolik chaqiruvchi tomonda ko‘rsatiladi */ }
            },
        }),
    }),
});

export const {
    useGetProductPacksQuery,
    useLazyGetProductPacksQuery,
    useLazyGetPackByBarcodeQuery,
    useCreateProductPacksMutation,
} = productPackApi;
