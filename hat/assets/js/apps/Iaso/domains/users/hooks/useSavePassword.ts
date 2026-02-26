import { UseMutationResult } from 'react-query';
import { putRequest } from 'Iaso/libs/Api';
import { useSnackMutation } from 'Iaso/libs/apiHooks';
import { DjangoError } from 'Iaso/types/general';
import { User } from 'Iaso/utils/usersUtils';

export const useSavePassword = (
    showSuccessSnackBar = true,
): UseMutationResult<User, DjangoError, User | Partial<User>> =>
    useSnackMutation({
        mutationFn: body =>
            putRequest(`/api/profiles/${body.id}/update-password/`, body),
        invalidateQueryKey: [],
        showSuccessSnackBar,
    });
