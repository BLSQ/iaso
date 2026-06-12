export const orgUnitTypesOperations = {
    apiV2OrgunittypesDropdownList: {
        query: {
            options: {
                keepPreviousData: true,
                staleTime: 1000 * 60 * 15,
                cacheTime: 1000 * 60 * 5,
            },
        },
    },
    apiV2OrgunittypesList: {
        query: {
            options: {
                retry: false,
                keepPreviousData: true,
                staleTime: 1000 * 60 * 15,
                cacheTime: 1000 * 60 * 5,
            },
        },
    },
    apiV2OrgunittypesRetrieve: {
        query: {
            options: {
                staleTime: 1000 * 60 * 15,
                cacheTime: 1000 * 60 * 5,
                retry: false,
            },
        },
    },
    apiV2OrgunittypesHierarchyRetrieve: {
        query: {
            options: {
                keepPreviousData: true,
                cacheTime: 60000,
                staleTime: Infinity,
                retry: false,
            },
        },
    },
};

export const mutationInvalidates = [
    {
        onMutations: [
            'apiV2OrgunittypesDestroy',
            'apiV2OrgunittypesUpdate',
            'apiV2OrgunittypesPartialUpdate',
        ],
        invalidates: [
            'apiV2OrgunittypesList',
            'apiV2OrgunittypesDropdownList',
            { query: 'apiV2OrgunittypesRetrieve', params: ['id'] },
            { query: 'apiV2OrgunittypesHierarchyRetrieve', params: ['id'] },
        ],
    },
    {
        onMutations: ['apiV2OrgunittypesCreate'],
        invalidates: ['apiV2OrgunittypesList', 'apiV2OrgunittypesDropdownList'],
    },
];
