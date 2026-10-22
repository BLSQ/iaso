export const planningConfigOperations = {};

export const mutationInvalidates = [
    {
        onMutations: ['apiMicroplanningPlanningConfigsCreate'],
        invalidates: [
            {
                query: 'apiMicroplanningPlanningsConfigsList',
                file: 'Iaso/api/plannings/endpoints',
                params: ['data.planning'],
            },
        ],
    },
];
