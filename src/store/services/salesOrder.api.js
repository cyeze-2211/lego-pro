import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';

export const salesOrderApi = createApi({
  reducerPath: 'salesOrderApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['SalesOrder'],
  endpoints: (builder) => ({
    // GET /api/v1/sales-orders — zayavkalarni filtrlab, sahifalab qaytaradi
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
          page,
          size,
          sort,
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

    // GET /api/v1/sales-orders/{id} — bitta zayavka items bilan
    getSalesOrderById: builder.query({
      query: (id) => ({
        url: `/sales-orders/${id}`,
        method: 'GET',
      }),
      transformResponse: (response) => response.data,
      providesTags: (result, error, id) => [{ type: 'SalesOrder', id }],
    }),

    // POST /api/v1/sales-orders — yangi zayavka yaratish (PENDING)
    createSalesOrder: builder.mutation({
      query: (data) => ({
        url: '/sales-orders',
        method: 'POST',
        data,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: [{ type: 'SalesOrder', id: 'LIST' }],
    }),

    // PUT /api/v1/sales-orders/{id} — PENDING zayavkani to'liq yangilash
    updateSalesOrder: builder.mutation({
      query: ({ id, data }) => ({
        url: `/sales-orders/${id}`,
        method: 'PUT',
        data,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: 'SalesOrder', id },
        { type: 'SalesOrder', id: 'LIST' },
      ],
    }),

    // DELETE /api/v1/sales-orders/{id} — PENDING zayavkani soft-delete
    deleteSalesOrder: builder.mutation({
      query: (id) => ({
        url: `/sales-orders/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (response) => response.data, // doim null
      invalidatesTags: (result, error, id) => [
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
} = salesOrderApi;
