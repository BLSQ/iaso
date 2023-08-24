/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import Forms from '../domains/forms';
import FormDetail from '../domains/forms/detail';
import FormsStats from '../domains/forms/stats';
import { OrgUnits } from '../domains/orgUnits/index.tsx';
import { Links } from '../domains/links';
import Runs from '../domains/links/Runs';
import OrgUnitDetail from '../domains/orgUnits/details';
import Completeness from '../domains/completeness';
import Instances from '../domains/instances';
import CompareSubmissions from '../domains/instances/compare/index.tsx';
import InstanceDetail from '../domains/instances/details.tsx';
import Mappings from '../domains/mappings';
import MappingDetails from '../domains/mappings/details';
import { Users } from '../domains/users/index.tsx';
import { UserRoles } from '../domains/userRoles/index.tsx';
import { Projects } from '../domains/projects/index.tsx';
import DataSources from '../domains/dataSources';
import { Details as DataSourceDetail } from '../domains/dataSources/details.tsx';
import Tasks from '../domains/tasks';
import Devices from '../domains/devices';
import { CompletenessStats } from '../domains/completenessStats/index.tsx';
import Groups from '../domains/orgUnits/groups';
import Types from '../domains/orgUnits/orgUnitTypes/index.tsx';
import { Beneficiaries } from '../domains/entities/index.tsx';
import { Details as BeneficiaryDetail } from '../domains/entities/details.tsx';
import { EntityTypes } from '../domains/entities/entityTypes/index.tsx';
import PageError from '../components/errors/PageError';
import { baseUrls } from './urls';
import { capitalize } from '../utils/index';
import { linksFiltersWithPrefix, orgUnitFiltersWithPrefix } from './filters';
import Pages from '../domains/pages';
import { Planning } from '../domains/plannings/index.tsx';
import { Teams } from '../domains/teams/index.tsx';
import { Storages } from '../domains/storages/index.tsx';
import { Workflows } from '../domains/workflows/index.tsx';
import { Details as WorkflowDetails } from '../domains/workflows/details.tsx';
import { Details as StorageDetails } from '../domains/storages/details.tsx';
import { Assignments } from '../domains/assignments/index.tsx';
import { CompareInstanceLogs } from '../domains/instances/compare/components/CompareInstanceLogs.tsx';
import { Registry } from '../domains/registry/index.tsx';
import { Details as RegistryDetail } from '../domains/registry/details.tsx';
import { SHOW_PAGES } from '../utils/featureFlags';
import { paginationPathParams } from '../routing/common.ts';
import { Duplicates } from '../domains/entities/duplicates/list/Duplicates.tsx';
import { DuplicateDetails } from '../domains/entities/duplicates/details/DuplicateDetails.tsx';
import { VisitDetails } from '../domains/entities/components/VisitDetails.tsx';
import * as Permission from '../utils/permissions.ts';
import { SetupAccount } from '../components/SetupAccountPage.tsx';

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

export const setupAccountPath = {
    baseUrl: baseUrls.setupAccount,
    permissions: [],
    component: props => <SetupAccount {...props} />,
    params: [],
};

export const formsPath = {
    baseUrl: baseUrls.forms,
    permissions: [Permission.FORMS, Permission.SUBMISSIONS],
    params: [
        {
            isRequired: false,
            key: 'accountId',
        },
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
        {
            isRequired: false,
            key: 'planning',
        },
    ],
    component: props => <Forms {...props} />,
    isRootUrl: true,
};

export const pagesPath = {
    baseUrl: baseUrls.pages,
    permissions: [Permission.PAGES],
    featureFlag: SHOW_PAGES,
    params: [
        {
            isRequired: false,
            key: 'accountId',
        },
        ...paginationPathParams,
    ],
    component: props => <Pages {...props} />,
};

export const formDetailPath = {
    baseUrl: baseUrls.formDetail,
    permissions: [Permission.FORMS, Permission.SUBMISSIONS],
    component: props => <FormDetail {...props} />,
    params: [
        {
            isRequired: false,
            key: 'accountId',
        },
        {
            isRequired: true,
            key: 'formId',
        },
        {
            isRequired: false,
            key: 'tab',
        },
        ...paginationPathParams,
        ...paginationPathParamsWithPrefix('attachments'),
    ],
};

export const formsStatsPath = {
    baseUrl: baseUrls.formsStats,
    permissions: [Permission.FORMS],
    component: () => <FormsStats />,
    params: [
        {
            isRequired: false,
            key: 'accountId',
        },
    ],
};

