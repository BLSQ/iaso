import { UseMutationResult } from 'react-query';
import { useSnackMutation } from '../../../../libs/apiHooks';
import { waitFor } from '../../../../utils';
import { mergedEntity } from '../mockDuplicationData';

const apiUrl = '/api/entityduplicates';

const mergeDuplicate = async (query: Record<string, any>): Promise<any> => {
    console.log('PATCH', apiUrl, query);
    waitFor(1500);
    return mergedEntity;
};

export const useMergeDuplicate = (successSnackBar): UseMutationResult => {
    return useSnackMutation({
        mutationFn: query => mergeDuplicate(query),
        invalidateQueryKey: 'entityDuplicates',
        successSnackBar,
    });
};
