// import { ValidationWorkflowRetrieve } from 'Iaso/api';
// import { ValidationWorkflowRetrieveResponseItemWithOrderedNodes } from 'Iaso/domains/instances/validationWorkflow/types/validationWorkflows';

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
                // todo
                // select: (
                //     data: ValidationWorkflowRetrieve,
                // ): ValidationWorkflowRetrieveResponseItemWithOrderedNodes => {
                //     if (!data) return data;
                //     return {
                //         ...data,
                //         node_templates: data.node_templates?.map(
                //             (node, index) => ({
                //                 ...node,
                //                 id: index + 1,
                //                 order: index + 1,
                //             }),
                //         ),
                //     };
                // },
            },
        },
    },
};

export const mutationInvalidates = [
    {
        onMutations: [
            'apiValidationWorkflowsDestroy',
            'apiValidationWorkflowsUpdate',
            'apiValidationWorkflowsPartialUpdate',
        ],
        invalidates: [
            'apiValidationWorkflowsList',
            { query: 'apiValidationWorkflowsRetrieve', params: ['slug'] },
        ],
    },
    {
        onMutations: ['apiValidationWorkflowsCreate'],
        invalidates: ['apiValidationWorkflowsList'],
    },
];
