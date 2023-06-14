/* eslint-disable camelcase */
import { UseMutationResult } from 'react-query';
import { useSnackMutation } from '../../../../../libs/apiHooks';
import { postRequest } from '../../../../../libs/Api';

type IgnoreDuplicateArgs = {
    entity1_id: number;
    entity2_id: number;
    reason?: string;
};

const apiUrl = '/api/entityduplicates/';

const ignoreDuplicate = (query: IgnoreDuplicateArgs) => {
    return postRequest({ url: apiUrl, data: { ...query, ignore: true } });
};

export const useIgnoreDuplicate = (
    // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    onSuccess: (data: any) => void = _data => {},
): UseMutationResult => {
    return useSnackMutation({
        mutationFn: args => ignoreDuplicate(args),
        options: { onSuccess },
    });
};
