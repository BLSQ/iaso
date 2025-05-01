import React, { ReactElement } from 'react';
import PageError from '../components/errors/PageError';
import { Runs } from '../domains/algorithmRuns/Runs';
import { Assignments } from '../domains/assignments';
import Completeness from '../domains/completeness';
import { CompletenessStats } from '../domains/completenessStats';
import DataSources from '../domains/dataSources';
import { Details as DataSourceDetail } from '../domains/dataSources/details';
import Devices from '../domains/devices';
import { Entities } from '../domains/entities';
import { Details as EntityDetail } from '../domains/entities/details';
import { DuplicateDetails } from '../domains/entities/duplicates/details/DuplicateDetails';
import { Duplicates } from '../domains/entities/duplicates/list/Duplicates';
import { EntityTypes } from '../domains/entities/entityTypes';
import Forms from '../domains/forms';
import FormDetail from '../domains/forms/detail';
import { FormsStats } from '../domains/forms/stats';
import { Welcome } from '../domains/home/components/ExtraGrid/Welcome';
import Instances from '../domains/instances';
import CompareSubmissions from '../domains/instances/compare';
import { CompareInstanceLogs } from '../domains/instances/compare/components/CompareInstanceLogs';
import InstanceDetail from '../domains/instances/details';
import { Links } from '../domains/links';
import Mappings from '../domains/mappings';
import MappingDetails from '../domains/mappings/details';
import { Modules } from '../domains/modules';
import { OrgUnits } from '../domains/orgUnits';
import { OrgUnitChangeRequestConfigs } from '../domains/orgUnits/configuration/OrgUnitChangeRequestConfigs';
import OrgUnitDetail from '../domains/orgUnits/details';
import Groups from '../domains/orgUnits/groups';
import GroupSets from '../domains/orgUnits/groupSets';
import GroupSet from '../domains/orgUnits/groupSets/GroupSet';
import Types from '../domains/orgUnits/orgUnitTypes';
import { ReviewOrgUnitChanges } from '../domains/orgUnits/reviewChanges';
import { ReviewOrgUnitChangesDetail } from '../domains/orgUnits/reviewChanges/details';
import Pages from '../domains/pages';
import { LotsPayments } from '../domains/payments/LotsPayments';
import { PotentialPayments } from '../domains/payments/PotentialPayments';
import { Planning } from '../domains/plannings';
import { Projects } from '../domains/projects';
import { Registry } from '../domains/registry';
import { SetupAccount } from '../domains/setup';
import { Storages } from '../domains/storages';
import { Details as StorageDetails } from '../domains/storages/details';
import Tasks from '../domains/tasks';
import { Teams } from '../domains/teams';
import { UserRoles } from '../domains/userRoles';
import { Users } from '../domains/users';
import { UsersHistory } from '../domains/users/history/UsersHistory';
import { Workflows } from '../domains/workflows';
import { Details as WorkflowDetails } from '../domains/workflows/details';
import { SHOW_PAGES } from '../utils/featureFlags';
import * as Permission from '../utils/permissions';
import { baseUrls } from './urls';

export type RoutePath = {
    baseUrl: string;
    routerUrl: string; // baseUrl+"/*", so we can catch the params
    permissions: string[]; // can be skipped if allowAnonymous === true
    element: ReactElement; // a prop-less Element (not a component)
    isRootUrl?: boolean;
    allowAnonymous?: boolean;
};

export type AnonymousRoutePath = Omit<RoutePath, 'permissions'> & {
    allowAnonymous: true;
    useDashboard?: boolean;
};

export const setupAccountPath = {
    baseUrl: baseUrls.setupAccount,
    routerUrl: `${baseUrls.setupAccount}/*`,
    permissions: [],
    element: <SetupAccount />,
};

export const formsPath = {
    baseUrl: baseUrls.forms,
    routerUrl: `${baseUrls.forms}/*`,
    permissions: [
        Permission.FORMS,
        Permission.SUBMISSIONS,
        Permission.SUBMISSIONS_UPDATE,
    ],
    element: <Forms />,
    isRootUrl: true,
};

export const pagesPath = {
    baseUrl: baseUrls.pages,
    routerUrl: `${baseUrls.pages}/*`,
    permissions: [Permission.PAGES, Permission.PAGE_WRITE],
    featureFlag: SHOW_PAGES,
    element: <Pages />,
};

