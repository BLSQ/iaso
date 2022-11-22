/* eslint-disable camelcase */
import { UseQueryResult } from 'react-query';
// import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
// import { makeUrlWithParams } from '../../../../libs/utils';
import { WorkflowsPaginated, WorkflowsParams } from '../../types/workflows';

import fixture from './fixture';

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
    //     `/api/workflow/entity_type_id/${entityTypeId}`,
    //     params,
    // );
    return fixture as WorkflowsPaginated;
    // return getRequest(url) as Promise<WorkflowsPaginated>;
};

export const useGetWorkflows = (
    options: WorkflowsParams,
): UseQueryResult<WorkflowsPaginated, Error> => {
    const queryKey: any[] = ['workflows', options];
    const { select } = options as Record<string, any>;
    // @ts-ignore
    return useSnackQuery(queryKey, () => getWorkflows(options), undefined, {
        select,
    });
};
