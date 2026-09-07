import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';

export const rawMaterialApi = createApi({
  reducerPath: 'rawMaterialApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['RawMaterial'],
  endpoints: (builder) => ({
    // GET /api/v1/raw-materials – список сырья с пагинацией и фильтром по name
    getRawMaterials: builder.query({
      query: ({ name, page = 0, size = 20, sort = ['createdAt,DESC', 'id,DESC'] }) => ({
        url: '/raw-materials',
        method: 'GET',
        params: {
          name,
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
              ...result.items.map(({ id }) => ({ type: 'RawMaterial', id })),
              { type: 'RawMaterial', id: 'LIST' },
            ]
          : [{ type: 'RawMaterial', id: 'LIST' }],
    }),

    // GET /api/v1/raw-materials/{id} – получить одно сырьё по ID
    getRawMaterialById: builder.query({
      query: (id) => ({
        url: `/raw-materials/${id}`,
        method: 'GET',
      }),
      transformResponse: (response) => response.data,
      providesTags: (result, error, id) => [{ type: 'RawMaterial', id }],
    }),

    // POST /api/v1/raw-materials – создать новое сырьё
    createRawMaterial: builder.mutation({
      query: (data) => ({
        url: '/raw-materials',
        method: 'POST',
        data,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: [{ type: 'RawMaterial', id: 'LIST' }],
    }),

    // PUT /api/v1/raw-materials/{id} – полностью обновить сырьё (name и summary)
    updateRawMaterial: builder.mutation({
      query: ({ id, data }) => ({
        url: `/raw-materials/${id}`,
        method: 'PUT',
        data,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: 'RawMaterial', id },
        { type: 'RawMaterial', id: 'LIST' },
      ],
    }),

    // DELETE /api/v1/raw-materials/{id} – мягкое удаление сырья
    deleteRawMaterial: builder.mutation({
      query: (id) => ({
        url: `/raw-materials/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (response) => response.data, // всегда null
      invalidatesTags: (result, error, id) => [
        { type: 'RawMaterial', id },
        { type: 'RawMaterial', id: 'LIST' },
      ],
    }),
  }),
});

// Экспорт хуков для использования в компонентах
export const {
  useGetRawMaterialsQuery,
  useGetRawMaterialByIdQuery,
  useCreateRawMaterialMutation,
  useUpdateRawMaterialMutation,
  useDeleteRawMaterialMutation,
} = rawMaterialApi;