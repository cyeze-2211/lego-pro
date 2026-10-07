import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';

export const paymentReminderApi = createApi({
    reducerPath: 'paymentReminderApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['PaymentReminder', 'PaymentReminderDashboard'],
    endpoints: (builder) => ({
        getPaymentReminders: builder.query({
            query: ({
                customerId,
                paymentDate,
                approved,
                page = 0,
                size = 20,
                sort = ['paymentDate,ASC', 'id,ASC'],
            } = {}) => ({
                url: '/payment-reminders',
                method: 'GET',
                params: {
                    ...(customerId ? { customerId } : {}),
                    ...(paymentDate ? { paymentDate } : {}),
                    ...(approved !== undefined ? { approved } : {}),
                    page,
                    size,
                    sort,
                },
                paramsSerializer: { indexes: null },
            }),
            transformResponse: (response) => ({
                items: response.data ?? [],
                pagination: response.pagination ?? null,
            }),
            providesTags: (result) =>
                result?.items
                    ? [
                          ...result.items.map(({ id }) => ({ type: 'PaymentReminder', id })),
                          { type: 'PaymentReminder', id: 'LIST' },
                      ]
                    : [{ type: 'PaymentReminder', id: 'LIST' }],
        }),

        getPaymentReminderById: builder.query({
            query: (id) => ({
                url: `/payment-reminders/${id}`,
                method: 'GET',
            }),
            transformResponse: (response) => response.data,
            providesTags: (result, error, id) => [{ type: 'PaymentReminder', id }],
        }),

        getPaymentReminderDashboard: builder.query({
            query: ({ date }) => ({
                url: '/payment-reminders/dashboard',
                method: 'GET',
                params: { date },
            }),
            transformResponse: (response) => response.data,
            providesTags: (result, error, { date }) => [
                { type: 'PaymentReminderDashboard', id: date },
                { type: 'PaymentReminderDashboard', id: 'LIST' },
            ],
        }),

        createPaymentReminder: builder.mutation({
            query: (data) => ({
                url: '/payment-reminders',
                method: 'POST',
                data,
            }),
            transformResponse: (response) => response.data,
            invalidatesTags: [
                { type: 'PaymentReminder', id: 'LIST' },
                { type: 'PaymentReminderDashboard', id: 'LIST' },
            ],
        }),

        updatePaymentReminder: builder.mutation({
            query: ({ id, data }) => ({
                url: `/payment-reminders/${id}`,
                method: 'PUT',
                data,
            }),
            transformResponse: (response) => response.data,
            invalidatesTags: (result, error, { id }) => [
                { type: 'PaymentReminder', id },
                { type: 'PaymentReminder', id: 'LIST' },
                { type: 'PaymentReminderDashboard', id: 'LIST' },
            ],
        }),

        deletePaymentReminder: builder.mutation({
            query: (id) => ({
                url: `/payment-reminders/${id}`,
                method: 'DELETE',
            }),
            transformResponse: (response) => response.data,
            invalidatesTags: (result, error, id) => [
                { type: 'PaymentReminder', id },
                { type: 'PaymentReminder', id: 'LIST' },
                { type: 'PaymentReminderDashboard', id: 'LIST' },
            ],
        }),
    }),
});

export const {
    useGetPaymentRemindersQuery,
    useGetPaymentReminderByIdQuery,
    useGetPaymentReminderDashboardQuery,
    useCreatePaymentReminderMutation,
    useUpdatePaymentReminderMutation,
    useDeletePaymentReminderMutation,
} = paymentReminderApi;
