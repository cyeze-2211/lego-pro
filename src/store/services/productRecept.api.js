import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';

export const recipeApi = createApi({
  reducerPath: 'recipeApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Recipe'],
  endpoints: (builder) => ({
    // GET /api/v1/recipes — все рецепты с пагинацией
    getAllRecipes: builder.query({
      query: ({ page = 0, size = 12, sort = ['createdAt,DESC', 'id,DESC'] } = {}) => ({
        url: '/recipes',
        method: 'GET',
        params: { page, size, sort },
      }),
      transformResponse: (response) => ({ items: response.data, pagination: response.pagination }),
      providesTags: [{ type: 'Recipe', id: 'LIST' }],
    }),

    // GET /api/v1/recipes/{recipeId} — bitta retsept qatorlari bilan
    getRecipeById: builder.query({
      query: (recipeId) => ({
        url: `/recipes/${recipeId}`,
        method: 'GET',
      }),
      transformResponse: (response) => response.data,
      providesTags: (result, error, recipeId) => [{ type: 'Recipe', id: recipeId }],
    }),

    // POST /api/v1/recipes — yangi retsept
    createRecipe: builder.mutation({
      query: ({ name, items }) => ({
        url: '/recipes',
        method: 'POST',
        data: { name, items },
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: [{ type: 'Recipe', id: 'LIST' }],
    }),

    // PUT /api/v1/recipes/{recipeId} — to'liq almashtirish (upsert)
    updateRecipe: builder.mutation({
      query: ({ recipeId, name, items }) => ({
        url: `/recipes/${recipeId}`,
        method: 'PUT',
        data: { name, items },
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: (result, error, { recipeId }) => [{ type: 'Recipe', id: recipeId }, { type: 'Recipe', id: 'LIST' }],
    }),

    // DELETE /api/v1/recipes/{recipeId} — soft-delete
    deleteRecipe: builder.mutation({
      query: (recipeId) => ({
        url: `/recipes/${recipeId}`,
        method: 'DELETE',
      }),
      transformResponse: (response) => response.data, // всегда null
      invalidatesTags: (result, error, recipeId) => [{ type: 'Recipe', id: recipeId }, { type: 'Recipe', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetAllRecipesQuery,
  useGetRecipeByIdQuery,
  useCreateRecipeMutation,
  useUpdateRecipeMutation,
  useDeleteRecipeMutation,
} = recipeApi;