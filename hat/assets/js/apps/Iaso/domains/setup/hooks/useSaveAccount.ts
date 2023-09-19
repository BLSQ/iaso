/* eslint-disable camelcase */
import { UseMutationResult } from 'react-query';
import { postRequest } from '../../../libs/Api';
import { useSnackMutation } from '../../../libs/apiHooks';
import { SaveAccountQuery } from '../types/account';

const endpoint = '/api/setupaccount/';

export const useSaveAccount = (): UseMutationResult => {
    const ignoreErrorCodes = [400];

    return useSnackMutation({
        mutationFn: (data: SaveAccountQuery) => postRequest(endpoint, data),
        ignoreErrorCodes,
    });
};
