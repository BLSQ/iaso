import { UseMutationResult } from 'react-query';
import { patchRequest } from '../libs/Api';
import { useSnackMutation } from '../libs/apiHooks';

export const useSwitchAccount = (): UseMutationResult<any> =>
    useSnackMutation({
        mutationFn: accountId =>
            patchRequest('/api/accounts/switch/', { account_id: accountId }),
    });
