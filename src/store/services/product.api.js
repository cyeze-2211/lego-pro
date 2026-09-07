import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../baseQuary/axiosBaseQuery';

export const productApi = createApi({
  reducerPath: 'productApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Product'],
  endpoints: (builder) => ({
    // GET /api/v1/products – список товаров с пагинацией и фильтром по имени
    getProducts: builder.query({
      query: ({ name, page = 0, size = 20, sort = ['createdAt,DESC', 'id,DESC'] }) => ({
        url: '/products',
        method: 'GET',
        params: {
          name,
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
              ...result.items.map(({ id }) => ({ type: 'Product', id })),
              { type: 'Product', id: 'LIST' },
            ]
          : [{ type: 'Product', id: 'LIST' }],
    }),

    // GET /api/v1/products/{id} – получить один товар по ID
    getProductById: builder.query({
      query: (id) => ({
        url: `/products/${id}`,
        method: 'GET',
      }),
      transformResponse: (response) => response.data,
      providesTags: (result, error, id) => [{ type: 'Product', id }],
    }),

    // GET /api/v1/products/by-barcode/{barcode} – получить товар по штрих-коду
    getProductByBarcode: builder.query({
      query: (barcode) => ({
        url: `/products/by-barcode/${barcode}`,
        method: 'GET',
      }),
      transformResponse: (response) => response.data,
      providesTags: (result, error, barcode) => [{ type: 'Product', id: barcode }], // можно использовать barcode как временный идентификатор
    }),

    // POST /api/v1/products – создать новый товар
    createProduct: builder.mutation({
      query: (data) => ({
        url: '/products',
        method: 'POST',
        data,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: [{ type: 'Product', id: 'LIST' }],
    }),

    // PUT /api/v1/products/{id} – полностью обновить товар (name и price)
    updateProduct: builder.mutation({
      query: ({ id, data }) => ({
        url: `/products/${id}`,
        method: 'PUT',
        data,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: 'Product', id },
        { type: 'Product', id: 'LIST' },
      ],
    }),

    // DELETE /api/v1/products/{id} – мягкое удаление товара
    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `/products/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (response) => response.data, // всегда null
      invalidatesTags: (result, error, id) => [
        { type: 'Product', id },
        { type: 'Product', id: 'LIST' },
      ],
    }),
  }),
});

// Экспорт хуков для использования в компонентах
export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useGetProductByBarcodeQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} = productApi;