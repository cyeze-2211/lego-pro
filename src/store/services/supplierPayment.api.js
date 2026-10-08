import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';
import { cashboxApi } from './cashbox.api';
import { supplierApi } from './supplier.api';

export const supplierPaymentApi = createApi({
    reducerPath: 'supplierPaymentApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['SupplierPayment'],
    endpoints: (builder) => ({
        getSupplierPayments: builder.query({
            query: ({
                supplierId,
                cashboxId,
                status,
                paidFrom,
                paidTo,
                page = 0,
                size = 20,
                sort = ['paidAt,DESC', 'createdAt,DESC'],
            } = {}) => ({
                url: '/supplier-payments',
                method: 'GET',
                params: {
                    ...(supplierId ? { supplierId } : {}),
                    ...(cashboxId ? { cashboxId } : {}),
                    ...(status ? { status } : {}),
                    ...(paidFrom ? { paidFrom } : {}),
                    ...(paidTo ? { paidTo } : {}),
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
                    ...result.items.map(({ id }) => ({ type: 'SupplierPayment', id })),
                    { type: 'SupplierPayment', id: 'LIST' },
                ]
                : [{ type: 'SupplierPayment', id: 'LIST' }],
        }),
        getSupplierPaymentById: builder.query({
            query: (id) => ({ url: `/supplier-payments/${id}`, method: 'GET' }),
            transformResponse: (response) => response.data,
            providesTags: (result, error, id) => [{ type: 'SupplierPayment', id }],
        }),
        createSupplierPayment: builder.mutation({
            query: (data) => ({ url: '/supplier-payments', method: 'POST', data }),
            transformResponse: (response) => response.data,
            invalidatesTags: [{ type: 'SupplierPayment', id: 'LIST' }],
            onQueryStarted: async ({ supplierId, cashboxId }, { dispatch, queryFulfilled }) => {
                try {
                    await queryFulfilled;
                    dispatch(supplierApi.util.invalidateTags([
                        { type: 'Supplier', id: supplierId },
                        { type: 'Supplier', id: 'LIST' },
                    ]));
                    dispatch(cashboxApi.util.invalidateTags([
                        { type: 'Cashbox', id: cashboxId },
                        { type: 'Cashbox', id: 'LIST' },
                    ]));
                } catch {
                    // Mutation errors are displayed by the calling form.
                }
            },
        }),
        cancelSupplierPayment: builder.mutation({
            query: ({ id }) => ({ url: `/supplier-payments/${id}/cancel`, method: 'POST' }),
            transformResponse: (response) => response.data,
            invalidatesTags: (result, error, { id }) => [
                { type: 'SupplierPayment', id },
                { type: 'SupplierPayment', id: 'LIST' },
            ],
            onQueryStarted: async ({ supplierId, cashboxId }, { dispatch, queryFulfilled }) => {
                try {
                    await queryFulfilled;
                    dispatch(supplierApi.util.invalidateTags([
                        { type: 'Supplier', id: supplierId },
                        { type: 'Supplier', id: 'LIST' },
                    ]));
                    dispatch(cashboxApi.util.invalidateTags([
                        { type: 'Cashbox', id: cashboxId },
                        { type: 'Cashbox', id: 'LIST' },
                    ]));
                } catch {
                    // Mutation errors are displayed by the calling page.
                }
            },
        }),
    }),
});

export const {
    useGetSupplierPaymentsQuery,
    useGetSupplierPaymentByIdQuery,
    useCreateSupplierPaymentMutation,
    useCancelSupplierPaymentMutation,
} = supplierPaymentApi;
