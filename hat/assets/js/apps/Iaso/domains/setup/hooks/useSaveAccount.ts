/* eslint-disable camelcase */
import { UseMutationResult } from 'react-query';
import { postRequest } from '../../../libs/Api';
import { useSnackMutation } from '../../../libs/apiHooks';

export type SaveAccountQuery = {
    account_name: string;
    user_username: string;
    user_first_name: string;
    user_last_name: string;
    password: string;
};

const endpoint = '/api/setupaccount/';

export const useSaveAccount = (): UseMutationResult => {
    const ignoreErrorCodes = [400];

    return useSnackMutation({
        mutationFn: (data: SaveAccountQuery) => postRequest(endpoint, data),
        ignoreErrorCodes,
    });
};
