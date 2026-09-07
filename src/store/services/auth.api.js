import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';

export const authApi = createApi({
    reducerPath: 'authApi',
    baseQuery: axiosBaseQuery(),
    tagTypes: ['Auth'],
    endpoints: (builder) => ({
        login: builder.mutation({
            query: (data) => ({
                url: '/device/login',
                method: 'POST',
                data,
            }),
            invalidatesTags: ['Auth'],
        }),
        getUsers: builder.query({
            query: () => ({
                url: '/auth/users',
                method: 'GET',
            }),
        }),
        userLogin: builder.mutation({
            query: (data) => ({
                url: '/auth/login',
                method: 'POST',
                data,
            }),
            invalidatesTags: ['Auth'],
        }),
        logout: builder.mutation({
            query: () => ({
                url: '/auth/logout',
                method: 'POST',
            }),
            invalidatesTags: ['Auth'],
        }),
    }),
});

export const {
    useLoginMutation,
    useGetUsersQuery,
    useUserLoginMutation,
    useLogoutMutation,
} = authApi;
