import { UrlParams } from 'bluesquare-components';
import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackQuery } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { makeUrlWithParams } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/utils';

export type DateLogsUrlParams = UrlParams & { roundId?: number };

const apiUrl = '/api/polio/datelogs/';

const getRoundDatesHistory = params => {
    const urlParams = { ...params, round__id: params.roundId };
    if (params.pageSize) {
        urlParams.limit = params.pageSize;
        delete urlParams.pageSize;
    }
    delete urlParams.roundId;
    const url = makeUrlWithParams(apiUrl, urlParams);
    return getRequest(url);
};
export const useGetRoundDatesHistory = (
    params: DateLogsUrlParams,
): UseQueryResult<any> => {
    return useSnackQuery({
        queryKey: ['datelogs', params],
        queryFn: () => getRoundDatesHistory(params),
        options: { enabled: Boolean(params.roundId) },
    });
};
