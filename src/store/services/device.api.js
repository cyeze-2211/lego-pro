import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';

export const deviceApi = createApi({
    reducerPath: 'deviceApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['Device'],
    endpoints: (builder) => ({
        getDevices: builder.query({
            query: ({ page = 0, size = 20, sort = ['createdAt,DESC', 'id,DESC'] } = {}) => ({ url: '/device', method: 'GET', params: { page, size, sort } }),
            transformResponse: (response) => ({ items: response.data || [], pagination: response.pagination || null }),
            providesTags: (result) => result ? [...result.items.map(({ id }) => ({ type: 'Device', id })), { type: 'Device', id: 'LIST' }] : [{ type: 'Device', id: 'LIST' }],
        }),
        registerDevice: builder.mutation({
            query: (data) => ({ url: '/device/register', method: 'POST', data }),
            transformResponse: (response) => response.data,
            invalidatesTags: [{ type: 'Device', id: 'LIST' }],
        }),
        deleteDevice: builder.mutation({
            query: (id) => ({ url: `/device/${id}`, method: 'DELETE' }),
            transformResponse: (response) => response.data,
            invalidatesTags: (result, error, id) => [{ type: 'Device', id }, { type: 'Device', id: 'LIST' }],
        }),
    }),
});

export const { useGetDevicesQuery, useRegisterDeviceMutation, useDeleteDeviceMutation } = deviceApi;