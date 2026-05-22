import { UseMutationResult } from 'react-query';
import { postRequest } from 'Iaso/libs/Api';
import { useSnackMutation } from 'Iaso/libs/apiHooks';
import MESSAGES from '../../../plannings/messages';
import { ASSIGNMENTS_API_URL } from '../../constants/api';

const bulkDeleteAssignments = async ({
    planning,
    user,
    team,
}: {
    planning?: number;
    user?: number;
    team?: number;
}): Promise<any> => {
    return postRequest(`${ASSIGNMENTS_API_URL}bulk_delete_assignments/`, {
        planning,
        user,
        team,
    });
};

export const useBulkDeleteAssignments = (): UseMutationResult => {
    return useSnackMutation({
        mutationFn: ({ planning, user, team }) =>
            bulkDeleteAssignments({ planning, user, team }),
        invalidateQueryKey: [
            'assignmentsList',
            'planningDetails',
            'planningChildrenOrgUnitsPaginated',
        ],
        snackSuccessMessage: MESSAGES.bulkDeleteAssignmentsSuccess,
    });
};
