import { FormattedApiParams, useApiParams } from 'Iaso/hooks/useApiParams';
import { useUrlParams } from 'Iaso/hooks/useUrlParams';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { waitFor } from 'Iaso/utils';
import { API_URL } from '../constants';

const defaults = {
    order: 'name',
    pageSize: 20,
    page: 1,
};

const getSubmissionsWorkflows = async (params: FormattedApiParams) => {
    await waitFor(1000);
    const queryString = new URLSearchParams(params).toString();
    console.log('PASSED TO API', `${API_URL}?${queryString}`);
    // return getRequest(`${API_URL}?${queryString}`);
    return {
        results: [
            {
                slug: 'TestWF',
                name: 'Test WF',
                formCount: 0,
                createdBy: 'George M',
                updatedBy: 'Laura G',
                createdAt: 1024,
                updatedAt: 1024,
            },
            {
                slug: 'TestWF1',
                name: 'Test WF 1',
                formCount: 10,
                createdBy: 'George M',
                updatedBy: 'Laura G',
                createdAt: 1025,
                updatedAt: 1025,
            },
            {
                slug: 'TestWF5',
                name: 'Test WF 5',
                formCount: 10,
                createdBy: 'George M',
                updatedBy: 'Laura G',
                createdAt: 1025,
                updatedAt: 1025,
            },
            {
                slug: 'TestWF6',
                name: 'Test WF 6',
                formCount: 10,
                createdBy: 'George M',
                updatedBy: 'Laura G',
                createdAt: 1025,
                updatedAt: 1025,
            },
            {
                slug: 'TestWF7',
                name: 'Test WF 8',
                formCount: 10,
                createdBy: 'George M',
                updatedBy: 'Laura G',
                createdAt: 1025,
                updatedAt: 1025,
            },
            {
                slug: 'TestWF1',
                name: 'Test WF 1',
                formCount: 10,
                createdBy: 'George M',
                updatedBy: 'Laura G',
                createdAt: 1025,
                updatedAt: 1025,
            },
            {
                slug: 'vibe-coding',
                name: 'Vibe coding',
                formCount: 0,
                createdBy: 'George M',
                updatedBy: 'Laura G',
                createdAt: 1025,
                updatedAt: 1025,
            },
            {
                slug: 'Test',
                name: 'Test',
                formCount: 10,
                createdBy: 'George M',
                updatedBy: 'Laura G',
                createdAt: 1025,
                updatedAt: 1025,
            },
            {
                slug: 'TestWF9',
                name: 'Test WF 9',
                formCount: 9,
                createdBy: 'George M',
                updatedBy: 'Laura G',
                createdAt: 1025,
                updatedAt: 1025,
            },
            {
                slug: 'prrrt',
                name: 'prrrt',
                formCount: 7,
                createdBy: 'George M',
                updatedBy: 'Laura G',
                createdAt: 1025,
                updatedAt: 1025,
            },
            {
                slug: 'TestWF1',
                name: 'Test WF 1',
                formCount: 10,
                createdBy: 'George M',
                updatedBy: 'Laura G',
                createdAt: 1025,
                updatedAt: 1025,
            },
            {
                slug: 'blob',
                name: 'blob',
                formCount: 10,
                createdBy: 'George M',
                updatedBy: 'Laura G',
                createdAt: 1025,
                updatedAt: 1025,
            },
            {
                slug: 'gni',
                name: 'Gni',
                formCount: 10,
                createdBy: 'George M',
                updatedBy: 'Laura G',
                createdAt: 1025,
                updatedAt: 1025,
            },
            {
                slug: 'voila-l-ete',
                name: "Voilà l'été",
                formCount: 10,
                createdBy: 'George M',
                updatedBy: 'Laura G',
                createdAt: 1025,
                updatedAt: 1025,
            },
            {
                slug: 'testthis',
                name: 'Test this',
                formCount: 10,
                createdBy: 'George M',
                updatedBy: 'Laura G',
                createdAt: 1025,
                updatedAt: 1025,
            },
            {
                slug: 'TestWF1',
                name: 'Test WF 1',
                formCount: 10,
                createdBy: 'George M',
                updatedBy: 'Laura G',
                createdAt: 1025,
                updatedAt: 1025,
            },
            {
                slug: 'TestWF1',
                name: 'Test WF 1',
                formCount: 10,
                createdBy: 'George M',
                updatedBy: 'Laura G',
                createdAt: 1025,
                updatedAt: 1025,
            },
            {
                slug: 'TestWF2',
                name: 'Test WF 2',
                formCount: 100,
                createdBy: 'George M',
                updatedBy: 'Laura G',
                createdAt: 1025,
                updatedAt: 1025,
            },
            {
                slug: 'TestWF3',
                name: 'Test WF 3',
                formCount: 5,
                createdBy: 'George M',
                updatedBy: 'Laura G',
                createdAt: 1025,
                updatedAt: 1025,
            },
        ],
        count: 20,
        page: 1,
        pages: 2,
        limit: 20,
        hasPrevious: false,
        hasNext: true,
    };
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
        },
    });
};

const getWorkflowDetails = async (slug?: string) => {
    await waitFor(500);
    console.log('PASSED TO API', `${API_URL}${slug}`);
    return {
        slug: slug,
        name: slug,
        description: 'bacon ipsum sausage and bbq sauce',
        forms: [
            {
                id: 80,
                label: 'FOSA',
            },
        ],
        createdBy: 'Laura G',
        updatedBy: 'Laura G',
        createdAt: 1024,
        updatedAt: 1024,
        nodeTemplates: [
            {
                slug: 'start',
                name: 'Start node',
                description: 'waaaaaaaaaaaaa',
                color: '#FFFFFF',
                rolesRequired: [
                    {
                        name: 'Data Manager',
                        id: 7,
                    },
                ],
                canSkipPreviousNodes: true,
            },
            {
                // order: 2,
                // id: 2,
                slug: 'middle',
                name: 'Middle node',
                description: 'Zaaaaaaaaaaaaa',
                color: '#FFF000',
                rolesRequired: [
                    {
                        name: 'test',
                        id: 8,
                    },
                ],
                canSkipPreviousNodes: true,
            },
            {
                slug: 'end',
                name: 'End node',
                description: 'Biiiiiiiiiiiiiii',
                color: '#FF0000',
                rolesRequired: [
                    {
                        name: 'test',
                        id: 8,
                    },
                ],
                canSkipPreviousNodes: true,
            },
        ],
    };
    // return getRequest(`${API_URL}${slug}`);
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
    await waitFor(500);
    console.log(
        'PASSED TO API',
        `${API_URL}${workflowSlug}/node-templates/${nodeSlug})`,
    );
    return {
        slug: nodeSlug,
        name: nodeSlug,
        description: 'string',
        color: '#FFFFFF',
        rolesRequired: [
            {
                name: 'test',
                id: 8,
            },
        ],
        canSkipPreviousNodes: true,
    };
    // return getRequest(`${API_URL}${workflowSlug}/node-templates/${nodeSlug}`);
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
    });
};
