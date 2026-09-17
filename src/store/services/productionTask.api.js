import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';

export const productionTaskApi = createApi({
  reducerPath: 'productionTaskApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['ProductionTask'],
  endpoints: (builder) => ({
    // GET /api/v1/production-tasks — topshiriqlar (machineId va status bo'yicha filtr)
    getProductionTasks: builder.query({
      query: ({ machineId, status, page = 0, size = 20, sort = ['createdAt,DESC', 'id,DESC'] } = {}) => ({
        url: '/production-tasks',
        method: 'GET',
        params: {
          ...(machineId ? { machineId } : {}),
          ...(status ? { status } : {}),
          page,
          size,
          sort,
        },
      }),
      transformResponse: (response) => ({
        items: response.data || [],
        pagination: response.pagination || null,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: 'ProductionTask', id })),
              { type: 'ProductionTask', id: 'LIST' },
            ]
          : [{ type: 'ProductionTask', id: 'LIST' }],
    }),

    // GET /api/v1/production-tasks/{id} — bitta topshiriq
    getProductionTaskById: builder.query({
      query: (id) => ({
        url: `/production-tasks/${id}`,
        method: 'GET',
      }),
      transformResponse: (response) => response.data,
      providesTags: (result, error, id) => [{ type: 'ProductionTask', id }],
    }),

    // POST /api/v1/production-tasks — stanokka topshiriq yuborish (SENT)
    createProductionTask: builder.mutation({
      query: ({ machineId, productId, note }) => ({
        url: '/production-tasks',
        method: 'POST',
        data: { machineId, productId, note },
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: [{ type: 'ProductionTask', id: 'LIST' }],
    }),

    // PATCH /api/v1/production-tasks/{id}/accept — stanokchi qabul qiladi (SENT → ACCEPTED)
    acceptProductionTask: builder.mutation({
      query: (id) => ({
        url: `/production-tasks/${id}/accept`,
        method: 'PATCH',
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: (result, error, id) => [{ type: 'ProductionTask', id }, { type: 'ProductionTask', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetProductionTasksQuery,
  useGetProductionTaskByIdQuery,
  useCreateProductionTaskMutation,
  useAcceptProductionTaskMutation,
} = productionTaskApi;
