import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';

export const productColorApi = createApi({
    reducerPath: 'productColorApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['ProductColor'],
    endpoints: (builder) => ({
        getProductColors: builder.query({
            query: ({ name, page = 0, size = 20, sort = ['createdAt,DESC', 'id,DESC'] } = {}) => ({
                url: '/product-colors',
                method: 'GET',
                params: {
                    ...(name ? { name } : {}),
                    page,
                    size,
                    sort,
                },
            }),
            transformResponse: (response) => ({
                items: response.data ?? [],
                pagination: response.pagination ?? null,
            }),
            providesTags: (result) =>
                result?.items
                    ? [
                          ...result.items.map(({ id }) => ({ type: 'ProductColor', id })),
                          { type: 'ProductColor', id: 'LIST' },
                      ]
                    : [{ type: 'ProductColor', id: 'LIST' }],
        }),

        getProductColorById: builder.query({
            query: (id) => ({
                url: `/product-colors/${id}`,
                method: 'GET',
            }),
            transformResponse: (response) => response.data,
            providesTags: (result, error, id) => [{ type: 'ProductColor', id }],
        }),

        createProductColor: builder.mutation({
            query: (data) => ({
                url: '/product-colors',
                method: 'POST',
                data,
            }),
            transformResponse: (response) => response.data,
            invalidatesTags: [{ type: 'ProductColor', id: 'LIST' }],
        }),

        updateProductColor: builder.mutation({
            query: ({ id, data }) => ({
                url: `/product-colors/${id}`,
                method: 'PUT',
                data,
            }),
            transformResponse: (response) => response.data,
            invalidatesTags: (result, error, { id }) => [
                { type: 'ProductColor', id },
                { type: 'ProductColor', id: 'LIST' },
            ],
        }),

        deleteProductColor: builder.mutation({
            query: (id) => ({
                url: `/product-colors/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, id) => [
                { type: 'ProductColor', id },
                { type: 'ProductColor', id: 'LIST' },
            ],
        }),
    }),
});

export const {
    useGetProductColorsQuery,
    useGetProductColorByIdQuery,
    useCreateProductColorMutation,
    useUpdateProductColorMutation,
    useDeleteProductColorMutation,
} = productColorApi;
