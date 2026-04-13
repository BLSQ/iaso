import { UseQueryResult } from 'react-query';
import {
    PaginatedMobileValidationWorkflowListList,
    useApiValidationWorkflowsList,
} from 'Iaso/api';
import { ApiValidationWorkflowsListParams } from 'Iaso/api/models';
import { ValidationNodeTemplateRetrieveResponse } from 'Iaso/domains/instances/validationWorkflow/types/validationNodeTemplates';
import {
    ValidationWorkflowListDropdownResponse,
    ValidationWorkflowListResponse,
    ValidationWorkflowRetrieveResponseItem,
    ValidationWorkflowRetrieveResponseItemWithOrderedNodes,
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
    const safeParams = useUrlParams(params, defaults);
    const apiParams = useApiParams(safeParams);

    ApiValidationWorkflowsListParams.parse(apiParams);

    const { data, ...other } = useApiValidationWorkflowsList(
        apiParams,
        options,
    );

    if (data) {
        PaginatedMobileValidationWorkflowListList.parse(data);
    }

    return {
        data,
        ...other,
    };
};

const getWorkflowDetails = async (
    slug?: string,
): Promise<ValidationWorkflowRetrieveResponseItem> => {
    return getRequest(`${API_URL}${slug}/`);
};

export const useGetWorkflowDetails = (
    slug?: string,
): UseQueryResult<ValidationWorkflowRetrieveResponseItem, Error> => {
    return useSnackQuery({
        queryKey: [WF_BASE_QUERYKEY, 'details', slug],
        queryFn: () => getWorkflowDetails(slug),
        options: {
            staleTime: Infinity,
            cacheTime: Infinity,
            keepPreviousData: true,
            enabled: Boolean(slug),
            select: (
                data: ValidationWorkflowRetrieveResponseItem,
            ): ValidationWorkflowRetrieveResponseItemWithOrderedNodes => {
                if (!data) return data;
                return {
                    ...data,
                    node_templates: data.node_templates?.map((node, index) => ({
                        ...node,
                        id: index + 1,
                        order: index + 1,
                    })),
                };
            },
        },
    });
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
