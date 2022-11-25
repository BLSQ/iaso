/* eslint-disable camelcase */
import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
// import { makeUrlWithParams } from '../../../../libs/utils';
import {
    WorkflowsPaginated,
    WorkflowsParams,
    WorkflowDetail,
} from '../../types/workflows';

import { list, details } from './fixture';

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
    // TODO: plug me to the api
    // const url = makeUrlWithParams(
    //     `/api/workflow/entity_type_id/${entityTypeId}/`,
    //     params,
    // );
    return list as WorkflowsPaginated;
    // return getRequest(url) as Promise<WorkflowsPaginated>;
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

const getWorkflow = async (
    versionId: string,
    entityTypeId: string,
): Promise<WorkflowDetail> => {
    // TODO: plug me to the api
    return details as WorkflowDetail;
    // return getRequest(
    //     `/api/workflow/entity_type_id/${entityTypeId}/version_id/${versionId}/`,
    // ) as Promise<WorkflowDetail>;
};

export const useGetWorkflow = (
    versionId: string,
    entityTypeId: string,
): UseQueryResult<WorkflowDetail, Error> => {
    const queryKey: any[] = ['workflow', versionId];
    // @ts-ignore
    return useSnackQuery({
        queryKey,
        queryFn: () => getWorkflow(versionId, entityTypeId),
        options: { enabled: Boolean(versionId) && Boolean(entityTypeId) },
    });
};
