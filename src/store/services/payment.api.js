import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';
import { customerApi } from './customer.api';
import { cashboxApi } from './cashbox.api';

const refreshCustomer = (customerId, dispatch) => {
    // mijoz balansi ro‘yxatda ham ko‘rinadi — LIST ni ham yangilaymiz
    dispatch(customerApi.util.invalidateTags([
        ...(customerId ? [{ type: 'Customer', id: customerId }] : []),
        { type: 'Customer', id: 'LIST' },
    ]));
};

export const paymentApi = createApi({
    reducerPath: 'paymentApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['Payment'],
    endpoints: (builder) => ({
        // GET /api/v1/payments – to'lovlarni filtrlab qaytaradi
        getPayments: builder.query({
            query: ({ customerId, cashboxId, salesOrderId, status, paidFrom, paidTo, page = 0, size = 20, sort = ['paidAt,DESC', 'createdAt,DESC'] } = {}) => ({
                url: '/payments',
                method: 'GET',
                params: {
                    ...(customerId && { customerId }),
                    ...(cashboxId && { cashboxId }),
                    ...(salesOrderId && { salesOrderId }),
                    ...(status && { status }),
                    ...(paidFrom && { paidFrom }),
                    ...(paidTo && { paidTo }),
                    page,
                    size,
                    sort,
                },
            }),
            transformResponse: (response) => ({ items: response.data || [], pagination: response.pagination }),
            providesTags: [{ type: 'Payment', id: 'LIST' }],
        }),

        // GET /api/v1/payments/{id} – bitta to'lov
        getPaymentById: builder.query({
            query: (id) => ({ url: `/payments/${id}`, method: 'GET' }),
            transformResponse: (response) => response.data,
            providesTags: (result, error, id) => [{ type: 'Payment', id }],
        }),

        // POST /api/v1/payments – to'lov qabul qilish
        createPayment: builder.mutation({
            query: (data) => ({ url: '/payments', method: 'POST', data }),
            transformResponse: (response) => response.data,
            invalidatesTags: [{ type: 'Payment', id: 'LIST' }],
            onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
                try {
                    await queryFulfilled;
                    // mijoz balansini va kassa qoldig'ini yangilash
                    refreshCustomer(arg.customerId, dispatch);
                    dispatch(cashboxApi.util.invalidateTags([{ type: 'Cashbox', id: arg.cashboxId }, { type: 'Cashbox', id: 'LIST' }]));
                } catch { /* caller handles errors */ }
            },
        }),

        // POST /api/v1/payments/{id}/cancel – to'lovni bekor qilish
        cancelPayment: builder.mutation({
            query: (id) => ({ url: `/payments/${id}/cancel`, method: 'POST' }),
            transformResponse: (response) => response.data,
            invalidatesTags: (result, error, id) => [{ type: 'Payment', id }, { type: 'Payment', id: 'LIST' }],
            // bekor qilinganda mijoz balansi va kassa qoldig'i qaytadi
            onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
                try {
                    const { data } = await queryFulfilled;
                    refreshCustomer(data?.customerId, dispatch);
                    dispatch(cashboxApi.util.invalidateTags([
                        ...(data?.cashboxId ? [{ type: 'Cashbox', id: data.cashboxId }] : []),
                        { type: 'Cashbox', id: 'LIST' },
                    ]));
                } catch { /* caller handles errors */ }
            },
        }),
    }),
});

export const {
    useGetPaymentsQuery,
    useGetPaymentByIdQuery,
    useCreatePaymentMutation,
    useCancelPaymentMutation,
} = paymentApi;
