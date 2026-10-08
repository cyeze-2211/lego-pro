import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';

export const customerAgentApi = createApi({
    reducerPath: 'customerAgentApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['CustomerAgent'],
    endpoints: (builder) => ({

        // GET /api/v1/customer-agents — sahifalangan ro'yxat
        getCustomerAgents: builder.query({
            query: ({ name, phone, page = 0, size = 20, sort = ['createdAt,DESC', 'id,DESC'] } = {}) => ({
                url: '/customer-agents',
                method: 'GET',
                params: {
                    ...(name  ? { name }  : {}),
                    ...(phone ? { phone } : {}),
                    page,
                    size,
                    sort,
                },
            }),
            transformResponse: (response) => ({
                items:      response.data,
                pagination: response.pagination,
            }),
            providesTags: [{ type: 'CustomerAgent', id: 'LIST' }],
        }),

        // GET /api/v1/customer-agents/:id — bitta agent
        getCustomerAgentById: builder.query({
            query: (id) => ({
                url: `/customer-agents/${id}`,
                method: 'GET',
            }),
            transformResponse: (response) => response.data,
            providesTags: (result, error, id) => [{ type: 'CustomerAgent', id }],
        }),

        // POST /api/v1/customer-agents — yangi agent yaratish
        createCustomerAgent: builder.mutation({
            query: (data) => ({
                url: '/customer-agents',
                method: 'POST',
                data,
            }),
            transformResponse: (response) => response.data,
            invalidatesTags: [{ type: 'CustomerAgent', id: 'LIST' }],
        }),

        // PUT /api/v1/customer-agents/:id — agentni yangilash
        updateCustomerAgent: builder.mutation({
            query: ({ id, data }) => ({
                url: `/customer-agents/${id}`,
                method: 'PUT',
                data,
            }),
            transformResponse: (response) => response.data,
            invalidatesTags: (result, error, { id }) => [
                { type: 'CustomerAgent', id },
                { type: 'CustomerAgent', id: 'LIST' },
            ],
        }),

        // GET /api/v1/customer-agents/bonus — agentlar bonusini hisoblash
        getCustomerAgentBonus: builder.query({
            query: (params = {}) => ({
                url: '/customer-agents/bonus',
                method: 'GET',
                params,
            }),
            transformResponse: (response) => response.data,
            providesTags: [{ type: 'CustomerAgent', id: 'BONUS' }],
        }),

        // DELETE /api/v1/customer-agents/:id — soft-delete
        deleteCustomerAgent: builder.mutation({
            query: (id) => ({
                url: `/customer-agents/${id}`,
                method: 'DELETE',
            }),
            transformResponse: (response) => response.data,
            invalidatesTags: (result, error, id) => [
                { type: 'CustomerAgent', id },
                { type: 'CustomerAgent', id: 'LIST' },
            ],
        }),
    }),
});

export const {
    useGetCustomerAgentsQuery,
    useGetCustomerAgentByIdQuery,
    useGetCustomerAgentBonusQuery,
    useCreateCustomerAgentMutation,
    useUpdateCustomerAgentMutation,
    useDeleteCustomerAgentMutation,
} = customerAgentApi;