export const formDetailPath = {
    baseUrl: baseUrls.formDetail,
    routerUrl: `${baseUrls.formDetail}/*`,
    permissions: [
        Permission.FORMS,
        Permission.SUBMISSIONS,
        Permission.SUBMISSIONS_UPDATE,
    ],
    element: <FormDetail />,
};

export const formsStatsPath = {
    baseUrl: baseUrls.formsStats,
    routerUrl: `${baseUrls.formsStats}/*`,
    permissions: [Permission.FORMS_STATS],
    element: <FormsStats />,
};

export const instancesPath = {
    baseUrl: baseUrls.instances,
    routerUrl: `${baseUrls.instances}/*`,
    permissions: [Permission.SUBMISSIONS, Permission.SUBMISSIONS_UPDATE],
    element: <Instances />,
};

export const instanceDetailPath = {
    baseUrl: baseUrls.instanceDetail,
    routerUrl: `${baseUrls.instanceDetail}/*`,
    permissions: [Permission.SUBMISSIONS, Permission.SUBMISSIONS_UPDATE],
    element: <InstanceDetail />,
};

export const compareInstanceLogsPath = {
    baseUrl: baseUrls.compareInstanceLogs,
    routerUrl: `${baseUrls.compareInstanceLogs}/*`,
    permissions: [Permission.SUBMISSIONS, Permission.SUBMISSIONS_UPDATE],
    element: <CompareInstanceLogs />,
};

export const compareInstancesPath = {
    baseUrl: baseUrls.compareInstances,
    routerUrl: `${baseUrls.compareInstances}/*`,
    permissions: [Permission.SUBMISSIONS, Permission.SUBMISSIONS_UPDATE],
    element: <CompareSubmissions />,
};

export const mappingsPath = {
    baseUrl: baseUrls.mappings,
    routerUrl: `${baseUrls.mappings}/*`,
    permissions: [Permission.MAPPINGS],
    element: <Mappings />,
};

export const mappingDetailPath = {
    baseUrl: baseUrls.mappingDetail,
    routerUrl: `${baseUrls.mappingDetail}/*`,
    permissions: [Permission.MAPPINGS],
    element: <MappingDetails />,
};

export const orgUnitsPath = {
    baseUrl: baseUrls.orgUnits,
    routerUrl: `${baseUrls.orgUnits}/*`,
    permissions: [Permission.ORG_UNITS, Permission.ORG_UNITS_READ],
    element: <OrgUnits />,
};

export const orgUnitsDetailsPath = {
    baseUrl: baseUrls.orgUnitDetails,
    routerUrl: `${baseUrls.orgUnitDetails}/*`,
    permissions: [Permission.ORG_UNITS, Permission.ORG_UNITS_READ],
    element: <OrgUnitDetail />,
};

export const orgUnitChangeRequestPath = {
    baseUrl: baseUrls.orgUnitsChangeRequest,
    routerUrl: `${baseUrls.orgUnitsChangeRequest}/*`,
    permissions: [Permission.ORG_UNITS_CHANGE_REQUEST_REVIEW],
    element: <ReviewOrgUnitChanges />,
};

export const orgUnitChangeRequestDetailPath = {
    baseUrl: baseUrls.orgUnitsChangeRequestDetail,
    routerUrl: `${baseUrls.orgUnitsChangeRequestDetail}/*`,
    permissions: [Permission.ORG_UNITS_CHANGE_REQUEST_REVIEW],
    element: <ReviewOrgUnitChangesDetail />,
};

export const orgUnitsChangeRequestConfiguration = {
    baseUrl: baseUrls.orgUnitsChangeRequestConfiguration,
    routerUrl: `${baseUrls.orgUnitsChangeRequestConfiguration}/*`,
    permissions: [Permission.ORG_UNITS_CHANGE_REQUESTS_CONFIGURATION],
    element: <OrgUnitChangeRequestConfigs />,
};

export const registryPath = {
    baseUrl: baseUrls.registry,
    routerUrl: `${baseUrls.registry}/*`,
    permissions: [Permission.REGISTRY_READ, Permission.REGISTRY_WRITE],
    element: <Registry />,
};

export const linksPath = {
    baseUrl: baseUrls.links,
    routerUrl: `${baseUrls.links}/*`,
    permissions: [Permission.LINKS],
    element: <Links />,
};

export const algosPath = {
    baseUrl: baseUrls.algos,
    routerUrl: `${baseUrls.algos}/*`,
    permissions: [Permission.LINKS],
    element: <Runs />,
};

