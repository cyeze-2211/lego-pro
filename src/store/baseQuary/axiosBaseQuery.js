import $api from "../api";
import { shapeUpdatePayload } from "./updateSchemas";

export const axiosBaseQuery = () => async ({ url, method, data, params, paramsSerializer, headers, responseType, schema }) => {
    // PUT/PATCH: backend sxemasi bo‘yicha majburiy maydonlarni tekshirish va noma'lum maydonlarni olib tashlash
    if (schema) {
        const shaped = shapeUpdatePayload(schema, data);
        if (shaped.error) return { error: { status: 400, data: { message: shaped.error, status: false } } };
        data = shaped.data;
    }
    try {
        const result = await $api({ url, method, data, params, paramsSerializer, ...(headers ? { headers } : {}), ...(responseType ? { responseType } : {}) });
        return { data: result.data };
    } catch (axiosError) {
        let err = axiosError;
        return {
            error: {
                status: err.response?.status,
                data: err.response?.data || err.message,
            },
        };
    }
};
