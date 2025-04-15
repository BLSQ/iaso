import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../libs/Api';
import { useSnackQuery } from '../../../libs/apiHooks';
import { makeUrlWithParams } from '../../../libs/utils';
import { CheckReferenceSubmissionLinkResult } from '../types/instance';

export const useGetCheckBulkReferenceInstanceLink = (
    params: Record<string, any>,
): UseQueryResult<CheckReferenceSubmissionLinkResult> => {
    return useSnackQuery({
        queryKey: ['bulkReferenceInstanceLinkCheck', params],
        queryFn: () =>
            getRequest(
                makeUrlWithParams(
                    '/api/instances/check_bulk_reference_instance_link/',
                    params,
                ),
            ),
        ignoreErrorCodes: [400],
    });
};