export const completenessPath = {
    baseUrl: baseUrls.completeness,
    routerUrl: `${baseUrls.completeness}/*`,
    permissions: [Permission.COMPLETENESS],
    element: <Completeness />,
};

export const completenessStatsPath = {
    baseUrl: baseUrls.completenessStats,
    routerUrl: `${baseUrls.completenessStats}/*`,
    permissions: [Permission.COMPLETENESS_STATS],
    element: <CompletenessStats />,
};

export const modulesPath = {
    baseUrl: baseUrls.modules,
    routerUrl: `${baseUrls.modules}/*`,
    permissions: [Permission.MODULES],
    element: <Modules />,
};

export const usersPath = {
    baseUrl: baseUrls.users,
    routerUrl: `${baseUrls.users}/*`,
    permissions: [Permission.USERS_ADMIN, Permission.USERS_MANAGEMENT],
    element: <Users />,
};

export const usersHistoryPath = {
    baseUrl: baseUrls.usersHistory,
    routerUrl: `${baseUrls.usersHistory}/*`,
    permissions: [Permission.USERS_ADMIN],
    element: <UsersHistory />,
};

export const userRolesPath = {
    baseUrl: baseUrls.userRoles,
    routerUrl: `${baseUrls.userRoles}/*`,
    permissions: [Permission.USER_ROLES],
    element: <UserRoles />,
};

export const projectsPath = {
    baseUrl: baseUrls.projects,
    routerUrl: `${baseUrls.projects}/*`,
    permissions: [Permission.PROJECTS],
    element: <Projects />,
};

export const dataSourcesPath = {
    baseUrl: baseUrls.sources,
    routerUrl: `${baseUrls.sources}/*`,
    permissions: [Permission.SOURCES, Permission.SOURCE_WRITE],
    element: <DataSources />,
};

export const dataSourceDetailsPath = {
    baseUrl: baseUrls.sourceDetails,
    routerUrl: `${baseUrls.sourceDetails}/*`,
    permissions: [Permission.SOURCES, Permission.SOURCE_WRITE],
    element: <DataSourceDetail />,
};

export const tasksPath = {
    baseUrl: baseUrls.tasks,
    routerUrl: `${baseUrls.tasks}/*`,
    permissions: [Permission.DATA_TASKS],
    element: <Tasks />,
};

export const devicesPath = {
    baseUrl: baseUrls.devices,
    routerUrl: `${baseUrls.devices}/*`,
    permissions: [Permission.DATA_DEVICES],
    element: <Devices />,
};

export const groupsPath = {
    baseUrl: baseUrls.groups,
    routerUrl: `${baseUrls.groups}/*`,
    permissions: [Permission.ORG_UNIT_GROUPS],
    element: <Groups />,
};

export const groupSetsPath = {
    baseUrl: baseUrls.groupSets,
    routerUrl: `${baseUrls.groupSets}/*`,
    permissions: [Permission.ORG_UNIT_GROUPS],
    element: <GroupSets />,
};

export const groupSetDetailPath = {
    baseUrl: baseUrls.groupSetDetail,
    routerUrl: `${baseUrls.groupSetDetail}/*`,
    permissions: [Permission.ORG_UNIT_GROUPS],
    element: <GroupSet />,
};

export const orgUnitTypesPath = {
    baseUrl: baseUrls.orgUnitTypes,
    routerUrl: `${baseUrls.orgUnitTypes}/*`,
    permissions: [Permission.ORG_UNIT_TYPES],
    element: <Types />,
};
export const entitiesPath = {
    baseUrl: baseUrls.entities,
    routerUrl: `${baseUrls.entities}/*`,
    permissions: [Permission.ENTITIES],
    element: <Entities />,
};
export const entityDetailsPath = {
    baseUrl: baseUrls.entityDetails,
    routerUrl: `${baseUrls.entityDetails}/*`,
    permissions: [Permission.ENTITIES],
    element: <EntityDetail />,
};

