import { UseQueryResult } from 'react-query';
import {
    PaginatedValidationWorkflowListList,
    useApiValidationWorkflowsList,
    useApiValidationWorkflowsRetrieve,
    ValidationWorkflowRetrieve,
} from 'Iaso/api';
import { ApiValidationWorkflowsListParams } from 'Iaso/api/models';
import { ValidationNodeTemplateRetrieveResponse } from 'Iaso/domains/instances/validationWorkflow/types/validationNodeTemplates';
import {
    ValidationWorkflowListDropdownResponse,
    ValidationWorkflowListResponse,
} from 'Iaso/domains/instances/validationWorkflow/types/validationWorkflows';
import { useApiParams } from 'Iaso/hooks/useApiParams';
import { useUrlParams } from 'Iaso/hooks/useUrlParams';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { API_URL, WF_BASE_QUERYKEY } from '../constants';
const defaults = {
    order: 'name',
    pageSize: 20,
    page: 1,
};

export const useCustomApiValidationWorkflowsList = (
    params: Record<string, any>,
    options?: Record<string, any>,
): UseQueryResult<ValidationWorkflowListResponse, Error> => {
    // we do that so we can validate through zod
    // or we could just drop the zod validation till orval implements it
    const safeParams = useUrlParams(params, defaults);
    const apiParams = useApiParams(safeParams);

    ApiValidationWorkflowsListParams.parse(apiParams);

    const { data, ...other } = useApiValidationWorkflowsList(
        apiParams,
        options,
    );

    if (data) {
        PaginatedValidationWorkflowListList.parse(data);
    }

    return {
        data,
        ...other,
    };
};

export const useCustomApiValidationWorkflowsRetrieve = (slug: string) => {
    const { data, ...other } = useApiValidationWorkflowsRetrieve(slug, {
        query: { enabled: !!slug },
    });
    // once orval integrates zod , we won't really need this anymore
    // also once orval fix the fact that custom-query options does not output the enabled: !!slug
    if (data) {
        ValidationWorkflowRetrieve.parse(data);
    }
    return {
        data,
        ...other,
    };
};

const getNode = async ({
    nodeSlug,
    workflowSlug,
}: {
    nodeSlug?: string;
    workflowSlug: string;
}): Promise<ValidationNodeTemplateRetrieveResponse> => {
    return getRequest(`${API_URL}${workflowSlug}/node-templates/${nodeSlug}`);
};

export const useGetNode = ({
    nodeSlug,
    workflowSlug,
}: {
    nodeSlug?: string;
    workflowSlug: string;
}) => {
    return useSnackQuery({
        queryKey: [WF_BASE_QUERYKEY, 'nodes', nodeSlug, workflowSlug],
        queryFn: () =>
            getNode({
                nodeSlug,
                workflowSlug,
            }),
        options: { enabled: Boolean(nodeSlug) },
    });
};

const getWorkflowOptions =
    (): Promise<ValidationWorkflowListDropdownResponse> => {
        return getRequest(`${API_URL}dropdown/`);
    };

export const useGetWorkflowOptions = (): UseQueryResult<
    ValidationWorkflowListDropdownResponse,
    Error
> => {
    return useSnackQuery({
        queryKey: [WF_BASE_QUERYKEY, 'options'],
        queryFn: () => getWorkflowOptions(),
        options: { staleTime: Infinity, cacheTime: Infinity, retry: false },
    });
};
