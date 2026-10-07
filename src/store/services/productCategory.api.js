import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';

export const productCategoryApi = createApi({
    reducerPath: 'productCategoryApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['ProductCategory'],
    endpoints: (builder) => ({
        getProductCategories: builder.query({
            query: ({ name, page = 0, size = 20, sort = ['createdAt,DESC', 'id,DESC'] } = {}) => ({
                url: '/product-categories',
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
                          ...result.items.map(({ id }) => ({ type: 'ProductCategory', id })),
                          { type: 'ProductCategory', id: 'LIST' },
                      ]
                    : [{ type: 'ProductCategory', id: 'LIST' }],
        }),

        getProductCategoryById: builder.query({
            query: (id) => ({
                url: `/product-categories/${id}`,
                method: 'GET',
            }),
            transformResponse: (response) => response.data,
            providesTags: (result, error, id) => [{ type: 'ProductCategory', id }],
        }),

        createProductCategory: builder.mutation({
            query: (data) => ({
                url: '/product-categories',
                method: 'POST',
                data,
            }),
            transformResponse: (response) => response.data,
            invalidatesTags: [{ type: 'ProductCategory', id: 'LIST' }],
        }),

        updateProductCategory: builder.mutation({
            query: ({ id, data }) => ({
                url: `/product-categories/${id}`,
                method: 'PUT',
                data,
            }),
            transformResponse: (response) => response.data,
            invalidatesTags: (result, error, { id }) => [
                { type: 'ProductCategory', id },
                { type: 'ProductCategory', id: 'LIST' },
            ],
        }),

        deleteProductCategory: builder.mutation({
            query: (id) => ({
                url: `/product-categories/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, id) => [
                { type: 'ProductCategory', id },
                { type: 'ProductCategory', id: 'LIST' },
            ],
        }),
    }),
});

export const {
    useGetProductCategoriesQuery,
    useGetProductCategoryByIdQuery,
    useCreateProductCategoryMutation,
    useUpdateProductCategoryMutation,
    useDeleteProductCategoryMutation,
} = productCategoryApi;
