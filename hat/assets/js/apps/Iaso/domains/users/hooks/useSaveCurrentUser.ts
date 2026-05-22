import { UseMutationResult } from 'react-query';
import { patchRequest } from 'Iaso/libs/Api';
import { useSnackMutation } from 'Iaso/libs/apiHooks';

export const useSaveCurrentUser = (
    showSuccessSnackBar = true,
): UseMutationResult<any> =>
    useSnackMutation({
        mutationFn: body => patchRequest(`/api/profiles/me/`, body),
        showSuccessSnackBar,
        invalidateQueryKey: 'usersHistoryList',
    });
