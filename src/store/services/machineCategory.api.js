import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';

/**
 * Stanok kategoriyalari: /api/v1/machine-categories (CRUD).
 * Har bir kategoriya javobida unga biriktirilgan stanokchilar (operators) ro'yxati ham keladi.
 */
export const machineCategoryApi = createApi({
    reducerPath: 'machineCategoryApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['MachineCategory'],
    endpoints: (builder) => ({
        // GET /api/v1/machine-categories — ro'yxat (sahifalangan bo'lsa pagination ham qaytadi)
        getMachineCategories: builder.query({
            query: ({ name, page = 0, size = 20, sort = ['createdAt,DESC', 'id,DESC'] } = {}) => ({
                url: '/machine-categories',
                method: 'GET',
                params: {
                    ...(name ? { name } : {}),
                    page,
                    size,
                    sort,
                },
            }),
            transformResponse: (response) => ({
                items: Array.isArray(response?.data) ? response.data : (response?.data?.content ?? []),
                pagination: response?.pagination ?? null,
            }),
            providesTags: (result) =>
                result?.items
                    ? [
                          ...result.items.map(({ id }) => ({ type: 'MachineCategory', id })),
                          { type: 'MachineCategory', id: 'LIST' },
                      ]
                    : [{ type: 'MachineCategory', id: 'LIST' }],
        }),

        // GET /api/v1/machine-categories/{id}
        getMachineCategoryById: builder.query({
            query: (id) => ({
                url: `/machine-categories/${id}`,
                method: 'GET',
            }),
            transformResponse: (response) => response.data,
            providesTags: (result, error, id) => [{ type: 'MachineCategory', id }],
        }),

        // POST /api/v1/machine-categories
        createMachineCategory: builder.mutation({
            query: (data) => ({
                url: '/machine-categories',
                method: 'POST',
                data,
            }),
            transformResponse: (response) => response.data,
            invalidatesTags: [{ type: 'MachineCategory', id: 'LIST' }],
        }),

        // PUT /api/v1/machine-categories/{id}
        updateMachineCategory: builder.mutation({
            query: ({ id, data }) => ({
                url: `/machine-categories/${id}`,
                method: 'PUT', schema: 'MachineCategoryUpdateRequest',
                data,
            }),
            transformResponse: (response) => response.data,
            invalidatesTags: (result, error, { id }) => [
                { type: 'MachineCategory', id },
                { type: 'MachineCategory', id: 'LIST' },
            ],
        }),

        // DELETE /api/v1/machine-categories/{id}
        deleteMachineCategory: builder.mutation({
            query: (id) => ({
                url: `/machine-categories/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, id) => [
                { type: 'MachineCategory', id },
                { type: 'MachineCategory', id: 'LIST' },
            ],
        }),

        // PUT /api/v1/machine-categories/{id}/operators — { userIds: [...] }
        // Kategoriyaning stanokchilar ro'yxatini TO'LIQ almashtiradi. Faqat MANAGER (MACHINE_CATEGORY:ASSIGN).
        // Faqat STANOKCHI rolidagi faol foydalanuvchini biriktirish mumkin, aks holda 400.
        assignMachineCategoryOperators: builder.mutation({
            query: ({ id, userIds }) => ({
                url: `/machine-categories/${id}/operators`,
                method: 'PUT',
                data: { userIds },
            }),
            transformResponse: (response) => response.data,
            invalidatesTags: (result, error, { id }) => [
                { type: 'MachineCategory', id },
                { type: 'MachineCategory', id: 'LIST' },
            ],
        }),
    }),
});

export const {
    useGetMachineCategoriesQuery,
    useGetMachineCategoryByIdQuery,
    useCreateMachineCategoryMutation,
    useUpdateMachineCategoryMutation,
    useDeleteMachineCategoryMutation,
    useAssignMachineCategoryOperatorsMutation,
} = machineCategoryApi;
