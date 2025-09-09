import { UseMutationResult } from 'react-query';
import { patchRequest } from '../../../libs/Api';
import { useSnackMutation } from '../../../libs/apiHooks';

export const useSaveCurrentUser = (
    showSucessSnackBar = true,
): UseMutationResult<any> =>
    useSnackMutation({
        mutationFn: body => patchRequest(`/api/profiles/me/`, body),
        showSucessSnackBar,
        invalidateQueryKey: 'usersHistoryList',
    });
