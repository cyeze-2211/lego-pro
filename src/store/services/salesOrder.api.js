import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';

export const salesOrderApi = createApi({
  reducerPath: 'salesOrderApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['SalesOrder', 'ProductShortages', 'SalesOrderDashboard'],
  endpoints: (builder) => ({
    getSalesOrders: builder.query({
      query: ({ customerId, status, productId, warehouseId, dateFrom, dateTo, page = 0, size = 20, sort = ['createdAt,DESC', 'id,DESC'] } = {}) => ({
        url: '/sales-orders',
        method: 'GET',
        params: {
          ...(customerId  ? { customerId }  : {}),
          ...(status      ? { status }      : {}),
          ...(productId   ? { productId }   : {}),
          ...(warehouseId ? { warehouseId } : {}),
          ...(dateFrom    ? { dateFrom }    : {}),
          ...(dateTo      ? { dateTo }      : {}),
          page, size, sort,
        },
      }),
      transformResponse: (response) => ({
        items: response.data || [],
        pagination: response.pagination || null,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: 'SalesOrder', id })),
              { type: 'SalesOrder', id: 'LIST' },
            ]
          : [{ type: 'SalesOrder', id: 'LIST' }],
    }),

    getSalesOrderById: builder.query({
      query: (id) => ({ url: `/sales-orders/${id}`, method: 'GET' }),
      transformResponse: (response) => response.data,
      providesTags: (result, error, id) => [{ type: 'SalesOrder', id }],
    }),

    /* ── Dashboard: zayavkalar soni holatlar bo'yicha ── */
    getSalesOrderDashboard: builder.query({
      query: () => ({
        url: '/sales-orders/dashboard',
        method: 'GET',
      }),
      transformResponse: (response) =>
        response.data || {
          total: 0,
          created: 0,
          loaded: 0,
          confirmed: 0,
          rejected: 0,
        },
      providesTags: [{ type: 'SalesOrderDashboard', id: 'LIST' }],
    }),

    /* ── Zayavkalar bo'yicha yetishmayotgan mahsulotlar ── */
    getProductShortages: builder.query({
      query: () => ({
        url: '/sales-orders/product-shortages',
        method: 'GET',
      }),
      transformResponse: (response) => response.data || [],
      providesTags: [{ type: 'ProductShortages', id: 'LIST' }],
    }),

    createSalesOrder: builder.mutation({
      query: (data) => ({ url: '/sales-orders', method: 'POST', data }),
      transformResponse: (response) => response.data,
      invalidatesTags: [
        { type: 'SalesOrder', id: 'LIST' },
        { type: 'SalesOrderDashboard', id: 'LIST' },
        { type: 'ProductShortages', id: 'LIST' },
      ],
    }),

    updateSalesOrder: builder.mutation({
      query: ({ id, data }) => ({ url: `/sales-orders/${id}`, method: 'PUT', data }),
      transformResponse: (response) => response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: 'SalesOrder', id },
        { type: 'SalesOrder', id: 'LIST' },
        { type: 'SalesOrderDashboard', id: 'LIST' },
        { type: 'ProductShortages', id: 'LIST' },
      ],
    }),

    deleteSalesOrder: builder.mutation({
      query: (id) => ({ url: `/sales-orders/${id}`, method: 'DELETE' }),
      transformResponse: (response) => response.data,
      invalidatesTags: (result, error, id) => [
        { type: 'SalesOrder', id },
        { type: 'SalesOrder', id: 'LIST' },
        { type: 'SalesOrderDashboard', id: 'LIST' },
        { type: 'ProductShortages', id: 'LIST' },
      ],
    }),

    // PATCH /api/v1/sales-orders/{id}/status — universal status o'zgartirish
    updateSalesOrderStatus: builder.mutation({
      query: ({ id, status, reason }) => ({
        url: `/sales-orders/${id}/status`,
        method: 'PATCH',
        data: { status, ...(reason ? { reason } : {}) },
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: 'SalesOrder', id },
        { type: 'SalesOrder', id: 'LIST' },
        { type: 'SalesOrderDashboard', id: 'LIST' },
        { type: 'ProductShortages', id: 'LIST' },
      ],
    }),

    /* ── Yakuniy tasdiqlash: POST /api/v1/sales-orders/{id}/confirm ──
     * LOADED zayavkani CONFIRMED holatiga o'tkazadi.
     * Bitta tranzaksiyada:
     *   - mijoz balansi totalAmount ga kamayadi (qarzga aylanadi),
     *   - decidedAt to'ladi,
     *   - avans bo'lsa paidAmount ga o'tadi (PARTIALLY_PAID / PAID).
     * Tanasi yo'q. Faqat LOADED holatdan ishlaydi. */
    confirmSalesOrder: builder.mutation({
      query: (id) => ({
        url: `/sales-orders/${id}/confirm`,
        method: 'POST',
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: (result, error, id) => [
        { type: 'SalesOrder', id },
        { type: 'SalesOrder', id: 'LIST' },
        { type: 'SalesOrderDashboard', id: 'LIST' },
        { type: 'ProductShortages', id: 'LIST' },
      ],
    }),

    // Eski endpointlar (agar biror joyda ishlatilsa)
    approveSalesOrder: builder.mutation({
      query: (id) => ({ url: `/sales-orders/${id}/approve`, method: 'POST' }),
      transformResponse: (response) => response.data,
      invalidatesTags: (result, error, id) => [
        { type: 'SalesOrder', id },
        { type: 'SalesOrder', id: 'LIST' },
        { type: 'SalesOrderDashboard', id: 'LIST' },
        { type: 'ProductShortages', id: 'LIST' },
      ],
    }),

    rejectSalesOrder: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/sales-orders/${id}/reject`,
        method: 'POST',
        data: reason ? { reason } : undefined,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: 'SalesOrder', id },
        { type: 'SalesOrder', id: 'LIST' },
        { type: 'SalesOrderDashboard', id: 'LIST' },
        { type: 'ProductShortages', id: 'LIST' },
      ],
    }),

    loadSalesOrder: builder.mutation({
      query: (id) => ({ url: `/sales-orders/${id}/load`, method: 'POST' }),
      transformResponse: (response) => response.data,
      invalidatesTags: (result, error, id) => [
        { type: 'SalesOrder', id },
        { type: 'SalesOrder', id: 'LIST' },
        { type: 'SalesOrderDashboard', id: 'LIST' },
        { type: 'ProductShortages', id: 'LIST' },
      ],
    }),

    updateSalesOrderPrices: builder.mutation({
      query: ({ id, data }) => ({
        url: `/sales-orders/${id}/prices`,
        method: 'PATCH',
        data,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: 'SalesOrder', id },
        { type: 'SalesOrder', id: 'LIST' },
        { type: 'SalesOrderDashboard', id: 'LIST' },
        { type: 'ProductShortages', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetSalesOrdersQuery,
  useGetSalesOrderByIdQuery,
  useGetSalesOrderDashboardQuery,
  useGetProductShortagesQuery,
  useCreateSalesOrderMutation,
  useUpdateSalesOrderMutation,
  useDeleteSalesOrderMutation,
  useUpdateSalesOrderStatusMutation,
  useConfirmSalesOrderMutation,
  useApproveSalesOrderMutation,
  useRejectSalesOrderMutation,
  useLoadSalesOrderMutation,
  useUpdateSalesOrderPricesMutation,
} = salesOrderApi;