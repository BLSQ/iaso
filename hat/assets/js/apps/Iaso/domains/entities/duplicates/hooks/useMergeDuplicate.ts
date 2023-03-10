import { UseMutationResult } from 'react-query';
import { useSnackMutation } from '../../../../libs/apiHooks';
import { waitFor } from '../../../../utils';
import { Entity } from '../../types/entity';
import { mergedEntity } from '../mockDuplicationData';

const apiUrl = '/api/entityduplicates'

const mergeDuplicate = async (query:Record<string,any>): Promise<any> => {
    console.log("PATCH", apiUrl, query)
    waitFor(1500);
    return mergedEntity
};

export const useMergeDuplicate = () :UseMutationResult=> {
    return useSnackMutation({
        mutationFn: query => mergeDuplicate(query),
        invalidateQueryKey: 'entityDuplicates',
    });
};
