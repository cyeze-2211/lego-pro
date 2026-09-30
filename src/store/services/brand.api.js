import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';
import { BASE_URL } from '../api';
import Cookies from 'js-cookie';

export const brandApi = createApi({
    reducerPath: 'brandApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['Brand'],
    endpoints: (builder) => ({
        // GET /api/v1/brands
        getBrands: builder.query({
            query: ({ name, page = 0, size = 20, sort } = {}) => ({
                url: '/brands',
                method: 'GET',
                params: {
                    ...(name ? { name } : {}),
                    page,
                    size,
                    ...(sort ? { sort } : {}),
                },
            }),
            transformResponse: (response) => ({
                items: response.data ?? [],
                pagination: response.pagination ?? null,
            }),
            providesTags: (result) =>
                result?.items
                    ? [
                          ...result.items.map(({ id }) => ({ type: 'Brand', id })),
                          { type: 'Brand', id: 'LIST' },
                      ]
                    : [{ type: 'Brand', id: 'LIST' }],
        }),

        // GET /api/v1/brands/{id}
        getBrandById: builder.query({
            query: (id) => ({
                url: `/brands/${id}`,
                method: 'GET',
            }),
            transformResponse: (response) => response.data,
            providesTags: (result, error, id) => [{ type: 'Brand', id }],
        }),

        // POST /api/v1/brands
        createBrand: builder.mutation({
            query: (data) => ({
                url: '/brands',
                method: 'POST',
                data,
            }),
            transformResponse: (response) => response.data,
            invalidatesTags: [{ type: 'Brand', id: 'LIST' }],
        }),

        // PUT /api/v1/brands/{id}
        updateBrand: builder.mutation({
            query: ({ id, data }) => ({
                url: `/brands/${id}`,
                method: 'PUT',
                data,
            }),
            transformResponse: (response) => response.data,
            invalidatesTags: (result, error, { id }) => [
                { type: 'Brand', id },
                { type: 'Brand', id: 'LIST' },
            ],
        }),

        // DELETE /api/v1/brands/{id}
        deleteBrand: builder.mutation({
            query: (id) => ({
                url: `/brands/${id}`,
                method: 'DELETE',
            }),
            transformResponse: (response) => response.data,
            invalidatesTags: (result, error, id) => [
                { type: 'Brand', id },
                { type: 'Brand', id: 'LIST' },
            ],
        }),

        // GET /api/v1/brands/{id}/logo
        getBrandLogo: builder.query({
            query: (id) => ({
                url: `/brands/${id}/logo`,
                method: 'GET',
                responseType: 'blob',
            }),
            providesTags: (result, error, id) => [{ type: 'Brand', id: `LOGO-${id}` }],
        }),

        // POST /api/v1/brands/{id}/logo — multipart (queryFn + fetch)
        uploadBrandLogo: builder.mutation({
            queryFn: async ({ id, file }) => {
                try {
                    const formData = new FormData();
                    formData.append('file', file);

                    const token = Cookies.get('token');
                    const deviceToken = Cookies.get('device_token');

                    const response = await fetch(
                        `${BASE_URL}/api/v1/brands/${id}/logo`,
                        {
                            method: 'POST',
                            headers: {
                                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                                ...(deviceToken ? { 'X-Device-Token': deviceToken } : {}),
                            },
                            body: formData,
                        },
                    );

                    const json = await response.json().catch(() => null);

                    if (!response.ok) {
                        return {
                            error: {
                                status: response.status,
                                data: json || { message: 'Logotip yuklanmadi' },
                            },
                        };
                    }

                    return { data: json?.data ?? json };
                } catch (err) {
                    return {
                        error: {
                            status: 'FETCH_ERROR',
                            error: err?.message || 'Tarmoq xatosi',
                        },
                    };
                }
            },
            invalidatesTags: (result, error, { id }) => [
                { type: 'Brand', id },
                { type: 'Brand', id: `LOGO-${id}` },
                { type: 'Brand', id: 'LIST' },
            ],
        }),

        // DELETE /api/v1/brands/{id}/logo
        deleteBrandLogo: builder.mutation({
            query: (id) => ({
                url: `/brands/${id}/logo`,
                method: 'DELETE',
            }),
            transformResponse: (response) => response.data,
            invalidatesTags: (result, error, id) => [
                { type: 'Brand', id },
                { type: 'Brand', id: `LOGO-${id}` },
                { type: 'Brand', id: 'LIST' },
            ],
        }),
    }),
});

export const {
    useGetBrandsQuery,
    useGetBrandByIdQuery,
    useCreateBrandMutation,
    useUpdateBrandMutation,
    useDeleteBrandMutation,
    useGetBrandLogoQuery,
    useUploadBrandLogoMutation,
    useDeleteBrandLogoMutation,
} = brandApi;