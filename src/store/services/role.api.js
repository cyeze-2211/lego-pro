import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';

export const roleApi = createApi({
    reducerPath: 'roleApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['Role', 'Permission'],
    endpoints: (builder) => ({
        // GET /api/v1/roles — barcha rollar ro'yxati (summary)
        getRoles: builder.query({
            query: () => ({
                url: '/roles',
                method: 'GET',
            }),
            transformResponse: (response) => response.data ?? [],
            providesTags: (result) =>
                result
                    ? [...result.map(({ id }) => ({ type: 'Role', id })), { type: 'Role', id: 'LIST' }]
                    : [{ type: 'Role', id: 'LIST' }],
        }),

        // GET /api/v1/roles/{id} — bitta rolni olish (permissionIds bilan)
        getRoleById: builder.query({
            query: (id) => ({
                url: `/roles/${id}`,
                method: 'GET',
            }),
            transformResponse: (response) => response.data ?? null,
            providesTags: (result, error, id) => [{ type: 'Role', id }],
        }),

        // POST /api/v1/roles — yangi rol yaratish
        createRole: builder.mutation({
            query: (data) => ({
                url: '/roles',
                method: 'POST',
                data,
            }),
            invalidatesTags: [{ type: 'Role', id: 'LIST' }],
        }),

        // PUT /api/v1/roles/{id} — rol ma'lumotlarini yangilash (roleName, description)
        updateRole: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/roles/${id}`,
                method: 'PUT',
                data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Role', id },
                { type: 'Role', id: 'LIST' },
            ],
        }),

        // DELETE /api/v1/roles/{id} — rolni o'chirish (soft-delete)
        deleteRole: builder.mutation({
            query: (id) => ({
                url: `/roles/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'Role', id: 'LIST' }],
        }),

        // PUT /api/v1/roles/{id}/permissions — rol permissionlarini almashtirish
        updateRolePermissions: builder.mutation({
            query: ({ id, permissionIds }) => ({
                url: `/roles/${id}/permissions`,
                method: 'PUT',
                data: { permissionIds },
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Role', id },
                { type: 'Role', id: 'LIST' },
            ],
        }),

        // GET /api/v1/permissions/catalog — permissionlar katalogi (modullar bo'yicha)
        getPermissionCatalog: builder.query({
            query: () => ({
                url: '/permissions/catalog',
                method: 'GET',
            }),
            transformResponse: (response) => response.data?.modules ?? [],
            providesTags: [{ type: 'Permission', id: 'CATALOG' }],
        }),
    }),
});

export const {
    useGetRolesQuery,
    useGetRoleByIdQuery,
    useCreateRoleMutation,
    useUpdateRoleMutation,
    useDeleteRoleMutation,
    useUpdateRolePermissionsMutation,
    useGetPermissionCatalogQuery,
} = roleApi;
