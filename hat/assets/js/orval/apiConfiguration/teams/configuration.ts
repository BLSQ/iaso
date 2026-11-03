export const teamsOperations = {
    apiTeamsTreeList: {
        query: {
            options: {
                retry: false,
                keepPreviousData: true,
            },
        },
    },
    apiTeamsTypesDropdownList: {
        query: {
            meta: {
                localeAware: true,
            },
            options: {
                retry: false,
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
            'apiTeamsCreate',
            'apiTeamsDestroy',
            'apiTeamsUpdate',
            'apiTeamsPartialUpdate',
        ],
        invalidates: [
            'apiTeamsList',
            'apiTeamsDropdownList',
            'apiTeamsTreeList',
        ],
    },
    {
        onMutations: [
            'apiTeamsDestroy',
            'apiTeamsUpdate',
            'apiTeamsPartialUpdate',
        ],
        invalidates: [{ query: 'apiTeamsRetrieve', params: ['id'] }],
    },
];
