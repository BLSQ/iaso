import { UseMutationResult } from 'react-query';
import { deleteRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';

import MESSAGES from '../../messages';

export const useDeleteUserRole = (): UseMutationResult =>
    useSnackMutation({
        mutationFn: body => deleteRequest(`/api/userroles/${body.id}/`),
        snackSuccessMessage: MESSAGES.deleteSuccess,
        snackErrorMsg: MESSAGES.deleteError,
        invalidateQueryKey: ['userRoles'],
    });
