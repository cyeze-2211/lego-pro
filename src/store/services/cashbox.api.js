import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';

export const cashboxApi = createApi({
    reducerPath: 'cashboxApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['Cashbox'],
    endpoints: (builder) => ({
        // GET /api/v1/cashboxes – barcha faol kassalar (A–Z, pagination yo'q)
        getCashboxes: builder.query({
            query: () => ({
                url: '/cashboxes',
                method: 'GET',
            }),
            transformResponse: (response) => response.data || [],
            providesTags: (result) =>
                result
                    ? [
                          ...result.map(({ id }) => ({ type: 'Cashbox', id })),
                          { type: 'Cashbox', id: 'LIST' },
                      ]
                    : [{ type: 'Cashbox', id: 'LIST' }],
        }),

        // GET /api/v1/cashboxes/{id} – bitta kassa
        getCashboxById: builder.query({
            query: (id) => ({
                url: `/cashboxes/${id}`,
                method: 'GET',
            }),
            transformResponse: (response) => response.data,
            providesTags: (result, error, id) => [{ type: 'Cashbox', id }],
        }),

        // POST /api/v1/cashboxes – yangi kassa (balance = 0)
        createCashbox: builder.mutation({
            query: (data) => ({
                url: '/cashboxes',
                method: 'POST',
                data,
            }),
            transformResponse: (response) => response.data,
            invalidatesTags: [{ type: 'Cashbox', id: 'LIST' }],
        }),

        // PUT /api/v1/cashboxes/{id} – name + summary (balance o'zgarmaydi)
        updateCashbox: builder.mutation({
            query: ({ id, data }) => ({
                url: `/cashboxes/${id}`,
                method: 'PUT',
                data,
            }),
            transformResponse: (response) => response.data,
            invalidatesTags: (result, error, { id }) => [
                { type: 'Cashbox', id },
                { type: 'Cashbox', id: 'LIST' },
            ],
        }),

        // DELETE /api/v1/cashboxes/{id} – soft delete
        deleteCashbox: builder.mutation({
            query: (id) => ({
                url: `/cashboxes/${id}`,
                method: 'DELETE',
            }),
            transformResponse: (response) => response.data,
            invalidatesTags: (result, error, id) => [
                { type: 'Cashbox', id },
                { type: 'Cashbox', id: 'LIST' },
            ],
        }),
    }),
});

export const {
    useGetCashboxesQuery,
    useGetCashboxByIdQuery,
    useCreateCashboxMutation,
    useUpdateCashboxMutation,
    useDeleteCashboxMutation,
} = cashboxApi;
