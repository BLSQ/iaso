/* eslint-disable camelcase */
import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { makeUrlWithParams } from '../../../../libs/utils';
import {
    WorkflowVersionsPaginated,
    WorkflowsParams,
    WorkflowVersionDetail,
} from '../../types/workflows';

const getWorkflowVersions = async (
    options: WorkflowsParams,
): Promise<WorkflowVersionsPaginated> => {
    const { pageSize, entityTypeId, ...params } = options as Record<
        string,
        any
    >;
    if (pageSize) {
        params.limit = pageSize;
    }
    params.workflow__entity_type = entityTypeId;
    // TODO: plug me to the api

    const url = makeUrlWithParams(`/api/workflowversions/`, params);

    return getRequest(url) as Promise<WorkflowVersionsPaginated>;
};

export const useGetWorkflowVersions = (
    options: WorkflowsParams,
): UseQueryResult<WorkflowVersionsPaginated, Error> => {
    const queryKey: any[] = ['workflows', options];
    const { select } = options as Record<string, any>;
    // @ts-ignore
    return useSnackQuery({
        queryKey,
        queryFn: () => getWorkflowVersions(options),
        options: {
            select,
        },
    });
};

const getWorkflowVersion = async (
    versionId: string,
): Promise<WorkflowVersionDetail> => {
    // TODO: plug me to the api
    return getRequest(
        `/api/workflowversions/${versionId}/`,
    ) as Promise<WorkflowVersionDetail>;
};

export const useGetWorkflowVersion = (
    versionId: string,
): UseQueryResult<WorkflowVersionDetail, Error> => {
    const queryKey: any[] = ['workflow', versionId];
    // @ts-ignore
    return useSnackQuery({
        queryKey,
        queryFn: () => getWorkflowVersion(versionId),
        options: { enabled: Boolean(versionId) },
    });
};
