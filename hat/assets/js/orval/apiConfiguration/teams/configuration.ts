export const teamsOperations = {
    apiTeamsTreeList: {
        query: {
            options: {
                retry: false,
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
