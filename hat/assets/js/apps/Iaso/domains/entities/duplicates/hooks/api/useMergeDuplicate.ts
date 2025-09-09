import { UseMutationResult } from 'react-query';
import { postRequest } from '../../../../../libs/Api';
import { useSnackMutation } from '../../../../../libs/apiHooks';

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
    onSuccess: (data: any) => void = _data => null,
): UseMutationResult => {
    return useSnackMutation({
        mutationFn: query => mergeDuplicate(query),
        invalidateQueryKey: 'entityDuplicates',
        successSnackBar,
        options: { onSuccess },
    });
};
