import { capitalize } from 'bluesquare-components';
import { paginationPathParams } from '../routing/common.ts';
import { linksFiltersWithPrefix, orgUnitFiltersWithPrefix } from './filters';

export const paginationPathParamsWithPrefix = prefix =>
    paginationPathParams.map(p => `${prefix}${capitalize(p, true)}`);

export const orgUnitsFiltersPathParamsWithPrefix = (prefix, withChildren) =>
    orgUnitFiltersWithPrefix(prefix, withChildren).map(f => f.urlKey);

export const linksFiltersPathParamsWithPrefix = prefix =>
    linksFiltersWithPrefix(prefix).map(f => f.urlKey);

export const CHANGE_REQUEST = 'changeRequest';
const ORG_UNITS = 'orgunits';
const ORG_UNITS_CHANGE_REQUEST = `${ORG_UNITS}/${CHANGE_REQUEST}`;

export const baseRouteConfigs = {
    setupAccount: { url: 'setupAccount', params: [] },
    home: { url: 'home', params: [] },
    forms: {
        url: 'forms/list',
        params: [
            'accountId',
            ...paginationPathParams,
            'search',
            'searchActive',
            'showDeleted',
            'planning',
            'orgUnitTypeIds',
            'projectsIds',
        ],
    },
    formDetail: {
        url: 'forms/detail',
        params: [
            'accountId',
            'formId',
            'tab',
            ...paginationPathParams,
            ...paginationPathParamsWithPrefix('attachments'),
        ],
    },
    formsStats: { url: 'forms/stats', params: ['accountId'] },
    instances: {
        url: 'forms/submissions',
        params: [
            'accountId',
            'formIds',
            ...paginationPathParams,
            'periodType',
            'dateFrom',
            'dateTo',
            'startPeriod',
            'endPeriod',
            'status',
            'levels',
            'orgUnitTypeId',
            'withLocation',
            'deviceId',
            'deviceOwnershipId',
            'tab',
            'columns',
            'search',
            'showDeleted',
            'mapResults',
            'filePage',
            'fileRowsPerPage',
            'fieldsSearch',
            'planningIds',
            'userIds',
            'modificationDateFrom',
            'modificationDateTo',
            'sentDateFrom',
            'sentDateTo',
        ],
    },
    instanceDetail: {
        url: 'forms/submission',
        params: ['accountId', 'instanceId', 'referenceFormId'],
    },
    compareInstanceLogs: {
        url: 'forms/compareInstanceLogs',
        params: ['accountId', 'instanceIds', 'logA', 'logB'],
    },
    compareInstances: {
        url: 'forms/compare',
        params: ['accountId', 'instanceIds'],
    },
    mappings: {
        url: 'forms/mappings',
        params: ['accountId', 'formId', ...paginationPathParams],
    },
    mappingDetail: {
        url: 'forms/mapping',
        params: ['accountId', 'mappingVersionId', 'questionName'],
    },
    orgUnits: {
        url: 'orgunits/list',
        params: [
            'accountId',
            'locationLimit',
            ...paginationPathParams,
            'tab',
            'searchTabIndex',
            'searchActive',
            'searches',
        ],
    },
    orgUnitDetails: {
        url: 'orgunits/detail',
        params: [
            'accountId',
            'orgUnitId',
            'levels',
            ...paginationPathParams,
            'logsOrder',
            'tab',
            'formId',
            'referenceFormId',
            'instanceId',
            ...orgUnitsFiltersPathParamsWithPrefix('childrenParams', true),
            ...paginationPathParamsWithPrefix('childrenParams'),
            ...linksFiltersPathParamsWithPrefix('linksParams'),
            ...paginationPathParamsWithPrefix('linksParams'),
            ...paginationPathParamsWithPrefix('formsParams'),
            ...paginationPathParamsWithPrefix('logsParams'),
        ],
    },
    orgUnitsChangeRequest: {
        url: ORG_UNITS_CHANGE_REQUEST,
        params: [
            'accountId',
            ...paginationPathParams,
            'parent_id',
            'groups',
            'org_unit_type_id',
            'status',
            'created_at_after',
            'created_at_before',
            'forms',
            'userIds',
            'userRoles',
            'withLocation',
        ],
    },
    registry: {
        url: 'orgunits/registry',
        params: [
            'accountId',
            'orgUnitId',
            'formIds',
            'columns',
            'tab',
            'orgUnitListTab',
            'submissionId',
            'missingSubmissionVisible',
            'showTooltip',
            'isFullScreen',
            ...paginationPathParams,
            ...paginationPathParamsWithPrefix('orgUnitList'),
            ...paginationPathParamsWithPrefix('missingSubmissions'),
        ],
    },
    links: {
        url: 'orgunits/sources/links/list',
        params: [
            'accountId',
            'search',
            'origin',
            'originVersion',
            'destination',
            'destinationVersion',
            'validated',
            'validatorId',
            'orgUnitTypeId',
            'algorithmId',
            'algorithmRunId',
            'score',
            ...paginationPathParams,
            'searchActive',
            'validation_status',
        ],
    },
    algos: {
        url: 'orgunits/sources/links/runs',
        params: [
            'accountId',
            'algorithmId',
            'origin',
            'originVersion',
            'destination',
            'destinationVersion',
            'launcher',
            ...paginationPathParams,
            'searchActive',
        ],
    },
    completeness: { url: 'forms/completeness', params: ['accountId'] },
    completenessStats: {
        url: 'forms/completenessStats',
        params: [
            'accountId',
            ...paginationPathParams,
            'tab',
            'orgUnitId',
            'formId',
            'orgUnitTypeIds',
            'period',
            'parentId',
            'planningId',
            'groupId',
            'orgunitValidationStatus',
            'showDirectCompleteness',
            'teamsIds',
            'userIds',
        ],
    },
    modules: {
        url: 'settings/modules',
        params: ['accountId', 'search', ...paginationPathParams],
    },
    users: {
        url: 'settings/users',
        params: [
            'accountId',
            'search',
            'permissions',
            'location',
            'orgUnitTypes',
            'ouParent',
            'ouChildren',
            'projectsIds',
            'userRoles',
            'teamsIds',
            ...paginationPathParams,
        ],
    },
    userRoles: {
        url: 'settings/userRoles',
        params: ['accountId', 'search', ...paginationPathParams],
    },
    projects: {
        url: 'settings/projects',
        params: ['accountId', ...paginationPathParams],
    },
    sources: {
        url: 'orgunits/sources/list',
        params: ['accountId', ...paginationPathParams],
    },
    sourceDetails: {
        url: 'orgunits/source/details',
        params: ['accountId', 'sourceId', ...paginationPathParams],
    },
    tasks: {
        url: 'settings/tasks',
        params: ['accountId', ...paginationPathParams],
    },
    devices: {
        url: 'settings/devices',
        params: ['accountId', ...paginationPathParams],
    },
    groups: {
        url: 'orgunits/groups',
        params: ['accountId', 'search', ...paginationPathParams],
    },
    orgUnitTypes: {
        url: 'orgunits/types',
        params: ['accountId', 'search', ...paginationPathParams],
    },
    entities: {
        url: 'entities/list',
        params: [
            'accountId',
            'tab',
            'search',
            'location',
            'dateFrom',
            'dateTo',
            'submitterId',
            'submitterTeamId',
            'entityTypeIds',
            ...paginationPathParams,
        ],
    },
    entityDetails: {
        url: 'entities/details',
        params: ['accountId', 'entityId', ...paginationPathParams],
    },
    entitySubmissionDetail: {
        url: 'entities/submission',
        params: ['accountId', 'instanceId', 'entityId'],
    },
    entityTypes: {
        url: 'entities/types',
        params: ['accountId', 'search', ...paginationPathParams],
    },
    entityDuplicates: {
        url: 'entities/duplicates',
        params: [
            'accountId',
            'search',
            'algorithm',
            'similarity',
            'entity_type',
            'org_unit',
            'start_date',
            'end_date',
            'submitter',
            'submitter_team',
            'ignored',
            'merged',
            'fields',
            'form',
            'entity_id',
            ...paginationPathParams,
        ],
    },
    entityDuplicateDetails: {
        url: 'entities/duplicates/details',
        params: ['accountId', 'entities', ...paginationPathParams],
    },
    pages: { url: 'pages', params: ['accountId', ...paginationPathParams] },
    planning: {
        url: 'planning/list',
        params: [
            'accountId',
            'search',
            'dateFrom',
            'dateTo',
            'publishingStatus',
            ...paginationPathParams,
        ],
    },
    assignments: {
        url: 'planning/assignments',
        params: [
            'accountId',
            'planningId',
            'team',
            'baseOrgunitType',
            'parentOrgunitType',
            'tab',
            'order',
            'search',
        ],
    },
    teams: {
        url: 'settings/teams',
        params: ['accountId', 'search', ...paginationPathParams],
    },
    storages: {
        url: 'storages',
        params: [
            'accountId',
            'search',
            'type',
            'status',
            'reason',
            ...paginationPathParams,
        ],
    },
    storageDetail: {
        url: 'storages/detail',
        params: [
            'accountId',
            'type',
            'storageId',
            'operationType',
            'performedAt',
            ...paginationPathParams,
        ],
    },
    workflows: {
        url: 'workflows',
        params: [
            'accountId',
            'entityTypeId',
            'search',
            'status',
            ...paginationPathParams,
        ],
    },
    workflowDetail: {
        url: 'workflows/details',
        params: [
            'accountId',
            'entityTypeId',
            'versionId',
            ...paginationPathParams,
        ],
    },
    potentialPayments: {
        url: 'payments/potential',
        params: [
            'accountId',
            ...paginationPathParams,
            'change_requests__created_at_after',
            'change_requests__created_at_before',
            'parent_id',
            'forms',
            'users',
            'user_roles',
        ],
    },
    lotsPayments: {
        url: 'payments/lots',
        params: [
            'accountId',
            ...paginationPathParams,
            'created_at_after',
            'created_at_before',
            'status',
            'users',
            'parent_id',
        ],
    },
    error401: { url: '401', params: [] },
    error403: { url: '403', params: [] },
    error404: { url: '404', params: [] },
    error500: { url: '500', params: [] },
    login: { url: 'login', params: [] },
    apiLogs: { url: 'api/logs', params: [] }, // used in FormFormComponents only
};

const extractUrls = () => {
    const result = {};
    Object.entries(baseRouteConfigs).forEach(([key, value]) => {
        result[key] = value.url;
    });
    return result;
};

const extractParams = () => {
    const result = {};
    Object.entries(baseRouteConfigs).forEach(([key, value]) => {
        result[key] = value.params;
    });
    return result;
};

const extractParamsConfig = () => {
    const result = {};
    Object.values(baseRouteConfigs).forEach(value => {
        result[value.url] = value.params;
    });
    return result;
};

export const baseUrls = extractUrls();
export const baseParams = extractParams();
export const paramsConfig = extractParamsConfig();
