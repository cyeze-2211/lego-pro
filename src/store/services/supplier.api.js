import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';

export const supplierApi = createApi({
    reducerPath: 'supplierApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['Supplier'],
    endpoints: (builder) => ({
        getSuppliers: builder.query({
            query: ({ name, regionId, page = 0, size = 20, sort = ['createdAt,DESC', 'id,DESC'] } = {}) => ({
                url: '/suppliers',
                method: 'GET',
                params: {
                    ...(name ? { name } : {}),
                    ...(regionId != null && regionId !== '' ? { regionId } : {}),
                    page,
                    size,
                    sort,
                },
            }),
            transformResponse: (response) => ({
                items: response.data ?? [],
                pagination: response.pagination ?? null,
            }),
            providesTags: (result) => result?.items
                ? [
                    ...result.items.map(({ id }) => ({ type: 'Supplier', id })),
                    { type: 'Supplier', id: 'LIST' },
                ]
                : [{ type: 'Supplier', id: 'LIST' }],
        }),
        getSupplierById: builder.query({
            query: (id) => ({ url: `/suppliers/${id}`, method: 'GET' }),
            transformResponse: (response) => response.data,
            providesTags: (result, error, id) => [{ type: 'Supplier', id }],
        }),
        createSupplier: builder.mutation({
            query: (data) => ({ url: '/suppliers', method: 'POST', data }),
            transformResponse: (response) => response.data,
            invalidatesTags: [{ type: 'Supplier', id: 'LIST' }],
        }),
        updateSupplier: builder.mutation({
            query: ({ id, data }) => ({ url: `/suppliers/${id}`, method: 'PUT', data }),
            transformResponse: (response) => response.data,
            invalidatesTags: (result, error, { id }) => [
                { type: 'Supplier', id },
                { type: 'Supplier', id: 'LIST' },
            ],
        }),
        deleteSupplier: builder.mutation({
            query: (id) => ({ url: `/suppliers/${id}`, method: 'DELETE' }),
            transformResponse: (response) => response.data,
            invalidatesTags: (result, error, id) => [
                { type: 'Supplier', id },
                { type: 'Supplier', id: 'LIST' },
            ],
        }),
    }),
});

export const {
    useGetSuppliersQuery,
    useGetSupplierByIdQuery,
    useCreateSupplierMutation,
    useUpdateSupplierMutation,
    useDeleteSupplierMutation,
} = supplierApi;
