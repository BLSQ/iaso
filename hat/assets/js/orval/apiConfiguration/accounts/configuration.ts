export const accountsOperations = {
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
    apiAccountsMeRetrieve: {
        query: {
            options: {
                staleTime: Infinity,
                cacheTime: Infinity,
                keepPreviousData: true,
            },
        },
    },
    apiAccountsCustomTranslationsRetrieve: {
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

export const mutationInvalidates = [
    {
        onMutations: ['apiAccountsUpdate'],
        invalidates: [
            'apiAccountsList',
            'apiAccountsMeRetrieve',
            { query: 'apiAccountsCustomTranslationsRetrieve', params: ['id'] },
            { query: 'apiAccountsRetrieve', params: ['id'] },
        ],
    },
    {
        onMutations: [
            'apiAccountsAiApiKeyUpdate',
            'apiAccountsAiApiKeyDestroy',
        ],
        invalidates: [{ query: 'apiAccountsAiApiKeyRetrieve', params: ['id'] }],
    },
];
