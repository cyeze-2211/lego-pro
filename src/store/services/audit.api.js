import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';

export const auditApi = createApi({
  reducerPath: 'auditApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['AuditLog'],
  endpoints: (builder) => ({
    getAuditLogs: builder.query({
      query: ({
        userId,
        deviceId,
        action,
        entityName,
        occurredFrom,
        occurredTo,
        page = 0,
        size = 20,
        sort = ['occurredAt,DESC'],
      } = {}) => ({
        url: '/audit-logs',
        method: 'GET',
        params: {
          ...(userId ? { userId } : {}),
          ...(deviceId ? { deviceId } : {}),
          ...(action ? { action } : {}),
          ...(entityName ? { entityName } : {}),
          ...(occurredFrom ? { occurredFrom } : {}),
          ...(occurredTo ? { occurredTo } : {}),
          page,
          size,
          sort,
        },
      }),
      transformResponse: (response) => ({
        items: response?.data || [],
        pagination: response?.pagination || null,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: 'AuditLog', id })),
              { type: 'AuditLog', id: 'LIST' },
            ]
          : [{ type: 'AuditLog', id: 'LIST' }],
    }),
  }),
});

export const { useGetAuditLogsQuery } = auditApi;
