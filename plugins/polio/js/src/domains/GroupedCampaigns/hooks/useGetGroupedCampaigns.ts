import { UseQueryResult } from 'react-query';
import { useSnackQuery } from '../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { getRequest } from '../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { GroupedCampaigns } from '../../../constants/types';
import { makeUrlWithParams } from '../../../../../../../hat/assets/js/apps/Iaso/libs/utils';

const getGroupedCampaigns = async (
    params: Record<string, unknown>,
    signal: any,
) => {
    const endpoint = '/api/polio/campaignsgroup/';
    const url = makeUrlWithParams(endpoint, params);
    return getRequest(url, signal);
};

export const useGetGroupedCampaigns = (
    params: Record<string, unknown>,
): UseQueryResult<GroupedCampaigns, Error> => {
    const paramsForBackend = params
        ? {
              limit: params.pageSize ?? '20',
              order: params.order ?? '-updated_at',
              page: params.page ?? '1',
              search: params.search,
          }
        : {};

    return useSnackQuery(
        ['groupedCampaigns', paramsForBackend],
        ({ signal }) => getGroupedCampaigns(paramsForBackend, signal),
        undefined,
        undefined,
        {},
    );
};
