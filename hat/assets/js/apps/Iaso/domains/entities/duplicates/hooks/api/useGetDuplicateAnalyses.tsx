import { UseQueryResult } from 'react-query';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { PaginationParams } from 'Iaso/types/general';
import { formatParams } from 'Iaso/utils/requests';
import { AnalysisList } from '../../types';

export type DuplicateAnalysesGETParams = {
    params: Partial<PaginationParams> & {
        start_date: any;
        end_date: any;
        users: any;
        status: any;
    };
};

export const useGetDuplicateAnalyses = ({
    params,
}: {
    params: DuplicateAnalysesGETParams;
}): UseQueryResult<AnalysisList, any> => {
    const queryString = new URLSearchParams(formatParams(params)).toString();

    return useSnackQuery({
        queryKey: ['analysis', params],
        queryFn: () =>
            getRequest(`/api/entityduplicates_analyzes/?${queryString}`),
        options: {
            // refetchInterval: 10000,
        },
    });
};
