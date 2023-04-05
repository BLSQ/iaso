import { UseMutationResult } from 'react-query';
import { useSnackMutation } from '../../../../../libs/apiHooks';
import { waitFor } from '../../../../../utils';
import { mergedEntity } from '../../mockDuplicationData';

const apiUrl = '/api/entityduplicates';

const mergeDuplicate = async (query: Record<string, any>): Promise<any> => {
    console.log('PATCH', apiUrl, query);
    waitFor(1500);
    return mergedEntity;
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
