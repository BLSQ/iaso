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
            key: 'periods',
        },
        {
            isRequired: false,
            key: 'status',
        },
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
        {
            isRequired: false,
            key: 'columns',
        },
    ],
});

export const instanceDetailPath = getPath({
    baseUrl: 'instance',
    params: [
        {
            isRequired: true,
            key: 'instanceId',
        },
    ],
});

export const orgUnitsPath = getPath({
    baseUrl: 'orgunits',
    params: [
        {
            isRequired: true,
            key: 'locationLimit',
        },
        {
            isRequired: false,
            key: 'tab',
        },
        {
            isRequired: false,
            key: 'searchTabIndex',
        },
        {
            isRequired: false,
            key: 'searchActive',
        },
        {
            isRequired: false,
            key: 'searches',
        },
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
    ],
});

export const linksPath = getPath({
    baseUrl: 'links/list',
    params: [
        {
            isRequired: false,
            key: 'search',
        },
        {
            isRequired: false,
            key: 'origin',
        },
        {
            isRequired: false,
            key: 'originVersion',
        },
        {
            isRequired: false,
            key: 'destination',
        },
        {
            isRequired: false,
            key: 'destinationVersion',
        },
        {
            isRequired: false,
            key: 'validated',
        },
        {
            isRequired: false,
            key: 'validatorId',
        },
        {
            isRequired: false,
            key: 'orgUnitTypeId',
        },
        {
            isRequired: false,
            key: 'algorithmId',
        },
        {
            isRequired: false,
            key: 'algorithmRunId',
        },
        {
            isRequired: false,
            key: 'score',
        },
        ...paginationPathParams,
        {
            isRequired: false,
            key: 'searchActive',
        },
    ],
});


export const algosPath = getPath({
    baseUrl: 'links/runs',
    params: [
        {
            isRequired: false,
            key: 'algorithmId',
        },
        {
            isRequired: false,
            key: 'origin',
        },
        {
            isRequired: false,
            key: 'originVersion',
        },
        {
            isRequired: false,
            key: 'destination',
        },
        {
            isRequired: false,
            key: 'destinationVersion',
        },
        {
            isRequired: false,
            key: 'launcher',
        },
        ...paginationPathParams,
        {
            isRequired: false,
            key: 'searchActive',
        },
    ],
});
