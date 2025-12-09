import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { useApiParams } from '../../../../../../../../../hat/assets/js/apps/Iaso/hooks/useApiParams';
import { useUrlParams } from '../../../../../../../../../hat/assets/js/apps/Iaso/hooks/useUrlParams';
import { getRequest } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { NationalLogisticsPlanList } from '../../types';

const getNationalLogisticsPlan = (params: any) => {
    const queryString = new URLSearchParams(params).toString();
    return getRequest(`/api/polio/country_plan/?${queryString}`);
};

export const useGetNationalLogisticsPlan = (params: any) => {
    const safeParams = useUrlParams(params);
    const apiParams = useApiParams(safeParams);

    return useSnackQuery<NationalLogisticsPlanList>({
        queryKey: ['national-logistics-plan', apiParams],
        queryFn: () => getNationalLogisticsPlan(apiParams),
        options: {
            keepPreviousData: true,
            staleTime: 1000 * 60 * 5, // 5 minutes
            cacheTime: 1000 * 60 * 5,
        },
    });
};
