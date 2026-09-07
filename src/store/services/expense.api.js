import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';
import { cashboxApi } from './cashbox.api';

const refreshCashboxes = (dispatch) =>
    dispatch(cashboxApi.util.invalidateTags([{ type: 'Cashbox', id: 'LIST' }]));

export const expenseApi = createApi({
    reducerPath: 'expenseApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['Expense'],
    endpoints: (builder) => ({
        getExpenses: builder.query({
            query: ({ cashboxId, dateFrom, dateTo, page = 0, size = 20, sort = ['expenseDate,DESC', 'id,DESC'] } = {}) => ({
                url: '/expenses', method: 'GET', params: { ...(cashboxId && { cashboxId }), ...(dateFrom && { dateFrom }), ...(dateTo && { dateTo }), page, size, sort },
            }),
            transformResponse: (response) => ({ items: response.data || [], pagination: response.pagination }),
            providesTags: [{ type: 'Expense', id: 'LIST' }],
        }),
        getExpenseById: builder.query({
            query: (id) => ({ url: `/expenses/${id}`, method: 'GET' }),
            transformResponse: (response) => response.data,
            providesTags: (result, error, id) => [{ type: 'Expense', id }],
        }),
        createExpense: builder.mutation({
            query: (data) => ({ url: '/expenses', method: 'POST', data }),
            transformResponse: (response) => response.data,
            invalidatesTags: [{ type: 'Expense', id: 'LIST' }],
            onQueryStarted: async (arg, { dispatch, queryFulfilled }) => { try { await queryFulfilled; refreshCashboxes(dispatch); } catch { /* mutation errors are shown by the caller */ } },
        }),
        updateExpense: builder.mutation({
            query: ({ id, data }) => ({ url: `/expenses/${id}`, method: 'PUT', data }),
            transformResponse: (response) => response.data,
            invalidatesTags: (result, error, { id }) => [{ type: 'Expense', id }, { type: 'Expense', id: 'LIST' }],
            onQueryStarted: async (arg, { dispatch, queryFulfilled }) => { try { await queryFulfilled; refreshCashboxes(dispatch); } catch { /* mutation errors are shown by the caller */ } },
        }),
        deleteExpense: builder.mutation({
            query: (id) => ({ url: `/expenses/${id}`, method: 'DELETE' }),
            transformResponse: (response) => response.data,
            invalidatesTags: (result, error, id) => [{ type: 'Expense', id }, { type: 'Expense', id: 'LIST' }],
            onQueryStarted: async (arg, { dispatch, queryFulfilled }) => { try { await queryFulfilled; refreshCashboxes(dispatch); } catch { /* mutation errors are shown by the caller */ } },
        }),
    }),
});

export const { useGetExpensesQuery, useGetExpenseByIdQuery, useCreateExpenseMutation, useUpdateExpenseMutation, useDeleteExpenseMutation } = expenseApi;
