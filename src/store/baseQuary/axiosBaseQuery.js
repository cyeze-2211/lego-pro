import $api from "../api";

export const axiosBaseQuery = () => async ({ url, method, data, params, paramsSerializer, headers, responseType }) => {
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
