import { UseMutationResult } from 'react-query';
import { patchRequest } from '../../../../../libs/Api';

import { useSnackMutation } from '../../../../../libs/apiHooks';

export type UseSaveChangeRequestQueryData = {
    status: 'rejected' | 'approved';
    approved_fields?: string[];
    rejection_comment?: string;
};

export const useSaveChangeRequest = (
    closeDialog: () => void,
    id?: number,
): UseMutationResult =>
    useSnackMutation({
        mutationFn: (data: UseSaveChangeRequestQueryData) =>
            patchRequest(`/api/orgunits/changes/${id}/`, data),
        invalidateQueryKey: ['getApprovalProposal', 'getApprovalProposals'],
        options: { onSuccess: () => closeDialog() },
    });
