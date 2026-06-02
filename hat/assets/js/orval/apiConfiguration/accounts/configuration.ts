export const acccountsOperations = {
    apiAccountsList: {
        query: {
            options: {
                retry: false,
                staleTime: Infinity,
                cacheTime: Infinity,
                keepPreviousData: true,
            },
        },
    },
    apiAccountsRetrieve: {
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
        onMutations: ['apiAccountsUpdate'],
        invalidates: [
            'apiAccountsList',
            { query: 'apiAccountsRetrieve', params: ['id'] },
        ],
    },
    {
        onMutations: ['apiAccountsAiApiKeyUpdate'],
        invalidates: [{ query: 'apiAccountsAiApiKeyRetrieve', params: ['id'] }],
    },
];
