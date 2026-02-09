import { UseMutationResult } from 'react-query';
import { postRequest, patchRequest } from 'Iaso/libs/Api';
import { useSnackMutation } from 'Iaso/libs/apiHooks';
import { DjangoError } from 'Iaso/types/general';
import { User } from 'Iaso/utils/usersUtils';

export const useSaveProfile = (
    showSuccessSnackBar = true,
): UseMutationResult<User, DjangoError, User | Partial<User>> =>
    useSnackMutation({
        mutationFn: body =>
            body.id
                ? patchRequest(`/api/profiles/${body.id}/`, body)
                : postRequest('/api/profiles/', body),
        invalidateQueryKey: ['profiles', 'usersHistoryList', 'team'],
        showSuccessSnackBar,
    });

export const useSaveProfileColor = (
    showSuccessSnackBar = true,
): UseMutationResult<User, DjangoError, { id: number; color: string }> =>
    useSnackMutation({
        mutationFn: ({ id, color }) =>
            patchRequest(`/api/profiles/${id}/update_color/`, { color }),
        invalidateQueryKey: ['profiles', 'usersHistoryList', 'team'],
        showSuccessSnackBar,
    });
