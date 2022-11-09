import { UseBaseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';

const getCompletenessStats = () => getRequest('/api/completeness_stats/');

export const useGetCompletenessStats = (): UseBaseQueryResult => {
    return useSnackQuery({
        queryKey: ['completenessStats'],
        queryFn: () => getCompletenessStats(),
        options: {
            select: (data: any[]): any[] => {
                return data.completeness;
            },
        },
    });
};