export const instancesPath = {
    baseUrl: baseUrls.instances,
    permissions: [Permission.SUBMISSIONS],
    component: props => <Instances {...props} />,
    params: [
        {
            isRequired: false,
            key: 'accountId',
        },
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
        {
            isRequired: false,
            key: 'fieldsSearch',
        },
        {
            isRequired: false,
            key: 'planningIds',
        },
        {
            isRequired: false,
            key: 'userIds',
        },
        {
            isRequired: false,
            key: 'modificationDateFrom',
        },
        {
            isRequired: false,
            key: 'modificationDateTo',
        },
        {
            isRequired: false,
            key: 'sentDateFrom',
        },
        {
            isRequired: false,
            key: 'sentDateTo',
        },
    ],
};

export const instanceDetailPath = {
    baseUrl: baseUrls.instanceDetail,
    permissions: [Permission.SUBMISSIONS],
    component: props => <InstanceDetail {...props} />,
    params: [
        {
            isRequired: false,
            key: 'accountId',
        },
        {
            isRequired: true,
            key: 'instanceId',
        },
        {
            isRequired: false,
            key: 'referenceFormId',
        },
    ],
};

export const compareInstanceLogsPath = {
    baseUrl: baseUrls.compareInstanceLogs,
    permissions: [Permission.SUBMISSIONS],
    component: props => <CompareInstanceLogs {...props} />,
    params: [
        {
            isRequired: false,
            key: 'accountId',
        },
        {
            isRequired: true,
            key: 'instanceIds',
        },
        {
            isRequired: false,
            key: 'logA',
        },
        {
            isRequired: false,
            key: 'logB',
        },
    ],
};

export const compareInstancesPath = {
    baseUrl: baseUrls.compareInstances,
    permissions: [Permission.SUBMISSIONS],
    component: props => <CompareSubmissions {...props} />,
    params: [
        {
            isRequired: false,
            key: 'accountId',
        },
        {
            isRequired: true,
            key: 'instanceIds',
        },
    ],
};

