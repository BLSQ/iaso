/* eslint-disable camelcase */
import { UseMutationResult } from 'react-query';
import { postRequest } from '../../../libs/Api';
import { useSnackMutation } from '../../../libs/apiHooks';

export type SaveAccountApiQuery = {
    account_name: string;
    user_username: string;
    user_first_name: string;
    user_last_name: string;
    password: string;
};

export type SaveAccountQuery = {
    accountName: string;
    userName: string;
    firstName: string;
    lastName: string;
    password: string;
};
const convertToApi = (data: SaveAccountQuery): SaveAccountApiQuery => ({
    account_name: data.accountName,
    user_username: data.userName,
    user_first_name: data.firstName,
    user_last_name: data.lastName,
    password: data.password,
});

const endpoint = '/api/setupaccount/';

export const useSaveAccount = ({
    onSuccess,
}: {
    onSuccess: () => void;
}): UseMutationResult => {
    const ignoreErrorCodes = [400];

    return useSnackMutation({
        mutationFn: (data: SaveAccountQuery) =>
            postRequest(endpoint, convertToApi(data)),
        ignoreErrorCodes,
        options: {
            onSuccess,
        },
    });
};
