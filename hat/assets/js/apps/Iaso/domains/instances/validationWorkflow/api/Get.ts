import { FormattedApiParams, useApiParams } from 'Iaso/hooks/useApiParams';
import { useUrlParams } from 'Iaso/hooks/useUrlParams';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { API_URL } from '../constants';

const defaults = {
    order: 'name',
    pageSize: 20,
    page: 1,
};

const getSubmissionsWorkflows = async (params: FormattedApiParams) => {
    const queryString = new URLSearchParams(params).toString();
    return getRequest(`${API_URL}?${queryString}`);
};

export const useGetSubmissionValidationWorkflows = (
    params: Record<string, any>,
) => {
    const safeParams = useUrlParams(params, defaults);
    const apiParams = useApiParams(safeParams);
    return useSnackQuery({
        queryKey: ['submissions-workflows', apiParams],
        queryFn: () => getSubmissionsWorkflows(apiParams),
        options: {
            staleTime: Infinity,
            cacheTime: Infinity,
            keepPreviousData: true,
            retry: false,
        },
    });
};

const getWorkflowDetails = async (slug?: string) => {
    return getRequest(`${API_URL}${slug}`);
};

export const useGetWorkflowDetails = (slug?: string) => {
    return useSnackQuery({
        queryKey: ['submissions-workflows', 'details', slug],
        queryFn: () => getWorkflowDetails(slug),
        options: {
            staleTime: Infinity,
            cacheTime: Infinity,
            keepPreviousData: true,
            enabled: Boolean(slug),
            select: data => {
                if (!data) return data;
                const { nodeTemplates } = data;
                return {
                    ...data,
                    nodeTemplates: nodeTemplates.map((node, index) => ({
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
}) => {
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
        queryKey: ['submissions-workflows', 'nodes', nodeSlug, workflowSlug],
        queryFn: () =>
            getNode({
                nodeSlug,
                workflowSlug,
            }),
        options: { enabled: Boolean(nodeSlug) },
    });
};

const getWorkflowOptions = () => {
    return getRequest(`${API_URL}dropdown/`);
};

export const useGetWorkflowOptions = () => {
    return useSnackQuery({
        queryKey: ['submissions-workflows', 'options'],
        queryFn: () => getWorkflowOptions(),
        options: { staleTime: Infinity, cacheTime: Infinity, retry: false },
    });
};
