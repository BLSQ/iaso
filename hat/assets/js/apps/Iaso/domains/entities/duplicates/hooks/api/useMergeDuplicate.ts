/* eslint-disable camelcase */
import { UseMutationResult } from 'react-query';
import { useSnackMutation } from '../../../../../libs/apiHooks';
import { postRequest } from '../../../../../libs/Api';

const apiUrl = '/api/entityduplicates/';

type UseMergeDuplicatesParams = {
    merge: Record<string, number>;
    entity1_id: number;
    entity2_id: number;
};

const mergeDuplicate = (query: UseMergeDuplicatesParams) => {
    return postRequest({ url: apiUrl, data: query });
};

export const useMergeDuplicate = (
    successSnackBar: any,
    // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    onSuccess: (data: any) => void = _data => {},
): UseMutationResult => {
    return useSnackMutation({
        mutationFn: query => mergeDuplicate(query),
        invalidateQueryKey: 'entityDuplicates',
        successSnackBar,
        options: { onSuccess },
    });
};
