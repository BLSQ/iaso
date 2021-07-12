import React from 'react';
import Forms from '../domains/forms';
import FormDetail from '../domains/forms/detail';
import OrgUnits from '../domains/orgUnits';
import Links from '../domains/links';
import Runs from '../domains/links/Runs';
import OrgUnitDetail from '../domains/orgUnits/details';
import Completeness from '../domains/completeness';
import Instances from '../domains/instances';
import InstanceDetail from '../domains/instances/details';
import Mappings from '../domains/mappings';
import MappingDetails from '../domains/mappings/details';
import Users from '../domains/users';
import Projects from '../domains/projects';
import DataSources from '../domains/dataSources';
import Tasks from '../domains/tasks';
import Devices from '../domains/devices';
import Groups from '../domains/orgUnits/groups';
import Types from '../domains/orgUnits/types';
import PageError from '../components/errors/PageError';
import { baseUrls } from './urls';
import { capitalize } from '../utils/index';
import { orgUnitFiltersWithPrefix, linksFiltersWithPrefix } from './filters';
import Pages from "../domains/pages";

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

const paginationPathParamsWithPrefix = prefix =>
    paginationPathParams.map(p => ({
        ...p,
        key: `${prefix}${capitalize(p.key, true)}`,
    }));

export const getPath = path => {
    let url = `/${path.baseUrl}`;
    path.params.forEach(p => {
        if (p.isRequired) {
            url += `/${p.key}/:${p.key}`;
        } else {
            url += `(/${p.key}/:${p.key})`;
        }
    });
    return url;
};

export const formsPath = {
    baseUrl: baseUrls.forms,
    permission: 'iaso_forms',
    params: [
        ...paginationPathParams,
        {
            isRequired: false,
            key: 'search',
        },
        {
            isRequired: false,
            key: 'searchActive',
        },
    ],
    component: props => <Forms {...props} />,
    isRootUrl: true,
};

export const pagesPath = {
    baseUrl: baseUrls.pages,
    permission: 'iaso_pages',
    params: [],
    component: props => <Pages {...props} />,
    isRootUrl: true,
};

export const polioPath = {
    baseUrl: baseUrls.polio,
    permission: 'iaso_forms',
    params: [],
    component: props => {
        window.location = '/dashboard/polio/list'

        return <></>;
    },
};

export const archivedPath = {
    baseUrl: baseUrls.archived,
    permission: 'iaso_forms',
    params: [
        ...paginationPathParams,
        {
            isRequired: false,
            key: 'search',
        },
        {
            isRequired: false,
            key: 'searchActive',
        },
    ],
    component: props => <Forms {...props} showOnlyDeleted />,
    isRootUrl: true,
};

export const formDetailPath = {
    baseUrl: baseUrls.formDetail,
    permission: 'iaso_forms',
    component: props => <FormDetail {...props} />,
    params: [
        {
            isRequired: true,
            key: 'formId',
        },
        ...paginationPathParams,
    ],
};

export const mappingsPath = {
    baseUrl: baseUrls.mappings,
    permission: 'iaso_mappings',
    component: props => <Mappings {...props} />,
    params: [
        {
            isRequired: false,
            key: 'formId',
        },
        ...paginationPathParams.map(p => ({
            ...p,
            isRequired: true,
        })),
    ],
};

export const mappingDetailPath = {
    baseUrl: baseUrls.mappingDetail,
    permission: 'iaso_mappings',
    component: props => <MappingDetails {...props} />,
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
    baseUrl: baseUrls.instances,
    permission: 'iaso_forms',
    component: props => <Instances {...props} />,
    params: [
        {
            isRequired: true,
            key: 'formId',
        },
        ...paginationPathParams,
        {
            isRequired: false,
            key: 'dateFrom',
        },
        {
            isRequired: false,
            key: 'dateTo',
        },
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
        {
            isRequired: false,
            key: 'search',
        },
        {
            isRequired: false,
            key: 'showDeleted',
        },
    ],
};

export const instanceDetailPath = {
    baseUrl: baseUrls.instanceDetail,
    permission: 'iaso_forms',
    component: props => <InstanceDetail {...props} />,
    params: [
        {
            isRequired: true,
            key: 'instanceId',
        },
    ],
};

