/* eslint-disable camelcase */
import { getRequest } from '../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackQuery } from '../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { makeUrlWithParams } from '../../../../../hat/assets/js/apps/Iaso/libs/utils';
import { UrlParams } from '../../../../../hat/assets/js/apps/Iaso/types/table';

const endpoint = '/api/polio/budgetevent';

type Params = Partial<UrlParams> & { campaign_id: string };

const getBudgetDetails = async (params?: Params) => {
    if (params) {
        const { pageSize, ...otherParams } = params;
        const urlParams = {
            ...otherParams,
            limit: pageSize ?? 10,
        };
        const url = makeUrlWithParams(endpoint, urlParams);
        return getRequest(url);
    }
    return getRequest(endpoint);
};

export const useGetBudgetDetails = (params?: Params) => {
    return useSnackQuery(
        ['budget-details', params],
        () => getBudgetDetails(params),
        undefined,
        // Had to add these options,  otherwise the data would not update, even though params would change
        { staleTime: 1, keepPreviousData: true },
    );
};

const getAllBudgetDetails = campaignId => {
    return getRequest(`${endpoint}/?campaign_id=${campaignId}`);
};
export const useGetAllBudgetDetails = campaignId => {
    return useSnackQuery(['budget-details'], () =>
        getAllBudgetDetails(campaignId),
    );
};
