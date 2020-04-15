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


export const getPath = (path) => {
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

export const formsPath = {
    baseUrl: 'forms/list',
    permission: 'iaso_forms',
    params: [
        ...paginationPathParams,
    ],
};

export const mappingsPath = {
    baseUrl: 'forms/mappings',
    permission: 'iaso_mappings',
    params: [
        ...paginationPathParams.map(p => ({
            ...p,
            isRequired: true,
        })),
    ],
};

export const mappingDetailPath = {
    baseUrl: 'forms/mapping',
    permission: 'iaso_mappings',
    params: [
        {
            isRequired: true,
            key: 'mappingVersionId',
        },
        {
            isRequired: false,
            key: 'questionName',
        },
    ],
};


export const instancesPath = {
    baseUrl: 'instances',
    permission: 'iaso_forms',
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
};

export const instanceDetailPath = {
    baseUrl: 'instance',
    permission: 'iaso_forms',
    params: [
        {
            isRequired: true,
            key: 'instanceId',
        },
    ],
};

export const orgUnitsPath = {
    baseUrl: 'orgunits/list',
    permission: 'iaso_org_units',
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
};

export const orgUnitsDetailsPath = {
    baseUrl: 'orgunits/detail',
    permission: 'iaso_org_units',
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
};

export const linksPath = {
    baseUrl: 'orgunits/links/list',
    permission: 'iaso_links',
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
};

export const algosPath = {
    baseUrl: 'orgunits/links/runs',
    permission: 'iaso_links',
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
};

export const completenessPath = {
    baseUrl: 'forms/completeness',
    permission: 'iaso_completeness',
    params: [],
};

export const pathsList = [
    formsPath,
    mappingsPath,
    mappingDetailPath,
    instancesPath,
    instanceDetailPath,
    orgUnitsPath,
    orgUnitsDetailsPath,
    linksPath,
    algosPath,
    completenessPath,
];
