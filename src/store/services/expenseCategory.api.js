import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';

export const expenseCategoryApi = createApi({
    reducerPath: 'expenseCategoryApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['ExpenseCategory'],
    endpoints: (builder) => ({
        getExpenseCategories: builder.query({
            query: ({ name, page = 0, size = 20, sort = ['createdAt,DESC', 'id,DESC'] } = {}) => ({
                url: '/expense-categories',
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
                          ...result.items.map(({ id }) => ({ type: 'ExpenseCategory', id })),
                          { type: 'ExpenseCategory', id: 'LIST' },
                      ]
                    : [{ type: 'ExpenseCategory', id: 'LIST' }],
        }),

        getExpenseCategoryById: builder.query({
            query: (id) => ({
                url: `/expense-categories/${id}`,
                method: 'GET',
            }),
            transformResponse: (response) => response.data,
            providesTags: (result, error, id) => [{ type: 'ExpenseCategory', id }],
        }),

        createExpenseCategory: builder.mutation({
            query: (data) => ({
                url: '/expense-categories',
                method: 'POST',
                data,
            }),
            transformResponse: (response) => response.data,
            invalidatesTags: [{ type: 'ExpenseCategory', id: 'LIST' }],
        }),

        updateExpenseCategory: builder.mutation({
            query: ({ id, data }) => ({
                url: `/expense-categories/${id}`,
                method: 'PUT',
                data,
            }),
            transformResponse: (response) => response.data,
            invalidatesTags: (result, error, { id }) => [
                { type: 'ExpenseCategory', id },
                { type: 'ExpenseCategory', id: 'LIST' },
            ],
        }),

        deleteExpenseCategory: builder.mutation({
            query: (id) => ({
                url: `/expense-categories/${id}`,
                method: 'DELETE',
            }),
            transformResponse: (response) => response.data,
            invalidatesTags: (result, error, id) => [
                { type: 'ExpenseCategory', id },
                { type: 'ExpenseCategory', id: 'LIST' },
            ],
        }),
    }),
});

export const {
    useGetExpenseCategoriesQuery,
    useGetExpenseCategoryByIdQuery,
    useCreateExpenseCategoryMutation,
    useUpdateExpenseCategoryMutation,
    useDeleteExpenseCategoryMutation,
} = expenseCategoryApi;
