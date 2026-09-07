import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';

export const machineApi = createApi({
  reducerPath: 'machineApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Machine'],
  endpoints: (builder) => ({
    // GET /api/v1/machines — sahifalangan ro'yxat (name filtri, real-time holat bilan)
    getMachines: builder.query({
      query: ({ name, page = 0, size = 12, sort = ['createdAt,DESC', 'id,DESC'] } = {}) => ({
        url: '/machines',
        method: 'GET',
        params: { ...(name ? { name } : {}), page, size, sort },
      }),
      transformResponse: (response) => ({ items: response.data, pagination: response.pagination }),
      providesTags: [{ type: 'Machine', id: 'LIST' }],
    }),

    // GET /api/v1/machines/{id} — bitta stanok (real-time holat bilan)
    getMachineById: builder.query({
      query: (id) => ({
        url: `/machines/${id}`,
        method: 'GET',
      }),
      transformResponse: (response) => response.data,
      providesTags: (result, error, id) => [{ type: 'Machine', id }],
    }),

    // POST /api/v1/machines — yangi stanok yaratish
    createMachine: builder.mutation({
      query: (data) => ({
        url: '/machines',
        method: 'POST',
        data,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: [{ type: 'Machine', id: 'LIST' }],
    }),

    // PUT /api/v1/machines/{id} — stanokni to'liq yangilash (name + summary)
    updateMachine: builder.mutation({
      query: ({ id, data }) => ({
        url: `/machines/${id}`,
        method: 'PUT',
        data,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: (result, error, { id }) => [{ type: 'Machine', id }, { type: 'Machine', id: 'LIST' }],
    }),

    // DELETE /api/v1/machines/{id} — soft-delete
    deleteMachine: builder.mutation({
      query: (id) => ({
        url: `/machines/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (response) => response.data, // doim null
      invalidatesTags: (result, error, id) => [{ type: 'Machine', id }, { type: 'Machine', id: 'LIST' }],
    }),

    // --- Quyi endpoynlar: hozircha UI da ishlatilmaydi, kelajakdagi ishlab chiqarish boshqaruvi/tarixi uchun tayyor ---

    // POST /api/v1/machines/{id}/production-start
    startMachineProduction: builder.mutation({
      query: ({ id, productId }) => ({
        url: `/machines/${id}/production-start`,
        method: 'POST',
        data: { productId },
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: (result, error, { id }) => [{ type: 'Machine', id }, { type: 'Machine', id: 'LIST' }],
    }),

    // POST /api/v1/machines/{id}/production-stop
    stopMachineProduction: builder.mutation({
      query: (id) => ({
        url: `/machines/${id}/production-stop`,
        method: 'POST',
      }),
      transformResponse: (response) => response.data, // doim null
      invalidatesTags: (result, error, id) => [{ type: 'Machine', id }, { type: 'Machine', id: 'LIST' }],
    }),

    // GET /api/v1/machines/{id}/runs — ishlab chiqarish tarixi (sahifalangan)
    getMachineRuns: builder.query({
      query: ({ id, page = 0, size = 20, sort = ['startedAt,DESC', 'id,DESC'] }) => ({
        url: `/machines/${id}/runs`,
        method: 'GET',
        params: { page, size, sort },
      }),
      transformResponse: (response) => ({ items: response.data, pagination: response.pagination }),
      providesTags: (result, error, { id }) => [{ type: 'Machine', id: `RUNS-${id}` }],
    }),
  }),
});

export const {
  useGetMachinesQuery,
  useGetMachineByIdQuery,
  useCreateMachineMutation,
  useUpdateMachineMutation,
  useDeleteMachineMutation,
  useStartMachineProductionMutation,
  useStopMachineProductionMutation,
  useGetMachineRunsQuery,
} = machineApi;
