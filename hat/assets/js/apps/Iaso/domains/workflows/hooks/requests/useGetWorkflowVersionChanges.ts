/* eslint-disable camelcase */
import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { makeUrlWithParams } from '../../../../libs/utils';
import { WorkflowParams, Change } from '../../types';

type Results = {
    results: Change[];
};

const getWorkflowVersionChanges = async (
    params: WorkflowParams,
): Promise<Results> => {
    const { versionId, order } = params;

    const url = makeUrlWithParams(`/api/workflowchanges/`, {
        order: order || 'updated_at',
        version_id: versionId,
    });

    return getRequest(url) as Promise<Results>;
};

export const useGetWorkflowVersionChanges = (
    params: WorkflowParams,
): UseQueryResult<Change[], Error> => {
    const queryKey: any[] = ['workflowVersionsChanges', params];
    return useSnackQuery({
        queryKey,
        queryFn: () => getWorkflowVersionChanges(params),
        options: {
            select: data => {
                if (!data) return data;
                return data.results;
            },
        },
    });
};
