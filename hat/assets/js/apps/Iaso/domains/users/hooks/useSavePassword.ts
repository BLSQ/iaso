import { UseMutationResult } from 'react-query';
import { SaveUserPasswordQuery } from 'Iaso/domains/users/types';
import { putRequest } from 'Iaso/libs/Api';
import { useSnackMutation } from 'Iaso/libs/apiHooks';
import { DjangoError } from 'Iaso/types/general';

export const useSavePassword = (
    id: number | string | undefined,
    showSuccessSnackBar = true,
): UseMutationResult<void, DjangoError, SaveUserPasswordQuery> =>
    useSnackMutation({
        mutationFn: body =>
            putRequest(`/api/v2/profiles/${id}/update-password/`, body),
        invalidateQueryKey: [],
        showSuccessSnackBar,
    });
