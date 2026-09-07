import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';

export const warehouseApi = createApi({
    reducerPath: 'warehouseApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['Warehouse'],
    endpoints: (builder) => ({
            // GET /api/v1/warehouses – список всех активных складов
        getWarehouses: builder.query({
                query: (category) => ({
                url: '/warehouses',
                method: 'GET',
                    params: category ? { category } : undefined,
            }),
            transformResponse: (response) => response.data,
            providesTags: (result) =>
                result
                    ? [
                          ...result.map(({ id }) => ({ type: 'Warehouse', id })),
                          { type: 'Warehouse', id: 'LIST' },
                      ]
                    : [{ type: 'Warehouse', id: 'LIST' }],
        }),

        // GET /api/v1/warehouses/{id} – получить один склад по ID
        getWarehouseById: builder.query({
            query: (id) => ({
                url: `/warehouses/${id}`,
                method: 'GET',
            }),
            transformResponse: (response) => response.data,
            providesTags: (result, error, id) => [{ type: 'Warehouse', id }],
        }),

        // POST /api/v1/warehouses – создать новый склад
        createWarehouse: builder.mutation({
            query: (data) => ({
                url: '/warehouses',
                method: 'POST',
                data,
            }),
            transformResponse: (response) => response.data,
            invalidatesTags: [{ type: 'Warehouse', id: 'LIST' }],
        }),

        // PUT /api/v1/warehouses/{id} – полностью обновить склад
        updateWarehouse: builder.mutation({
            query: ({ id, data }) => ({
                url: `/warehouses/${id}`,
                method: 'PUT',
                data,
            }),
            transformResponse: (response) => response.data,
            invalidatesTags: (result, error, { id }) => [
                { type: 'Warehouse', id },
                { type: 'Warehouse', id: 'LIST' },
            ],
        }),

        // DELETE /api/v1/warehouses/{id} – мягкое удаление склада
        deleteWarehouse: builder.mutation({
            query: (id) => ({
                url: `/warehouses/${id}`,
                method: 'DELETE',
            }),
            transformResponse: (response) => response.data, // всегда null
            invalidatesTags: (result, error, id) => [
                { type: 'Warehouse', id },
                { type: 'Warehouse', id: 'LIST' },
            ],
        }),
    }),
});

// Экспорт хуков для использования в компонентах
export const {
    useGetWarehousesQuery,
    useGetWarehouseByIdQuery,
    useCreateWarehouseMutation,
    useUpdateWarehouseMutation,
    useDeleteWarehouseMutation,
} = warehouseApi;