export const mappingsPath = {
    baseUrl: baseUrls.mappings,
    permissions: [Permission.MAPPINGS],
    component: props => <Mappings {...props} />,
    params: [
        {
            isRequired: false,
            key: 'accountId',
        },
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
    permissions: [Permission.MAPPINGS],
    component: props => <MappingDetails {...props} />,
    params: [
        {
            isRequired: false,
            key: 'accountId',
        },
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
    permissions: [Permission.ORG_UNITS],
    component: props => <OrgUnits {...props} />,
    params: [
        {
            isRequired: false,
            key: 'accountId',
        },
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
    permissions: [Permission.ORG_UNITS],
    component: props => <OrgUnitDetail {...props} />,
    params: [
        {
            isRequired: false,
            key: 'accountId',
        },
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
            key: 'formId',
        },
        {
            isRequired: false,
            key: 'referenceFormId',
        },
        {
            isRequired: false,
            key: 'instanceId',
        },
        ...orgUnitsFiltersPathParamsWithPrefix('childrenParams', true),
        ...paginationPathParamsWithPrefix('childrenParams'),
        ...linksFiltersPathParamsWithPrefix('linksParams'),
        ...paginationPathParamsWithPrefix('linksParams'),
        ...paginationPathParamsWithPrefix('formsParams'),
        ...paginationPathParamsWithPrefix('logsParams'),
    ],
};

export const registryPath = {
    baseUrl: baseUrls.registry,
    permissions: [Permission.REGISTRY],
    component: props => <Registry {...props} />,
    params: [
        {
            isRequired: false,
            key: 'accountId',
        },
    ],
};
export const registryDetailPath = {
    baseUrl: baseUrls.registryDetail,
    permissions: [Permission.REGISTRY],
    component: props => <RegistryDetail {...props} />,
    params: [
        {
            isRequired: false,
            key: 'accountId',
        },
        {
            isRequired: true,
            key: 'orgUnitId',
        },
        {
            isRequired: false,
            key: 'formIds',
        },
        {
            isRequired: false,
            key: 'columns',
        },
        {
            isRequired: false,
            key: 'tab',
        },
        {
            isRequired: false,
            key: 'orgUnitListTab',
        },
        {
            isRequired: false,
            key: 'submissionId',
        },
        {
            isRequired: false,
            key: 'missingSubmissionVisible',
        },
        {
            isRequired: false,
            key: 'showTooltip',
        },
        {
            isRequired: false,
            key: 'isFullScreen',
        },
        ...paginationPathParams,
        ...paginationPathParamsWithPrefix('orgUnitList'),
        ...paginationPathParamsWithPrefix('missingSubmissions'),
    ],
};

export const linksPath = {
    baseUrl: baseUrls.links,
    permissions: [Permission.LINKS],
    component: props => <Links {...props} />,
    params: [
        {
            isRequired: false,
            key: 'accountId',
        },
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
    permissions: [Permission.LINKS],
    component: props => <Runs {...props} />,
    params: [
        {
            isRequired: false,
            key: 'accountId',
        },
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
    permissions: [Permission.COMPLETENESS],
    component: props => <Completeness {...props} />,
    params: [
        {
            isRequired: false,
            key: 'accountId',
        },
    ],
};

export const completenessStatsPath = {
    baseUrl: baseUrls.completenessStats,
    permissions: [Permission.COMPLETENESS_STATS],
    component: props => <CompletenessStats {...props} />,
    params: [
        {
            isRequired: false,
            key: 'accountId',
        },
        ...paginationPathParams,
        {
            isRequired: false,
            key: 'tab',
        },
        {
            isRequired: false,
            key: 'orgUnitId',
        },
        {
            isRequired: false,
            key: 'formId',
        },
        {
            isRequired: false,
            key: 'orgUnitTypeIds',
        },
        {
            isRequired: false,
            key: 'period',
        },
        {
            isRequired: false,
            key: 'parentId',
        },
        {
            isRequired: false,
            key: 'planningId',
        },
        {
            isRequired: false,
            key: 'groupId',
        },
        {
            isRequired: false,
            key: 'orgunitValidationStatus',
        },
        {
            isRequired: false,
            key: 'showDirectCompleteness',
        },
    ],
};

export const usersPath = {
    baseUrl: baseUrls.users,
    permissions: [Permission.USERS_ADMIN, Permission.USERS_MANAGEMENT],
    component: props => <Users {...props} />,
    params: [
        {
            isRequired: false,
            key: 'accountId',
        },
        {
            isRequired: false,
            key: 'search',
        },
        {
            isRequired: false,
            key: 'permissions',
        },
        {
            isRequired: false,
            key: 'location',
        },
        {
            isRequired: false,
            key: 'orgUnitTypes',
        },
        {
            isRequired: false,
            key: 'ouParent',
        },
        {
            isRequired: false,
            key: 'ouChildren',
        },
        {
            isRequired: false,
            key: 'projectsIds',
        },
        {
            isRequired: false,
            key: 'userRoles',
        },
        ...paginationPathParams.map(p => ({
            ...p,
            isRequired: true,
        })),
    ],
};

export const userRolesPath = {
    baseUrl: baseUrls.userRoles,
    permissions: [Permission.USER_ROLES],
    component: props => <UserRoles {...props} />,
    params: [
        {
            isRequired: false,
            key: 'accountId',
        },
        {
            isRequired: false,
            key: 'search',
        },
        ...paginationPathParams.map(p => ({
            ...p,
            isRequired: false,
        })),
    ],
};

export const projectsPath = {
    baseUrl: baseUrls.projects,
    permissions: [Permission.PROJECTS],
    component: props => <Projects {...props} />,
    params: [
        {
            isRequired: false,
            key: 'accountId',
        },
        ...paginationPathParams,
    ],
};

export const dataSourcesPath = {
    baseUrl: baseUrls.sources,
    permissions: [Permission.SOURCES],
    component: props => <DataSources {...props} />,
    params: [
        {
            isRequired: false,
            key: 'accountId',
        },
        ...paginationPathParams,
    ],
};

export const dataSourceDetailsPath = {
    baseUrl: baseUrls.sourceDetails,
    permissions: ['iaso_sources'],
    component: props => <DataSourceDetail {...props} />,
    params: [
        {
            isRequired: false,
            key: 'accountId',
        },
        {
            isRequired: true,
            key: 'sourceId',
        },
        ...paginationPathParams,
    ],
};

export const tasksPath = {
    baseUrl: baseUrls.tasks,
    permissions: [Permission.DATA_TASKS],
    component: props => <Tasks {...props} />,
    params: [
        {
            isRequired: false,
            key: 'accountId',
        },
        ...paginationPathParams,
    ],
};

export const devicesPath = {
    baseUrl: baseUrls.devices,
    permissions: [Permission.DATA_DEVICES],
    component: props => <Devices {...props} />,
    params: [
        {
            isRequired: false,
            key: 'accountId',
        },
        ...paginationPathParams,
    ],
};

export const groupsPath = {
    baseUrl: baseUrls.groups,
    permissions: [Permission.ORG_UNIT_GROUPS],
    component: props => <Groups {...props} />,
    params: [
        {
            isRequired: false,
            key: 'accountId',
        },
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
    permissions: [Permission.ORG_UNIT_TYPES],
    component: props => <Types {...props} />,
    params: [
        {
            isRequired: false,
            key: 'accountId',
        },
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
    permissions: [Permission.ENTITIES],
    component: props => <Beneficiaries {...props} />,
    params: [
        {
            isRequired: false,
            key: 'accountId',
        },
        {
            isRequired: false,
            key: 'tab',
        },
        {
            isRequired: false,
            key: 'search',
        },
        {
            isRequired: false,
            key: 'location',
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
            key: 'submitterId',
        },
        {
            isRequired: false,
            key: 'submitterTeamId',
        },
        {
            isRequired: false,
            key: 'entityTypeIds',
        },
        ...paginationPathParams.map(p => ({
            ...p,
            isRequired: true,
        })),
    ],
};
export const entityDetailsPath = {
    baseUrl: baseUrls.entityDetails,
    permissions: [Permission.ENTITIES],
    component: props => <BeneficiaryDetail {...props} />,
    params: [
        {
            isRequired: false,
            key: 'accountId',
        },
        {
            isRequired: true,
            key: 'entityId',
        },
        ...paginationPathParams,
    ],
};

export const entitySubmissionDetailPath = {
    baseUrl: baseUrls.entitySubmissionDetail,
    permissions: [Permission.ENTITIES],
    component: props => <VisitDetails {...props} />,
    params: [
        {
            isRequired: false,
            key: 'accountId',
        },
        {
            isRequired: true,
            key: 'instanceId',
        },
        {
            isRequired: true,
            key: 'entityId',
        },
    ],
};

export const entityTypesPath = {
    baseUrl: baseUrls.entityTypes,
    permissions: [Permission.ENTITIES],
    component: props => <EntityTypes {...props} />,
    params: [
        {
            isRequired: false,
            key: 'accountId',
        },
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
export const entityDuplicatesPath = {
    baseUrl: baseUrls.entityDuplicates,
    permissions: [
        Permission.ENTITIES_DUPLICATE_READ,
        Permission.ENTITIES_DUPLICATE_WRITE,
    ],
    component: props => <Duplicates {...props} />,
    params: [
        {
            isRequired: false,
            key: 'accountId',
        },

        {
            isRequired: false,
            key: 'search',
        },
        {
            isRequired: false,
            key: 'algorithm',
        },
        {
            isRequired: false,
            key: 'similarity',
        },
        {
            isRequired: false,
            key: 'entity_type',
        },
        {
            isRequired: false,
            key: 'org_unit',
        },
        {
            isRequired: false,
            key: 'start_date',
        },
        {
            isRequired: false,
            key: 'end_date',
        },
        {
            isRequired: false,
            key: 'submitter',
        },
        {
            isRequired: false,
            key: 'submitter_team',
        },
        {
            isRequired: false,
            key: 'ignored',
        },
        {
            isRequired: false,
            key: 'merged',
        },

        {
            isRequired: false,
            key: 'fields',
        },
        {
            isRequired: false,
            key: 'form',
        },
        {
            isRequired: false,
            key: 'entity_id',
        },
        ...paginationPathParams.map(p => ({
            ...p,
            isRequired: true,
        })),
    ],
};
export const entityDuplicatesDetailsPath = {
    baseUrl: baseUrls.entityDuplicateDetails,
    permissions: [
        Permission.ENTITIES_DUPLICATE_READ,
        Permission.ENTITIES_DUPLICATE_WRITE,
    ],
    component: props => <DuplicateDetails {...props} />,
    params: [
        {
            isRequired: false,
            key: 'accountId',
        },
        // ...paginationPathParams.map(p => ({
        //     ...p,
        //     isRequired: true,
        // })),
        {
            isRequired: false,
            key: 'entities',
        },
    ],
};
export const planningPath = {
    baseUrl: baseUrls.planning,
    // FIXME use planning permissions when they exist
    permissions: [Permission.PLANNINGS],
    component: props => <Planning {...props} />,
    params: [
        {
            isRequired: false,
            key: 'accountId',
        },
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
            isRequired: false,
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
    permissions: [Permission.PLANNINGS],
    component: props => <Assignments {...props} />,
    params: [
        {
            isRequired: false,
            key: 'accountId',
        },
        {
            isRequired: true,
            key: 'planningId',
        },
        {
            isRequired: false,
            key: 'team',
        },
        {
            isRequired: false,
            key: 'baseOrgunitType',
        },
        {
            isRequired: false,
            key: 'parentOrgunitType',
        },
        {
            isRequired: false,
            key: 'parentPicking',
        },
        {
            isRequired: false,
            key: 'tab',
        },
        {
            isRequired: false,
            key: 'order',
        },
        {
            isRequired: false,
            key: 'search',
        },
    ],
};
export const teamsPath = {
    baseUrl: baseUrls.teams,
    permissions: [Permission.TEAMS],
    component: props => <Teams {...props} />,
    params: [
        {
            isRequired: false,
            key: 'accountId',
        },
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
export const storagesPath = {
    baseUrl: baseUrls.storages,
    permissions: [Permission.STORAGES],
    component: props => <Storages {...props} />,
    params: [
        {
            isRequired: false,
            key: 'accountId',
        },
        {
            isRequired: false,
            key: 'search',
        },
        {
            isRequired: false,
            key: 'type',
        },
        {
            isRequired: false,
            key: 'status',
        },
        {
            isRequired: false,
            key: 'reason',
        },
        ...paginationPathParams.map(p => ({
            ...p,
            isRequired: true,
        })),
    ],
};
export const storageDetailPath = {
    baseUrl: baseUrls.storageDetail,
    permissions: [Permission.STORAGES],
    component: props => <StorageDetails {...props} />,
    params: [
        {
            isRequired: false,
            key: 'accountId',
        },
        {
            isRequired: true,
            key: 'type',
        },
        {
            isRequired: true,
            key: 'storageId',
        },
        {
            isRequired: false,
            key: 'operationType',
        },
        {
            isRequired: false,
            key: 'performedAt',
        },
        ...paginationPathParams,
    ],
};
export const workflowsPath = {
    baseUrl: baseUrls.workflows,
    permissions: [Permission.WORKFLOWS],
    component: props => <Workflows {...props} />,
    params: [
        {
            isRequired: false,
            key: 'accountId',
        },
        {
            isRequired: true,
            key: 'entityTypeId',
        },
        {
            isRequired: false,
            key: 'search',
        },
        {
            isRequired: false,
            key: 'status',
        },
        ...paginationPathParams.map(p => ({
            ...p,
            isRequired: true,
        })),
    ],
};
export const workflowsDetailPath = {
    baseUrl: baseUrls.workflowDetail,
    permissions: [Permission.WORKFLOWS],
    component: props => <WorkflowDetails {...props} />,
    params: [
        {
            isRequired: false,
            key: 'accountId',
        },
        {
            isRequired: true,
            key: 'entityTypeId',
        },
        {
            isRequired: true,
            key: 'versionId',
        },
        // pagination to sort changes
        ...paginationPathParams,
    ],
};

export const page401 = {
    baseUrl: baseUrls.error401,
    component: () => <PageError errorCode="401" />,
    params: [],
};

export const page403 = {
    baseUrl: baseUrls.error403,
    component: () => <PageError errorCode="403" />,
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
    compareInstanceLogsPath,
    compareInstancesPath,
    orgUnitsPath,
    orgUnitsDetailsPath,
    linksPath,
    algosPath,
    completenessPath,
    completenessStatsPath,
    usersPath,
    userRolesPath,
    projectsPath,
    dataSourcesPath,
    dataSourceDetailsPath,
    tasksPath,
    devicesPath,
    groupsPath,
    orgUnitTypesPath,
    entityTypesPath,
    pagesPath,
    page401,
    page403,
    page404,
    page500,
    teamsPath,
    planningPath,
    assignmentsPath,
    entitiesPath,
    entityDetailsPath,
    entitySubmissionDetailPath,
    entityDuplicatesPath,
    entityDuplicatesDetailsPath,
    storagesPath,
    storageDetailPath,
    workflowsPath,
    workflowsDetailPath,
    registryPath,
    registryDetailPath,
];
