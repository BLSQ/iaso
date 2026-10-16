export const planningConfigOperations = {};

export const mutationInvalidates = [
    {
        onMutations: ['apiMicroplanningPlanningConfigsCreate'],
        invalidates: [
            {
                query: 'ApiMicroplanningPlanningsConfigsList',
                file: 'Iaso/api/plannings',
                params: ['data.planning'],
            },
        ],
    },
];
