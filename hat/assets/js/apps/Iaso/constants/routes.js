import React from 'react';
import Forms from '../domains/forms';
import FormDetail from '../domains/forms/detail';
import FormsStats from '../domains/forms/stats';
import OrgUnits from '../domains/orgUnits';
import { Links } from '../domains/links';
import Runs from '../domains/links/Runs';
import OrgUnitDetail from '../domains/orgUnits/detail';
import Completeness from '../domains/completeness';
import Instances from '../domains/instances';
import CompareSubmissions from '../domains/instances/compare/index.tsx';
import InstanceDetail from '../domains/instances/details';
import Mappings from '../domains/mappings';
import MappingDetails from '../domains/mappings/details';
import Users from '../domains/users';
import { Projects } from '../domains/projects/index.tsx';
import DataSources from '../domains/dataSources';
import Tasks from '../domains/tasks';
import Devices from '../domains/devices';
import Groups from '../domains/orgUnits/groups';
import Types from '../domains/orgUnits/orgUnitTypes';
import { Entities } from '../domains/entities/index.tsx';
import { EntityTypes } from '../domains/entities/entityTypes/index.tsx';
import PageError from '../components/errors/PageError';
import { baseUrls } from './urls';
import { capitalize } from '../utils/index';
import { linksFiltersWithPrefix, orgUnitFiltersWithPrefix } from './filters';
import Pages from '../domains/pages';
import { Planning } from '../domains/planning/index.tsx';
import { Teams } from '../domains/teams/index.tsx';
import { Assignments } from '../domains/assignments/index.tsx';

import { SHOW_PAGES, SHOW_DHIS2_LINK } from '../utils/featureFlags';
import { paginationPathParams } from '../routing/common';

const paginationPathParamsWithPrefix = prefix =>
    paginationPathParams.map(p => ({
        ...p,
        key: `${prefix}${capitalize(p.key, true)}`,
    }));

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
    permissions: ['iaso_forms', 'iaso_submissions'],
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
        {
            isRequired: false,
            key: 'showDeleted',
        },
    ],
    component: props => <Forms {...props} />,
    isRootUrl: true,
};

export const pagesPath = {
    baseUrl: baseUrls.pages,
    permissions: ['iaso_pages'],
    featureFlag: SHOW_PAGES,
    params: [...paginationPathParams],
    component: props => <Pages {...props} />,
};

export const formDetailPath = {
    baseUrl: baseUrls.formDetail,
    permissions: ['iaso_forms', 'iaso_submissions'],
    component: props => <FormDetail {...props} />,
    params: [
        {
            isRequired: true,
            key: 'formId',
        },
        ...paginationPathParams,
    ],
};

export const formsStatsPath = {
    baseUrl: baseUrls.formsStats,
    permissions: ['iaso_forms'],
    component: () => <FormsStats />,
    params: [],
};

export const instancesPath = {
    baseUrl: baseUrls.instances,
    permissions: ['iaso_submissions'],
    component: props => <Instances {...props} />,
    params: [
        {
            isRequired: false,
            key: 'formIds',
        },
        ...paginationPathParams,
        {
            isRequired: false,
            key: 'periodType',
        },
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
            key: 'startPeriod',
        },
        {
            isRequired: false,
            key: 'endPeriod',
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
        {
            isRequired: false,
            key: 'mapResults',
        },
        {
            isRequired: false,
            key: 'filePage',
        },
        {
            isRequired: false,
            key: 'fileRowsPerPage',
        },
    ],
};

export const instanceDetailPath = {
    baseUrl: baseUrls.instanceDetail,
    permissions: ['iaso_submissions'],
    component: props => <InstanceDetail {...props} />,
    params: [
        {
            isRequired: true,
            key: 'instanceId',
        },
    ],
};

export const compareInstancesPath = {
    baseUrl: baseUrls.compareInstances,
    permissions: ['iaso_submissions'],
    component: props => <CompareSubmissions {...props} />,
    params: [
        {
            isRequired: true,
            key: 'instanceIds',
        },
    ],
};

