import { UseMutationOptions, UseMutationResult } from 'react-query';
import { postRequest } from 'Iaso/libs/Api';
import { useSnackMutation } from 'Iaso/libs/apiHooks';
import { DjangoError } from 'Iaso/types/general';
import { User } from 'Iaso/utils/usersUtils';

export const useCreateProfile = (
    showSuccessSnackBar = true,
    options?: UseMutationOptions<User, DjangoError, User | Partial<User>>,
): UseMutationResult<User, DjangoError, User | Partial<User>> =>
    useSnackMutation({
        mutationFn: body => postRequest('/api/profiles/', body),
        invalidateQueryKey: ['profiles', 'usersHistoryList', 'team'],
        showSuccessSnackBar,
        ignoreErrorCodes: [400],
        options,
    });
