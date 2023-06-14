/* eslint-disable camelcase */
import { UseQueryResult, UseMutationResult } from 'react-query';
import { useSnackQuery, useSnackMutation } from '../../../../../libs/apiHooks';
import { Analysis } from '../../types';
import { getRequest, postRequest } from '../../../../../libs/Api';

export const useGetLatestAnalysis = (): UseQueryResult<Analysis, any> => {
    return useSnackQuery({
        queryKey: ['latestAnalysis'],
        queryFn: () =>
            getRequest(
                '/api/entityduplicates_analyzes/?order=-created_at&limit=1&page=1',
            ),
        options: {
            select: data => (data?.results ? data.results[0] : undefined),
            refetchInterval: 10000,
        },
    });
};

export type Payload = {
    algorithm: string;
    entity_type_id: number;
    fields: string[];
    parameters: Record<string, string>;
};

export const useStartAnalyse = (): UseMutationResult => {
    return useSnackMutation({
        mutationFn: (analysis: Payload) =>
            postRequest(' /api/entityduplicates_analyzes/', analysis),
        invalidateQueryKey: ['latestAnalysis'],
    });
};
