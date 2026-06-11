import { UseMutationResult } from 'react-query';
import { postRequest } from '../libs/Api';
import { useSnackMutation } from '../libs/apiHooks';

export const useSwitchAccount = (
    onSuccess?: () => void,
): UseMutationResult<any> =>
    useSnackMutation({
        mutationFn: accountId =>
            postRequest('/api/accounts/switch/', { account_id: accountId }),
        options: { onSuccess: onSuccess || (() => null) },
        showSuccessSnackBar: false,
    });