export const entityTypesPath = {
    baseUrl: baseUrls.entityTypes,
    routerUrl: `${baseUrls.entityTypes}/*`,
    permissions: [Permission.ENTITIES],
    element: <EntityTypes />,
};
export const entityDuplicatesPath = {
    baseUrl: baseUrls.entityDuplicates,
    routerUrl: `${baseUrls.entityDuplicates}/*`,
    permissions: [
        Permission.ENTITIES_DUPLICATE_READ,
        Permission.ENTITIES_DUPLICATE_WRITE,
    ],
    element: <Duplicates />,
};
export const entityDuplicatesDetailsPath = {
    baseUrl: baseUrls.entityDuplicateDetails,
    routerUrl: `${baseUrls.entityDuplicateDetails}/*`,
    permissions: [
        Permission.ENTITIES_DUPLICATE_READ,
        Permission.ENTITIES_DUPLICATE_WRITE,
    ],
    element: <DuplicateDetails />,
};
export const planningPath = {
    baseUrl: baseUrls.planning,
    routerUrl: `${baseUrls.planning}/*`,
    // FIXME use planning permissions when they exist
    permissions: [Permission.PLANNING_READ, Permission.PLANNING_WRITE],
    element: <Planning />,
};
export const assignmentsPath = {
    baseUrl: baseUrls.assignments,
    routerUrl: `${baseUrls.assignments}/*`,
    // FIXME use planning permissions when they exist
    permissions: [Permission.PLANNING_READ, Permission.PLANNING_WRITE],
    element: <Assignments />,
};
export const teamsPath = {
    baseUrl: baseUrls.teams,
    routerUrl: `${baseUrls.teams}/*`,
    permissions: [Permission.TEAMS],
    element: <Teams />,
};
export const storagesPath = {
    baseUrl: baseUrls.storages,
    routerUrl: `${baseUrls.storages}/*`,
    permissions: [Permission.STORAGES],
    element: <Storages />,
};
export const storageDetailPath = {
    baseUrl: baseUrls.storageDetail,
    routerUrl: `${baseUrls.storageDetail}/*`,
    permissions: [Permission.STORAGES],
    element: <StorageDetails />,
};
export const workflowsPath = {
    baseUrl: baseUrls.workflows,
    routerUrl: `${baseUrls.workflows}/*`,
    permissions: [Permission.WORKFLOWS],
    element: <Workflows />,
};
export const workflowsDetailPath = {
    baseUrl: baseUrls.workflowDetail,
    routerUrl: `${baseUrls.workflowDetail}/*`,
    permissions: [Permission.WORKFLOWS],
    element: <WorkflowDetails />,
};
export const potentialPaymentsPath = {
    baseUrl: baseUrls.potentialPayments,
    routerUrl: `${baseUrls.potentialPayments}/*`,
    permissions: [Permission.PAYMENTS],
    element: <PotentialPayments />,
};
export const lotsPaymentsPath = {
    baseUrl: baseUrls.lotsPayments,
    routerUrl: `${baseUrls.lotsPayments}/*`,
    permissions: [Permission.PAYMENTS],
    element: <LotsPayments />,
};

export const page401 = {
    baseUrl: baseUrls.error401,
    routerUrl: baseUrls.error401,
    element: <PageError errorCode="401" />,
    permissions: [],
};

export const bonusPath = {
    baseUrl: baseUrls.hidden,
    routerUrl: `${baseUrls.hidden}/*`,
    permissions: [...Object.values(Permission)],
    element: <Welcome />,
};

export const page403 = {
    baseUrl: baseUrls.error403,
    routerUrl: baseUrls.error403,
    element: <PageError errorCode="403" />,
    permissions: [],
};

export const page404 = {
    baseUrl: baseUrls.error404,
    routerUrl: baseUrls.error404,
    element: <PageError errorCode="404" />,
    permissions: [],
};

export const page500 = {
    baseUrl: baseUrls.error500,
    routerUrl: baseUrls.error500,
    element: <PageError errorCode="500" />,
    permissions: [],
};

export const routeConfigs: (RoutePath | AnonymousRoutePath)[] = [
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
    usersHistoryPath,
    userRolesPath,
    projectsPath,
    dataSourcesPath,
    dataSourceDetailsPath,
    tasksPath,
    devicesPath,
    groupsPath,
    groupSetsPath,
    groupSetDetailPath,
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
    entityDuplicatesPath,
    entityDuplicatesDetailsPath,
    storagesPath,
    storageDetailPath,
    workflowsPath,
    workflowsDetailPath,
    orgUnitChangeRequestPath,
    orgUnitChangeRequestDetailPath,
    orgUnitsChangeRequestConfiguration,
    registryPath,
    modulesPath,
    potentialPaymentsPath,
    lotsPaymentsPath,
    bonusPath,
];
