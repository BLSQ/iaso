import { UseMutationResult } from 'react-query';
import { useSnackMutation } from '../../../../libs/apiHooks';
import { deleteRequest } from '../../../../libs/Api';

import MESSAGES from '../../messages';

export const useDeleteUserRole = (): UseMutationResult =>
    useSnackMutation(
        body => deleteRequest(`/api/userroles/${body.id}/`),
        MESSAGES.deleteSuccess,
        MESSAGES.deleteError,
        ['userRolesList'],
    );
