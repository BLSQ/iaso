/* eslint-disable camelcase */
import { getRequest } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackQuery } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';

const getBudgetDetails = (params: any) => {
    const { pageSize, ...otherParams } = params;
    const urlParams = {
        ...otherParams,
        limit: pageSize ?? 10,
    };
    const filteredParams = Object.entries(urlParams).filter(
        // eslint-disable-next-line no-unused-vars
        ([_key, value]) => value !== undefined,
    );
    const queryString = new URLSearchParams(
        Object.fromEntries(filteredParams) as Record<string, any>,
    ).toString();
    return getRequest(`/api/polio/budgetsteps/?${queryString}`);
};

export const useGetBudgetDetails = params => {
    return useSnackQuery({
        queryFn: () => getBudgetDetails(params),
        queryKey: ['budget', 'details', params],
    });
};
