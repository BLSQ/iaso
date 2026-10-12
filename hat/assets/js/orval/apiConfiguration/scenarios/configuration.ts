export const scenariosOperations = {
    apiScenariosList: {
        query: {
            options: {
                retry: false,
                keepPreviousData: true,
            },
        },
    },
    apiScenariosRetrieve: {
        query: {
            options: {
                retry: false,
            },
        },
    },
};

export const mutationInvalidates = [
    {
        onMutations: ['apiScenariosCreate', 'apiScenariosDestroy'],
        invalidates: ['apiScenariosList'],
    },
    {
        // the last run is kept on each scenario
        onMutations: ['apiScenariosRunCreate'],
        invalidates: ['apiScenariosList', 'apiScenariosRetrieve'],
    },
];
