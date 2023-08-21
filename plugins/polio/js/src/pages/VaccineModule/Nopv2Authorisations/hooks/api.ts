import { useApiParams } from '../../../../../../../../hat/assets/js/apps/Iaso/hooks/useApiParams';
import { useSnackQuery } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { getRequest } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';

const listUrl = '/api/polio/vaccineauthorizations/get_most_recent_update';
const baseUrl = '/api/polio/vaccineauthorizations/';

const getVaccineAuthorisationsList = params => {
    const queryString = new URLSearchParams(params).toString();
    return getRequest(`${listUrl}?${queryString}`);
};

export const useGetLatestAuthorisations = params => {
    const apiParams = useApiParams(params);
    return useSnackQuery({
        queryKey: ['latest-nopv2-auth', params],
        queryFn: () => getVaccineAuthorisationsList(apiParams),
        options: {
            keepPreviousData: true,
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
            select: data => {
                if (!data) return { results: [] };
                return data;
            },
        },
    });
};

const getAuthorisations = params => {
    const queryString = new URLSearchParams(params).toString();
    return getRequest(`${baseUrl}?${queryString}`);
};

export const useGetAuthorisations = params => {
    const apiParams = useApiParams(params);
    return useSnackQuery({
        queryKey: ['nopv2-auth', params],
        queryFn: () => getAuthorisations(apiParams),
        options: {
            keepPreviousData: true,
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
            select: data => {
                if (!data) return { results: [] };
                return data;
            },
        },
    });
};
