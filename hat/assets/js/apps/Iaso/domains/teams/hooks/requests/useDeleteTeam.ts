import { UseMutationResult, useQueryClient } from 'react-query';
import { deleteRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';

import MESSAGES from '../../messages';
import { Team } from '../../types/team';

export const useDeleteTeam = (): UseMutationResult => {
    const queryClient = useQueryClient();
    return useSnackMutation({
        mutationFn: body => deleteRequest(`/api/teams/${body.id}/`),
        invalidateQueryKey: ['teamsList', 'teamsDropdown'],
        snackSuccessMessage: MESSAGES.deleteSuccess,
        snackErrorMsg: MESSAGES.deleteError,
        options: {
            onSuccess: (_, variables: Team) => {
                queryClient.invalidateQueries(['team', `team-${variables.id}`]);
            },
        },
    });
};
