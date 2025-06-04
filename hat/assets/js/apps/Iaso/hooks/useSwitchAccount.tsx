import { UseMutationResult } from 'react-query';
import { patchRequest } from '../libs/Api';
import { useSnackMutation } from '../libs/apiHooks';

export const useSwitchAccount = (
    onSuccess?: () => void,
): UseMutationResult<any> =>
    useSnackMutation({
        mutationFn: accountId =>
            patchRequest('/api/accounts/switch/', { account_id: accountId }),
        options: { onSuccess: onSuccess || (() => null) },
        showSucessSnackBar: false,
    });