export const mappingsPath = {
    baseUrl: baseUrls.mappings,
    permissions: ['iaso_mappings'],
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
    permissions: ['iaso_mappings'],
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

export const orgUnitsPath = {
    baseUrl: baseUrls.orgUnits,
    permissions: ['iaso_org_units'],
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

export const orgUnitsDetailsPath = {
    baseUrl: baseUrls.orgUnitDetails,
    permissions: ['iaso_org_units'],
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
        {
          isRequired: false,
          key: "formId"
        },
        {
          isRequired: false,
          key: "referenceFormId"
        },
        {
          isRequired: false,
          key: "instanceId"
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
    permissions: ['iaso_links'],
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
    permissions: ['iaso_links'],
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
    permissions: ['iaso_completeness'],
    component: props => <Completeness {...props} />,
    params: [],
};

export const usersPath = {
    baseUrl: baseUrls.users,
    permissions: ['iaso_users'],
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
    permissions: ['iaso_projects'],
    component: props => <Projects {...props} />,
    params: [...paginationPathParams],
};

export const dataSourcesPath = {
    baseUrl: baseUrls.sources,
    permissions: ['iaso_sources'],
    component: props => <DataSources {...props} />,
    params: [...paginationPathParams],
};

export const tasksPath = {
    baseUrl: baseUrls.tasks,
    permissions: ['iaso_data_tasks'],
    component: props => <Tasks {...props} />,
    params: [...paginationPathParams],
};

export const devicesPath = {
    baseUrl: baseUrls.devices,
    permissions: ['iaso_data_devices'],
    component: props => <Devices {...props} />,
    params: [...paginationPathParams],
};

export const groupsPath = {
    baseUrl: baseUrls.groups,
    permissions: ['iaso_org_units'],
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
    permissions: ['iaso_org_units'],
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

export const entitiesPath = {
    baseUrl: baseUrls.entities,
    permissions: ['iaso_entities'],
    component: props => <Entities {...props} />,
    params: [
        {
            isRequired: false,
            key: 'search',
        },
        {
            isRequired: false,
            key: 'entityTypes',
        },
        ...paginationPathParams.map(p => ({
            ...p,
            isRequired: true,
        })),
    ],
};
export const entityTypesPath = {
    baseUrl: baseUrls.entityTypes,
    permissions: ['iaso_entities'],
    component: props => <EntityTypes {...props} />,
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
export const planningPath = {
    baseUrl: baseUrls.planning,
    // FIXME use planning permissions when they exist
    permissions: ['iaso_planning'],
    component: props => <Planning {...props} />,
    params: [
        {
            isRequired: false,
            key: 'search',
        },
        {
            isRequired: false,
            key: 'dateFrom',
        },
        {
            isRequired: false,
            key: 'dateTo',
        },
        {
            isRequired: true,
            key: 'publishingStatus',
        },
        ...paginationPathParams.map(p => ({
            ...p,
            isRequired: true,
        })),
    ],
};
export const assignmentsPath = {
    baseUrl: baseUrls.assignments,
    // FIXME use planning permissions when they exist
    permissions: ['iaso_assignments'],
    component: props => <Assignments {...props} />,
    params: [],
    // params: [
    //     {
    //         isRequired: false,
    //         key: 'search',
    //     },
    //     ...paginationPathParams.map(p => ({
    //         ...p,
    //         isRequired: true,
    //     })),
    // ],
};
export const teamsPath = {
    baseUrl: baseUrls.teams,
    // FIXME use planning permissions when they exist
    permissions: ['iaso_teams'],
    component: props => <Teams {...props} />,
    params: [],
    // params: [
    //     {
    //         isRequired: false,
    //         key: 'search',
    //     },
    //     ...paginationPathParams.map(p => ({
    //         ...p,
    //         isRequired: true,
    //     })),
    // ],
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
    formDetailPath,
    formsStatsPath,
    mappingsPath,
    mappingDetailPath,
    instancesPath,
    instanceDetailPath,
    compareInstancesPath,
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
    entitiesPath,
    entityTypesPath,
    pagesPath,
    page401,
    page500,
    teamsPath,
    planningPath,
    assignmentsPath,
];
