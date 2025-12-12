import { useQueryString } from 'Iaso/hooks/useApiParams';
import {
    deleteRequest,
    getRequest,
    patchRequest,
    postRequest,
} from 'Iaso/libs/Api';
import { useSnackMutation, useSnackQuery } from 'Iaso/libs/apiHooks';

const API_URL = '/api/polio/performance_thresholds/';

const tableDefaults = { order: 'indicator', page: 1, limit: 20 };

const getPerformanceThresholds = (queryString: string) =>
    getRequest(`${API_URL}?${queryString}`);

export const useGetPerformanceThresholds = ({ params }) => {
    const queryString = useQueryString(params, tableDefaults);
    return useSnackQuery({
        queryKey: ['performance-thresholds', params],
        queryFn: () => getPerformanceThresholds(queryString),
        options: {
            keepPreviousData: true,
            staleTime: Infinity,
            cacheTime: Infinity,
        },
    });
};

const savePerformanceThreshold = data => {
    if (data.id) {
        return patchRequest(
            `/api/polio/performance_thresholds/${data.id}/`,
            data,
        );
    }
    return postRequest('/api/polio/performance_thresholds/', data);
};

export const useSavePerformanceThreshold = () => {
    return useSnackMutation({
        mutationFn: data => savePerformanceThreshold(data),
        invalidateQueryKey: ['performance-thresholds'],
    });
};

const deletePerformanceThreshold = (id: string | number) => {
    return deleteRequest(`${API_URL}${id}/`);
};

export const useDeletePerformanceThreshold = () => {
    return useSnackMutation({
        mutationFn: id => deletePerformanceThreshold(id),
        invalidateQueryKey: ['performance-thresholds'],
    });
};
