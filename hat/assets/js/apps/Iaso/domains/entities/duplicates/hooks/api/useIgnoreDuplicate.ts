import { UseMutationResult } from 'react-query';
import { postRequest } from '../../../../../libs/Api';
import { useSnackMutation } from '../../../../../libs/apiHooks';

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
    onSuccess: (data: any) => void = _data => null,
): UseMutationResult => {
    return useSnackMutation({
        mutationFn: args => ignoreDuplicate(args),
        options: { onSuccess },
    });
};