export const orgUnitsPath = {
    baseUrl: baseUrls.orgUnits,
    permission: 'iaso_org_units',
    component: props => <OrgUnits {...props} />,
    params: [
        {
            isRequired: true,
            key: 'locationLimit',
        },
        ...paginationPathParams.map(p => ({
            ...p,
            isRequired: true,
        })),
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
    ],
};
const orgUnitsFiltersPathParamsWithPrefix = (prefix, withChildren) =>
    orgUnitFiltersWithPrefix(prefix, withChildren).map(f => ({
        isRequired: false,
        key: f.urlKey,
    }));

const linksFiltersPathParamsWithPrefix = prefix =>
    linksFiltersWithPrefix(prefix).map(f => ({
        isRequired: false,
        key: f.urlKey,
    }));

export const orgUnitsDetailsPath = {
    baseUrl: baseUrls.orgUnitDetails,
    permission: 'iaso_org_units',
    component: props => <OrgUnitDetail {...props} />,
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
        ...orgUnitsFiltersPathParamsWithPrefix('childrenParams', true),
        ...paginationPathParamsWithPrefix('childrenParams'),
        ...linksFiltersPathParamsWithPrefix('linksParams'),
        ...paginationPathParamsWithPrefix('linksParams'),
        ...paginationPathParamsWithPrefix('formsParams'),
        ...paginationPathParamsWithPrefix('logsParams'),
    ],
};

export const linksPath = {
    baseUrl: baseUrls.links,
    permission: 'iaso_links',
    component: props => <Links {...props} />,
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
        {
            isRequired: false,
            key: 'validation_status',
        },
    ],
};

export const algosPath = {
    baseUrl: baseUrls.algos,
    permission: 'iaso_links',
    component: props => <Runs {...props} />,
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
    baseUrl: baseUrls.completeness,
    permission: 'iaso_completeness',
    component: props => <Completeness {...props} />,
    params: [],
};

export const usersPath = {
    baseUrl: baseUrls.users,
    permission: 'iaso_users',
    component: props => <Users {...props} />,
    params: [
        {
            isRequired: false,
            key: 'search',
        },
        ...paginationPathParams.map(p => ({
            ...p,
            isRequired: true,
        })),
    ],
};

export const projectsPath = {
    baseUrl: baseUrls.projects,
    permission: 'iaso_projects',
    component: props => <Projects {...props} />,
    params: [...paginationPathParams],
};

export const dataSourcesPath = {
    baseUrl: baseUrls.sources,
    permission: 'iaso_sources',
    component: props => <DataSources {...props} />,
    params: [...paginationPathParams],
};

export const tasksPath = {
    baseUrl: baseUrls.tasks,
    permission: 'iaso_data_tasks',
    component: props => <Tasks {...props} />,
    params: [...paginationPathParams],
};

export const devicesPath = {
    baseUrl: baseUrls.devices,
    permission: 'iaso_data_devices',
    component: props => <Devices {...props} />,
    params: [...paginationPathParams],
};

export const groupsPath = {
    baseUrl: baseUrls.groups,
    permission: 'iaso_org_units',
    component: props => <Groups {...props} />,
    params: [
        {
            isRequired: false,
            key: 'search',
        },
        ...paginationPathParams.map(p => ({
            ...p,
            isRequired: true,
        })),
    ],
};
export const orgUnitTypesPath = {
    baseUrl: baseUrls.orgUnitTypes,
    permission: 'iaso_org_units',
    component: props => <Types {...props} />,
    params: [
        {
            isRequired: false,
            key: 'search',
        },
        ...paginationPathParams.map(p => ({
            ...p,
            isRequired: true,
        })),
    ],
};

export const page401 = {
    baseUrl: baseUrls.error401,
    component: () => <PageError errorCode="401" />,
    params: [],
};

export const page404 = {
    baseUrl: baseUrls.error404,
    component: () => <PageError errorCode="404" />,
    params: [],
};

export const page500 = {
    baseUrl: baseUrls.error500,
    component: () => <PageError errorCode="500" />,
    params: [],
};

export const routeConfigs = [
    formsPath,
    archivedPath,
    formDetailPath,
    mappingsPath,
    mappingDetailPath,
    instancesPath,
    instanceDetailPath,
    orgUnitsPath,
    orgUnitsDetailsPath,
    linksPath,
    algosPath,
    completenessPath,
    usersPath,
    projectsPath,
    dataSourcesPath,
    tasksPath,
    devicesPath,
    groupsPath,
    orgUnitTypesPath,
    polioPath,
    pagesPath,
    page401,
    page404,
    page500,
];
