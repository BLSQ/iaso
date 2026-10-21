export const planningOperations = {
    apiMicroplanningPlanningsMissionsList: {
        query: {
            options: {
                staleTime: Infinity,
                cacheTime: Infinity,
                keepPreviousData: true,
            },
        },
    },
    apiMicroplanningPlanningsDropdownList: {
        query: {
            options: {
                retry: false,
                staleTime: Infinity,
                cacheTime: Infinity,
                keepPreviousData: true,
            },
        },
    },
    apiMicroplanningPlanningsConfigsList: {
        query: {
            options: {
                retry: false,
                staleTime: Infinity,
                cacheTime: Infinity,
                keepPreviousData: true,
            },
        },
    },
};
