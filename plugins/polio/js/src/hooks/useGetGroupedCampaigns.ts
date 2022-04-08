import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { getRequest } from 'Iaso/libs/Api';
import { UseQueryResult } from 'react-query';
import { GroupedCampaigns } from '../constants/types';
import { makeUrlWithParams } from '../../../../../hat/assets/js/apps/Iaso/libs/utils';

const getGroupedCampaigns = async (params: Record<string, unknown>) => {
    const endpoint = '/api/polio/campaignsgroup/';
    const url = makeUrlWithParams(endpoint, params);
    return getRequest(url);
};

export const useGetGroupedCampaigns = (
    params: Record<string, unknown> = {},
): UseQueryResult<GroupedCampaigns, Error> => {
    const paramsForBackend = {
        limit: params.pageSize ?? '20',
        order: params.order ?? 'name',
        page: params.page ?? '1',
    };

    return useSnackQuery(
        ['groupedCampaigns', paramsForBackend],
        () => getGroupedCampaigns(paramsForBackend),
        undefined,
        undefined,
        {},
    );
};
