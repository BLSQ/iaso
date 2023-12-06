import { useUrlParams } from '../../../../../../../../hat/assets/js/apps/Iaso/hooks/useUrlParams';
import { useApiParams } from '../../../../../../../../hat/assets/js/apps/Iaso/hooks/useApiParams';
import { useSnackQuery } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { waitFor } from '../../../../../../../../hat/assets/js/apps/Iaso/utils';
import { mockVaccineStockList } from '../mocks/mockVaccineStockList';
import {
    mockUnusableVials,
    mockUsableVials,
} from '../mocks/mockVaccineStockDetails';

// eslint-disable-next-line no-unused-vars
const getVaccineStockList = async params => {
    await waitFor(750);
    return mockVaccineStockList;
};

const defaults = {
    order: 'country',
    pageSize: 20,
    page: 1,
};

const options = {
    select: data => {
        if (!data) return { results: [] };
        return data;
    },
    keepPreviousData: true,
    staleTime: 1000 * 60 * 15, // in MS
    cacheTime: 1000 * 60 * 5,
};

export const useGetVaccineStockList = params => {
    const safeParams = useUrlParams(params, defaults);
    const apiParams = useApiParams(safeParams);
    return useSnackQuery({
        queryKey: [
            'vaccine-stock-list',
            apiParams,
            apiParams.page,
            apiParams.limit,
            apiParams.order,
        ],
        queryFn: () => getVaccineStockList(params),
        options,
    });
};

// eslint-disable-next-line no-unused-vars
const getUsableVials = async params => {
    await waitFor(750);
    return mockUsableVials;
};

// Need to pass id to apiUrl
export const useGetUsableVials = (params, enabled: boolean) => {
    return useSnackQuery({
        queryKey: ['usable-vials'],
        queryFn: () => getUsableVials(params),
        options: { ...options, enabled },
    });
};

// eslint-disable-next-line no-unused-vars
const getUnusableVials = async params => {
    await waitFor(750);
    return mockUnusableVials;
};
// Need to pass id to apiUrl
// Splitting both hooks to be able to store both payloads in the cache and avoid refteching with each tab change
export const useGetUnusableVials = (params, enabled: boolean) => {
    return useSnackQuery({
        queryKey: ['unusable-vials'],
        queryFn: () => getUnusableVials(params),
        options: { ...options, enabled },
    });
};
