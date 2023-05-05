import { UseMutationResult } from 'react-query';
import { useSnackMutation } from '../../../../../libs/apiHooks';
import { waitFor } from '../../../../../utils';

const apiUrl = '/api/entityduplicates';

const mergedEntity = {
    id: 2,
    uuid: '7f0be2bc-16b8-4532-ae0d-c3712e0539aa',
    name: 'Lisa Sampson',
    created_at: '2022-08-16T13:26:22.470058Z',
    updated_at: '2022-08-16T13:26:22.470058Z',
    attributes: 5,
    entity_type: 11,
    entity_type_name: 'Children under 5',
};

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
