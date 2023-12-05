import { getRequest } from '../../../../../libs/Api';
import { useSnackQuery } from '../../../../../libs/apiHooks';

const apiUrl = '/api/orgunits/changes';

const getOrgUnitChangeProposals = () => {
    return getRequest(apiUrl);
};

export const useGetApprovalProposals = () => {
    return useSnackQuery({
        queryKey: ['getApprovalProposals'],
        queryFn: () => getOrgUnitChangeProposals(),
    });
};
