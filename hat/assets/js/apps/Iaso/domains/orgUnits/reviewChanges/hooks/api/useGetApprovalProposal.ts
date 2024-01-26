import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../../libs/Api';
import { useSnackQuery } from '../../../../../libs/apiHooks';
import { OrgUnitChangeRequestDetails } from '../../types';

const apiUrl = '/api/orgunits/changes/';

const getOrgUnitChangeProposal = (id?: number) => {
    const url = `${apiUrl}${id}/`;

    return getRequest(url) as Promise<OrgUnitChangeRequestDetails>;
};

export const useGetApprovalProposal = (
    id?: number,
): UseQueryResult<OrgUnitChangeRequestDetails, Error> => {
    return useSnackQuery({
        queryKey: ['getApprovalProposal', id],
        queryFn: () => getOrgUnitChangeProposal(id),
        options: {
            enabled: Boolean(id),
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
        },
    });
};
