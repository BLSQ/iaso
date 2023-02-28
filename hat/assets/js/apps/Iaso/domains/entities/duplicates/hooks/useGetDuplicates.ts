import { UseQueryResult } from 'react-query';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { waitFor } from '../../../../utils';
import { mockDuplicatesTableResponse } from '../mockDuplicationData';
import { DuplicatesList } from '../types';

const getDuplicates = async () => {
    waitFor(1000);
    return mockDuplicatesTableResponse({
        count: 21,
        has_next: true,
        has_previous: false,
        limit: 20,
    });
};

export const useGetDuplicates = (): UseQueryResult<DuplicatesList, any> => {
    return useSnackQuery({
        queryKey: ['entityDuplicates'],
        queryFn: () => getDuplicates(),
    });
};
