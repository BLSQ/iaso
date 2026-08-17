export const missionsOperations = {
    apiMicroplanningMissionsList: {
        query: {
            options: {
                retry: false,
                staleTime: Infinity,
                cacheTime: Infinity,
                keepPreviousData: true,
            },
        },
    },
    apiMicroplanningMissionsDropdownList: {
        query: {
            options: {
                retry: false,
                staleTime: Infinity,
                cacheTime: Infinity,
                keepPreviousData: true,
            },
        },
    },
    apiMicroplanningMissionsRetrieve: {
        query: {
            options: {
                staleTime: Infinity,
                cacheTime: Infinity,
                keepPreviousData: true,
            },
        },
    },
};

export const mutationInvalidates = [
    {
        onMutations: [
            'apiMicroplanningMissionsDestroy',
            'apiMicroplanningMissionsUpdate',
            'apiMicroplanningMissionsPartialUpdate',
        ],
        invalidates: [
            'apiMicroplanningMissionsList',
            'apiMicroplanningMissionsDropdownList',
            { query: 'apiMicroplanningMissionsRetrieve', params: ['id'] },
        ],
    },
    {
        onMutations: [
            'apiMicroplanningMissionsCreate',
            'apiMicroplanningMissionsDestroy',
            'apiMicroplanningMissionsUpdate',
            'apiMicroplanningMissionsPartialUpdate',
        ],
        invalidates: [
            'apiMicroplanningMissionsList',
            'apiMicroplanningMissionsDropdownList',
        ],
    },
];
