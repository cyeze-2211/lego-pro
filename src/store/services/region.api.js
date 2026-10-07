import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';

export const regionApi = createApi({
    reducerPath: 'regionApi',
    baseQuery: axiosBaseQuery(),
    endpoints: (builder) => ({
        getRegions: builder.query({
            query: () => ({
                url: '/regions',
                method: 'GET',
            }),
            transformResponse: (response) => response.data,
        }),
    }),
});

export const { useGetRegionsQuery } = regionApi;
