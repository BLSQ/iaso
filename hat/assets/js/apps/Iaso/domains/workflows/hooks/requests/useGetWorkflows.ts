/* eslint-disable camelcase */
import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { makeUrlWithParams } from '../../../../libs/utils';
import {
    WorkflowsPaginated,
    WorkflowsParams,
    WorkflowDetail,
} from '../../types/workflows';

const getWorkflows = async (
    options: WorkflowsParams,
): Promise<WorkflowsPaginated> => {
    const { pageSize, entityTypeId, ...params } = options as Record<
        string,
        any
    >;
    if (pageSize) {
        params.limit = pageSize;
    }
    params.workflow__entity_type = entityTypeId;
    // TODO: plug me to the api

    const url = makeUrlWithParams(`/api/workflowversion/`, params);

    return getRequest(url) as Promise<WorkflowsPaginated>;
};

export const useGetWorkflows = (
    options: WorkflowsParams,
): UseQueryResult<WorkflowsPaginated, Error> => {
    const queryKey: any[] = ['workflows', options];
    const { select } = options as Record<string, any>;
    // @ts-ignore
    return useSnackQuery({
        queryKey,
        queryFn: () => getWorkflows(options),
        options: {
            select,
        },
    });
};

const getWorkflow = async (versionId: string): Promise<WorkflowDetail> => {
    // TODO: plug me to the api
    return getRequest(
        `/api/workflowversion/?version_id=${versionId}`,
    ) as Promise<WorkflowDetail>;
};

export const useGetWorkflow = (
    versionId: string,
): UseQueryResult<WorkflowDetail, Error> => {
    const queryKey: any[] = ['workflow', versionId];
    // @ts-ignore
    return useSnackQuery({
        queryKey,
        queryFn: () => getWorkflow(versionId),
        options: { enabled: Boolean(versionId) },
    });
};
