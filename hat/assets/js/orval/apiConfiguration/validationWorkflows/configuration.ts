import {
    ValidationWorkflowRetrieveResponseItem,
    ValidationWorkflowRetrieveResponseItemWithOrderedNodes,
} from 'Iaso/domains/instances/validationWorkflow/types/validationWorkflows';

export const workflowsOperations = {
    apiValidationWorkflowsList: {
        query: {
            options: {
                retry: false,
                staleTime: Infinity,
                cacheTime: Infinity,
                keepPreviousData: true,
            },
        },
    },
    apiValidationWorkflowsRetrieve: {
        query: {
            options: {
                staleTime: Infinity,
                cacheTime: Infinity,
                keepPreviousData: true,
                select: (
                    data: ValidationWorkflowRetrieveResponseItem,
                ): ValidationWorkflowRetrieveResponseItemWithOrderedNodes => {
                    if (!data) return data;
                    return {
                        ...data,
                        node_templates: data.node_templates?.map(
                            (node, index) => ({
                                ...node,
                                id: index + 1,
                                order: index + 1,
                            }),
                        ),
                    };
                },
            },
        },
    },
};

export const mutationInvalidates = [
    {
        onMutations: [''],
        invalidates: [''],
    },
];
