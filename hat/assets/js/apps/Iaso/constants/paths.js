const paginationPathParams = [
    {
        isRequired: false,
        key: 'order',
    },
    {
        isRequired: false,
        key: 'pageSize',
    },
    {
        isRequired: false,
        key: 'page',
    },
];


const getPath = (path) => {
    let url = `/${path.baseUrl}`;
    path.params.forEach((p) => {
        if (p.isRequired) {
            url += `/${p.key}/:${p.key}`;
        } else {
            url += `(/${p.key}/:${p.key})`;
        }
    });
    return url;
};


export const formsPath = getPath({
    baseUrl: 'forms',
    params: [
        {
            isRequired: true,
            key: 'date_from',
        },
        {
            isRequired: true,
            key: 'date_to',
        },
        ...paginationPathParams,
    ],
});

export const instancesPath = getPath({
    baseUrl: 'instances',
    params: [
        {
            isRequired: true,
            key: 'formId',
        },
        ...paginationPathParams,
        {
            isRequired: false,
            key: 'levels',
        },
        {
            isRequired: false,
            key: 'orgUnitTypeId',
        },
        {
            isRequired: false,
            key: 'withLocation',
        },
        {
            isRequired: false,
            key: 'deviceId',
        },
        {
            isRequired: false,
            key: 'deviceOwnershipId',
        },
        {
            isRequired: false,
            key: 'tab',
        },
    ],
});

const orgUnitsPathParams = [
    {
        isRequired: true,
        key: 'validated',
    },
    {
        isRequired: false,
        key: 'orgUnitTypeId',
    },
    {
        isRequired: false,
        key: 'sourceId',
    },
    {
        isRequired: false,
        key: 'source',
    },
    {
        isRequired: false,
        key: 'withShape',
    },
    {
        isRequired: false,
        key: 'withLocation',
    },
    {
        isRequired: false,
        key: 'search',
    },
    {
        isRequired: false,
        key: 'levels',
    },
    {
        isRequired: false,
        key: 'hasInstances',
    },
    {
        isRequired: false,
        key: 'searchActive',
    },
];

export const orgUnitsPath = getPath({
    baseUrl: 'orgunits',
    params: [
        ...orgUnitsPathParams,
        ...paginationPathParams,
    ],
});

export const orgUnitsDetailsPath = getPath({
    baseUrl: 'orgunits/detail',
    params: [
        {
            isRequired: true,
            key: 'orgUnitId',
        },
        {
            isRequired: false,
            key: 'levels',
        },
        ...paginationPathParams,
        {
            isRequired: false,
            key: 'logsOrder',
        },
        {
            isRequired: false,
            key: 'tab',
        },
        {
            isRequired: false,
            key: 'backurl',
        },
    ],
});

export const linksPath = getPath({
    baseUrl: 'links',
    params: [
        {
            isRequired: true,
            key: 'date_from',
        },
        {
            isRequired: true,
            key: 'date_to',
        },
        {
            isRequired: false,
            key: 'search',
        },
        {
            isRequired: false,
            key: 'source1',
        },
        {
            isRequired: false,
            key: 'source2',
        },
        {
            isRequired: false,
            key: 'validated',
        },
        {
            isRequired: false,
            key: 'orgUnitTypeId',
        },
        ...paginationPathParams,
        {
            isRequired: false,
            key: 'searchActive',
        },
    ],
});
