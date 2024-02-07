import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../../libs/Api';
import { useSnackQuery } from '../../../../../libs/apiHooks';
import { OrgUnitChangeRequestDetails } from '../../types';

const apiUrl = '/api/orgunits/changes/';

export const useGetApprovalProposal = (
    id?: number,
): UseQueryResult<OrgUnitChangeRequestDetails, Error> => {
    return useSnackQuery({
        queryKey: ['getApprovalProposal', id],
        queryFn: () => getRequest(`${apiUrl}${id}/`),
        options: {
            enabled: Boolean(id),
            staleTime: 1000 * 60 * 15,
            cacheTime: 1000 * 60 * 5,
        },
    });
};
