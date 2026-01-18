import { UseMutationResult } from 'react-query';

import { postRequest } from 'Iaso/libs/Api';
import { useSnackMutation } from 'Iaso/libs/apiHooks';
import MESSAGES from '../../messages';

export type Params = {
    planning: number;
};

const bulkDeleteAssignments = async (planning?: number): Promise<any> => {
    return postRequest(
        `/api/microplanning/assignments/bulk_delete_assignments/`,
        { planning },
    );
};

export const useBulkDeleteAssignments = (
    planningId?: number,
): UseMutationResult => {
    return useSnackMutation({
        mutationFn: () => bulkDeleteAssignments(planningId),
        invalidateQueryKey: ['assignmentsList'],
        snackSuccessMessage: MESSAGES.bulkDeleteAssignmentsSuccess,
    });
};
