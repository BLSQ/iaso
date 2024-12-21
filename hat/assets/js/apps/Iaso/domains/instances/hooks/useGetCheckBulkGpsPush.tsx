import { UseQueryResult } from 'react-query';
import { useSnackQuery } from '../../../libs/apiHooks';
import { getRequest } from '../../../libs/Api';
import { makeUrlWithParams } from '../../../libs/utils';
import { CheckBulkGpsPushResult } from '../types/instance';

export const useGetCheckBulkGpsPush = (
    params,
): UseQueryResult<CheckBulkGpsPushResult> => {
    return useSnackQuery({
        queryKey: ['bulkGpsCheck', params],
        queryFn: () => {
            return getRequest(
                makeUrlWithParams(
                    '/api/instances/check_bulk_gps_push/',
                    params,
                ),
            );
        },

        options: {
            select: data => {
                return data;
            },
        },
    });
};
