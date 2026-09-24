import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';

export const machineOutputApi = createApi({
  reducerPath: 'machineOutputApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['MachineOutput'],
  endpoints: (builder) => ({

    // GET /api/v1/machine-outputs
    // Stanoklar ishlab chiqarish tarixini sahifalab qaytaradi
    getMachineOutputs: builder.query({
      query: ({
        machineId,
        productId,
        from,
        to,
        page = 0,
        size = 10,
        sort = ['createdAt,DESC'],
      } = {}) => ({
        url: '/machine-outputs',
        method: 'GET',
        params: {
          ...(machineId ? { machineId } : {}),
          ...(productId ? { productId } : {}),
          ...(from      ? { from }      : {}),
          ...(to        ? { to }        : {}),
          page,
          size,
          sort,
        },
      }),
      transformResponse: (response) => ({
        items:      response.data       ?? [],
        pagination: response.pagination ?? null,
      }),
      providesTags: (result, error, arg) => [
        { type: 'MachineOutput', id: 'LIST' },
        ...(arg?.machineId
          ? [{ type: 'MachineOutput', id: `MACHINE-${arg.machineId}` }]
          : []),
      ],
    }),

    // GET /api/v1/machine-outputs/statistics
    // Stanok × mahsulot bo'yicha kun/hafta/oy statistikasi
    getMachineOutputStatistics: builder.query({
      query: ({
        machineId,
        productId,
        period = 'day', // 'day' | 'week' | 'month'
        from,
        to,
      } = {}) => ({
        url: '/machine-outputs/statistics',
        method: 'GET',
        params: {
          ...(machineId ? { machineId } : {}),
          ...(productId ? { productId } : {}),
          ...(period    ? { period }    : {}),
          ...(from      ? { from }      : {}),
          ...(to        ? { to }        : {}),
        },
      }),
      transformResponse: (response) => response.data ?? [],
      providesTags: [{ type: 'MachineOutput', id: 'STATS' }],
    }),
  }),
});

export const {
  useGetMachineOutputsQuery,
  useGetMachineOutputStatisticsQuery,
} = machineOutputApi;
