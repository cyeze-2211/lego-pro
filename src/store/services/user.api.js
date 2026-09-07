import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';

export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['User'],
  endpoints: (builder) => ({
    // POST /api/v1/user/register – регистрация нового пользователя
    registerUser: builder.mutation({
      query: (data) => ({
        url: '/user/register',
        method: 'POST',
        data,
      }),
      transformResponse: (response) => response.data, // всегда null
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),

    // GET /api/v1/user – список пользователей с фильтрацией и пагинацией
    getUsers: builder.query({
      query: ({
        username,
        roleId,
        lastLoginFrom,
        lastLoginTo,
        page = 0,
        size = 20,
        sort = ['createdAt,DESC'],
      }) => ({
        url: '/user',
        method: 'GET',
        params: {
          username,
          roleId,
          lastLoginFrom,
          lastLoginTo,
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
              ...result.items.map(({ id }) => ({ type: 'User', id })),
              { type: 'User', id: 'LIST' },
            ]
          : [{ type: 'User', id: 'LIST' }],
    }),

    // GET /api/v1/user/{id} – получить одного пользователя по ID
    getUserById: builder.query({
      query: (id) => ({
        url: `/user/${id}`,
        method: 'GET',
      }),
      transformResponse: (response) => response.data,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),

    deleteUser: builder.mutation({
      query: (id) => ({ url: `/user/${id}`, method: 'DELETE' }),
      transformResponse: (response) => response.data,
      invalidatesTags: (result, error, id) => [{ type: 'User', id }, { type: 'User', id: 'LIST' }],
    }),
  }),
});

// Экспорт хуков для использования в компонентах
export const {
  useRegisterUserMutation,
  useGetUsersQuery,
  useGetUserByIdQuery,
  useDeleteUserMutation,
} = userApi;