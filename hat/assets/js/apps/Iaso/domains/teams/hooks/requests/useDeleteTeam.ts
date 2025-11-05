import { UseMutationResult } from 'react-query';
import { useSnackMutation } from '../../../../libs/apiHooks';
import { deleteRequest } from '../../../../libs/Api';

import MESSAGES from '../../messages';

export const useDeleteTeam = (): UseMutationResult =>
    useSnackMutation(
        body => deleteRequest(`/api/teams/${body.id}/`),
        MESSAGES.deleteSuccess,
        MESSAGES.deleteError,
        ['teamsList'],
    );
