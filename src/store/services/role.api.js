import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';

export const roleApi = createApi({
    reducerPath: 'roleApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['Role'],
    endpoints: (builder) => ({
        // GET /api/v1/roles — barcha rollar ro'yxati
        getRoles: builder.query({
            query: () => ({
                url: '/roles',
                method: 'GET',
            }),
            transformResponse: (response) => response.data ?? [],
            providesTags: [{ type: 'Role', id: 'LIST' }],
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
    }),
});

export const { useGetRolesQuery, useCreateRoleMutation } = roleApi;
