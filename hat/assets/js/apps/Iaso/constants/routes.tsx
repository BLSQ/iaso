/* eslint-disable react/jsx-props-no-spreading */
import React, { ReactElement } from 'react';
import Forms from '../domains/forms';
import FormDetail from '../domains/forms/detail';
import FormsStats from '../domains/forms/stats';
import { OrgUnits } from '../domains/orgUnits';
import { Links } from '../domains/links';
import Runs from '../domains/links/Runs';
import OrgUnitDetail from '../domains/orgUnits/details';
import Completeness from '../domains/completeness';
import Instances from '../domains/instances';
import CompareSubmissions from '../domains/instances/compare';
import InstanceDetail from '../domains/instances/details';
import Mappings from '../domains/mappings';
import MappingDetails from '../domains/mappings/details';
import { Users } from '../domains/users';
import { UserRoles } from '../domains/userRoles';
import { Modules } from '../domains/modules';
import { Projects } from '../domains/projects';
import DataSources from '../domains/dataSources';
import { Details as DataSourceDetail } from '../domains/dataSources/details';
import Tasks from '../domains/tasks';
import Devices from '../domains/devices';
import { CompletenessStats } from '../domains/completenessStats';
import Groups from '../domains/orgUnits/groups';
import Types from '../domains/orgUnits/orgUnitTypes';
import { Beneficiaries } from '../domains/entities';
import { Details as BeneficiaryDetail } from '../domains/entities/details';
import { EntityTypes } from '../domains/entities/entityTypes';
import PageError from '../components/errors/PageError';
import { baseUrls } from './urls';
import Pages from '../domains/pages';
import { Planning } from '../domains/plannings';
import { Teams } from '../domains/teams';
import { Storages } from '../domains/storages';
import { Workflows } from '../domains/workflows';
import { Details as WorkflowDetails } from '../domains/workflows/details';
import { Details as StorageDetails } from '../domains/storages/details';
import { Assignments } from '../domains/assignments';
import { CompareInstanceLogs } from '../domains/instances/compare/components/CompareInstanceLogs';
import { Registry } from '../domains/registry';
import { SHOW_PAGES } from '../utils/featureFlags';
import { Duplicates } from '../domains/entities/duplicates/list/Duplicates';
import { DuplicateDetails } from '../domains/entities/duplicates/details/DuplicateDetails';
import { ReviewOrgUnitChanges } from '../domains/orgUnits/reviewChanges/ReviewOrgUnitChanges';
import { VisitDetails } from '../domains/entities/components/VisitDetails';
import * as Permission from '../utils/permissions';
import { SetupAccount } from '../domains/setup';
import { PotentialPayments } from '../domains/payments/PotentialPayments';
import { LotsPayments } from '../domains/payments/LotsPayments';

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
    permissions: [Permission.FORMS, Permission.SUBMISSIONS],
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
    permissions: [Permission.FORMS, Permission.SUBMISSIONS],
    element: <FormDetail />,
};

export const formsStatsPath = {
    baseUrl: baseUrls.formsStats,
    routerUrl: `${baseUrls.formsStats}/*`,
    permissions: [Permission.FORMS],
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
    permissions: [Permission.SUBMISSIONS],
    element: <InstanceDetail />,
};

export const compareInstanceLogsPath = {
    baseUrl: baseUrls.compareInstanceLogs,
    routerUrl: `${baseUrls.compareInstanceLogs}/*`,
    permissions: [Permission.SUBMISSIONS],
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
    permissions: [Permission.ORG_UNITS],
    element: <OrgUnits />,
};

export const orgUnitsDetailsPath = {
    baseUrl: baseUrls.orgUnitDetails,
    routerUrl: `${baseUrls.orgUnitDetails}/*`,
    permissions: [Permission.ORG_UNITS],
    element: <OrgUnitDetail />,
};

export const orgUnitChangeRequestPath = {
    baseUrl: baseUrls.orgUnitsChangeRequest,
    routerUrl: `${baseUrls.orgUnitsChangeRequest}/*`,
    permissions: [Permission.ORG_UNITS_CHANGE_REQUEST_REVIEW],
    element: <ReviewOrgUnitChanges />,
};

export const registryPath = {
    baseUrl: baseUrls.registry,
    routerUrl: `${baseUrls.registry}/*`,
    permissions: [Permission.REGISTRY],
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
    element: <Beneficiaries />,
};
export const entityDetailsPath = {
    baseUrl: baseUrls.entityDetails,
    routerUrl: `${baseUrls.entityDetails}/*`,
    permissions: [Permission.ENTITIES],
    element: <BeneficiaryDetail />,
};

export const entitySubmissionDetailPath = {
    baseUrl: baseUrls.entitySubmissionDetail,
    routerUrl: `${baseUrls.entitySubmissionDetail}/*`,
    permissions: [Permission.ENTITIES],
    element: <VisitDetails />,
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
    permissions: [Permission.PLANNINGS],
    element: <Planning />,
};
export const assignmentsPath = {
    baseUrl: baseUrls.assignments,
    routerUrl: `${baseUrls.assignments}/*`,
    // FIXME use planning permissions when they exist
    permissions: [Permission.PLANNINGS],
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
    orgUnitChangeRequestPath,
    registryPath,
    modulesPath,
    potentialPaymentsPath,
    lotsPaymentsPath,
];
