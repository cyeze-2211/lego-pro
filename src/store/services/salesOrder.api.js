import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';

export const salesOrderApi = createApi({
  reducerPath: 'salesOrderApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['SalesOrder'],
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

    createSalesOrder: builder.mutation({
      query: (data) => ({ url: '/sales-orders', method: 'POST', data }),
      transformResponse: (response) => response.data,
      invalidatesTags: [{ type: 'SalesOrder', id: 'LIST' }],
    }),

    updateSalesOrder: builder.mutation({
      query: ({ id, data }) => ({ url: `/sales-orders/${id}`, method: 'PUT', data }),
      transformResponse: (response) => response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: 'SalesOrder', id },
        { type: 'SalesOrder', id: 'LIST' },
      ],
    }),

    deleteSalesOrder: builder.mutation({
      query: (id) => ({ url: `/sales-orders/${id}`, method: 'DELETE' }),
      transformResponse: (response) => response.data,
      invalidatesTags: (result, error, id) => [
        { type: 'SalesOrder', id },
        { type: 'SalesOrder', id: 'LIST' },
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
      ],
    }),

    // Eski endpointlar (agar biror joyda ishlatilsa)
    approveSalesOrder: builder.mutation({
      query: (id) => ({ url: `/sales-orders/${id}/approve`, method: 'POST' }),
      transformResponse: (response) => response.data,
      invalidatesTags: (result, error, id) => [
        { type: 'SalesOrder', id },
        { type: 'SalesOrder', id: 'LIST' },
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
      ],
    }),
  }),
});

export const {
  useGetSalesOrdersQuery,
  useGetSalesOrderByIdQuery,
  useCreateSalesOrderMutation,
  useUpdateSalesOrderMutation,
  useDeleteSalesOrderMutation,
  useUpdateSalesOrderStatusMutation,
  useApproveSalesOrderMutation,
  useRejectSalesOrderMutation,
  useUpdateSalesOrderPricesMutation,
} = salesOrderApi;