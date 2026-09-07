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

    // GET /api/v1/products/{productId}/recipe
    getProductRecipe: builder.query({
      query: (productId) => ({
        url: `/products/${productId}/recipe`,
        method: 'GET',
      }),
      transformResponse: (response) => response.data,
      providesTags: (result, error, productId) => [{ type: 'Recipe', id: productId }],
    }),

    // POST /api/v1/products/{productId}/recipe
    createProductRecipe: builder.mutation({
      query: ({ productId, items }) => ({
        url: `/products/${productId}/recipe`,
        method: 'POST',
        data: { items },
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: (result, error, { productId }) => [{ type: 'Recipe', id: productId }, { type: 'Recipe', id: 'LIST' }],
    }),

    // PUT /api/v1/products/{productId}/recipe
    updateProductRecipe: builder.mutation({
      query: ({ productId, items }) => ({
        url: `/products/${productId}/recipe`,
        method: 'PUT',
        data: { items },
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: (result, error, { productId }) => [{ type: 'Recipe', id: productId }, { type: 'Recipe', id: 'LIST' }],
    }),

    // DELETE /api/v1/products/{productId}/recipe
    deleteProductRecipe: builder.mutation({
      query: (productId) => ({
        url: `/products/${productId}/recipe`,
        method: 'DELETE',
      }),
      transformResponse: (response) => response.data, // всегда null
      invalidatesTags: (result, error, productId) => [{ type: 'Recipe', id: productId }, { type: 'Recipe', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetAllRecipesQuery,
  useGetProductRecipeQuery,
  useCreateProductRecipeMutation,
  useUpdateProductRecipeMutation,
  useDeleteProductRecipeMutation,
} = recipeApi;