import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';

export const customerApi = createApi({
  reducerPath: 'customerApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Customer'],
  endpoints: (builder) => ({
    // GET /api/v1/customers — sahifalangan ro'yxat (name filtri bilan)
    getCustomers: builder.query({
      query: ({ name, page = 0, size = 12, sort = ['createdAt,DESC', 'id,DESC'] } = {}) => ({
        url: '/customers',
        method: 'GET',
        params: { ...(name ? { name } : {}), page, size, sort },
      }),
      transformResponse: (response) => ({ items: response.data, pagination: response.pagination }),
      providesTags: [{ type: 'Customer', id: 'LIST' }],
    }),

    // GET /api/v1/customers/{id} — bitta mijoz
    getCustomerById: builder.query({
      query: (id) => ({
        url: `/customers/${id}`,
        method: 'GET',
      }),
      transformResponse: (response) => response.data,
      providesTags: (result, error, id) => [{ type: 'Customer', id }],
    }),

    // POST /api/v1/customers — yangi mijoz yaratish
    createCustomer: builder.mutation({
      query: (data) => ({
        url: '/customers',
        method: 'POST',
        data,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: [{ type: 'Customer', id: 'LIST' }],
    }),

    // PUT /api/v1/customers/{id} — mijozni to'liq yangilash (name + phone + summary + balance)
    updateCustomer: builder.mutation({
      query: ({ id, data }) => ({
        url: `/customers/${id}`,
        method: 'PUT',
        data,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: (result, error, { id }) => [{ type: 'Customer', id }, { type: 'Customer', id: 'LIST' }],
    }),

    // DELETE /api/v1/customers/{id} — soft-delete
    deleteCustomer: builder.mutation({
      query: (id) => ({
        url: `/customers/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (response) => response.data, // doim null
      invalidatesTags: (result, error, id) => [{ type: 'Customer', id }, { type: 'Customer', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetCustomersQuery,
  useGetCustomerByIdQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
} = customerApi;
