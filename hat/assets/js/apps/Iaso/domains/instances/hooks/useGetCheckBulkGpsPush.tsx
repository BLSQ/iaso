import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../libs/Api';
import { useSnackQuery } from '../../../libs/apiHooks';
import { makeUrlWithParams } from '../../../libs/utils';
import { CheckBulkGpsPushResult } from '../types/instance';

export const useGetCheckBulkGpsPush = (
    params: Record<string, any>,
): UseQueryResult<CheckBulkGpsPushResult> => {
    return useSnackQuery({
        queryKey: ['bulkGpsCheck', params],
        queryFn: () =>
            getRequest(
                makeUrlWithParams(
                    '/api/instances/check_bulk_gps_push/',
                    params,
                ),
            ),
        options: {
            select: data => {
                return data;
            },
        },
        ignoreErrorCodes: [400],
    });
};
