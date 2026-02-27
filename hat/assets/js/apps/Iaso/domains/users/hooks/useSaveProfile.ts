import { UseMutationResult } from 'react-query';
import { patchRequest } from 'Iaso/libs/Api';
import { useSnackMutation } from 'Iaso/libs/apiHooks';
import { DjangoError } from 'Iaso/types/general';
import { User } from 'Iaso/utils/usersUtils';

export const useSaveProfile = (
    id?: number | string | undefined,
    showSuccessSnackBar = true,
): UseMutationResult<User, DjangoError, User | Partial<User>> =>
    useSnackMutation({
        mutationFn: ({ id: userId, ...body }) =>
            patchRequest(`/api/profiles/${id ?? userId}/`, body),
        invalidateQueryKey: ['profiles', 'usersHistoryList', 'team', 'userDetail'],
        showSuccessSnackBar,
    });