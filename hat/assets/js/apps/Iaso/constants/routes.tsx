import React, { ReactElement } from 'react';

const ApiImports = React.lazy(() =>
    import('Iaso/domains/apiimports').then(module => ({
        default: module.ApiImports,
    })),
);
const ValidateInstance = React.lazy(() =>
    import('Iaso/domains/instances/validate').then(module => ({
        default: module.ValidateInstance,
    })),
);
const MissionCreate = React.lazy(() =>
    import('Iaso/domains/missions/create').then(module => ({
        default: module.MissionCreate,
    })),
);
const MissionDetail = React.lazy(() =>
    import('Iaso/domains/missions/details').then(module => ({
        default: module.MissionDetail,
    })),
);
const MissionEdit = React.lazy(() =>
    import('Iaso/domains/missions/edit').then(module => ({
        default: module.MissionEdit,
    })),
);
const PipelineList = React.lazy(() =>
    import('Iaso/domains/openHexa').then(module => ({
        default: module.PipelineList,
    })),
);
const PipelineDetails = React.lazy(() =>
    import('Iaso/domains/openHexa/details').then(module => ({
        default: module.PipelineDetails,
    })),
);
const StockKeepingUnits = React.lazy(() =>
    import('Iaso/domains/stock').then(module => ({
        default: module.StockKeepingUnits,
    })),
);
const StockItems = React.lazy(() =>
    import('Iaso/domains/stock/items').then(module => ({
        default: module.StockItems,
    })),
);
const StockRulesVersions = React.lazy(() =>
    import('Iaso/domains/stock/versions').then(module => ({
        default: module.StockRulesVersions,
    })),
);
const UsersBulkCreate = React.lazy(() =>
    import('Iaso/domains/users/bulkCreate').then(module => ({
        default: module.UsersBulkCreate,
    })),
);
const ValidationWorkflowInstances = React.lazy(() =>
    import('Iaso/domains/validationWorkflowInstances').then(module => ({
        default: module.ValidationWorkflowInstances,
    })),
);
const ValidationWorkflowsConfiguration = React.lazy(() =>
    import('Iaso/domains/validationWorkflowsConfiguration').then(module => ({
        default: module.ValidationWorkflowsConfiguration,
    })),
);
const ValidationWorkflowConfigurationDetail = React.lazy(() =>
    import('Iaso/domains/validationWorkflowsConfiguration/details').then(
        module => ({ default: module.ValidationWorkflowConfigurationDetail }),
    ),
);
const PageError = React.lazy(() => import('../components/errors/PageError'));
const PageWorkInProgress = React.lazy(() =>
    import('../components/workInProgress/PageWorkInProgress').then(module => ({
        default: module.PageWorkInProgress,
    })),
);
const Accounts = React.lazy(() =>
    import('../domains/accounts').then(module => ({
        default: module.Accounts,
    })),
);
const AccountsDetails = React.lazy(() => import('../domains/accounts/details'));
const AccountsEdit = React.lazy(() =>
    import('../domains/accounts/edit').then(module => ({
        default: module.AccountsEdit,
    })),
);
const Runs = React.lazy(() =>
    import('../domains/algorithmRuns').then(module => ({
        default: module.Runs,
    })),
);
const Completeness = React.lazy(() => import('../domains/completeness'));
const CompletenessStats = React.lazy(() =>
    import('../domains/completenessStats').then(module => ({
        default: module.CompletenessStats,
    })),
);
const DataSources = React.lazy(() => import('../domains/dataSources'));
const DataSourceDetail = React.lazy(() =>
    import('../domains/dataSources/details').then(module => ({
        default: module.Details,
    })),
);
const Entities = React.lazy(() =>
    import('../domains/entities').then(module => ({
        default: module.Entities,
    })),
);
const EntityDetail = React.lazy(() =>
    import('../domains/entities/details').then(module => ({
        default: module.Details,
    })),
);
const DuplicateAnalyses = React.lazy(() =>
    import('../domains/entities/duplicate-analyses/DuplicateAnalyses').then(
        module => ({ default: module.DuplicateAnalyses }),
    ),
);
const DuplicateDetails = React.lazy(() =>
    import('../domains/entities/duplicates/details/DuplicateDetails').then(
        module => ({ default: module.DuplicateDetails }),
    ),
);
const Duplicates = React.lazy(() =>
    import('../domains/entities/duplicates/list/Duplicates').then(module => ({
        default: module.Duplicates,
    })),
);
const EntityTypes = React.lazy(() =>
    import('../domains/entities/entityTypes').then(module => ({
        default: module.EntityTypes,
    })),
);
const FormAI = React.lazy(() => import('../domains/formAI'));
const Forms = React.lazy(() => import('../domains/forms'));
const FormDetail = React.lazy(() => import('../domains/forms/detail'));
const FormsStats = React.lazy(() =>
    import('../domains/forms/stats').then(module => ({
        default: module.FormsStats,
    })),
);
const Welcome = React.lazy(() =>
    import('../domains/home/components/ExtraGrid/Welcome').then(module => ({
        default: module.Welcome,
    })),
);
const Instances = React.lazy(() => import('../domains/instances'));
const CompareSubmissions = React.lazy(() =>
    import('../domains/instances/compare').then(module => ({
        default: module.CompareSubmissions,
    })),
);
const CompareInstanceLogs = React.lazy(() =>
    import('../domains/instances/compare/components/CompareInstanceLogs').then(
        module => ({ default: module.CompareInstanceLogs }),
    ),
);
const InstanceDetail = React.lazy(() => import('../domains/instances/details'));
const Links = React.lazy(() =>
    import('../domains/links').then(module => ({ default: module.Links })),
);
const Mappings = React.lazy(() => import('../domains/mappings'));
const MappingDetails = React.lazy(() => import('../domains/mappings/details'));
const Missions = React.lazy(() =>
    import('../domains/missions').then(module => ({
        default: module.Missions,
    })),
);
const Modules = React.lazy(() =>
    import('../domains/modules').then(module => ({ default: module.Modules })),
);
const OrgUnits = React.lazy(() =>
    import('../domains/orgUnits').then(module => ({
        default: module.OrgUnits,
    })),
);
const OrgUnitChangeRequestConfigs = React.lazy(() =>
    import('../domains/orgUnits/configuration/OrgUnitChangeRequestConfigs').then(
        module => ({ default: module.OrgUnitChangeRequestConfigs }),
    ),
);
const OrgUnitDetail = React.lazy(() => import('../domains/orgUnits/details'));
const Groups = React.lazy(() => import('../domains/orgUnits/groups'));
const GroupSets = React.lazy(() => import('../domains/orgUnits/groupSets'));
const GroupSet = React.lazy(
    () => import('../domains/orgUnits/groupSets/GroupSet'),
);
const Types = React.lazy(() => import('../domains/orgUnits/orgUnitTypes'));
const ReviewOrgUnitChanges = React.lazy(() =>
    import('../domains/orgUnits/reviewChanges').then(module => ({
        default: module.ReviewOrgUnitChanges,
    })),
);
const ReviewOrgUnitChangesDetail = React.lazy(() =>
    import('../domains/orgUnits/reviewChanges/details').then(module => ({
        default: module.ReviewOrgUnitChangesDetail,
    })),
);
const Pages = React.lazy(() => import('../domains/pages'));
const LotsPayments = React.lazy(() =>
    import('../domains/payments/LotsPayments').then(module => ({
        default: module.LotsPayments,
    })),
);
const PotentialPayments = React.lazy(() =>
    import('../domains/payments/PotentialPayments').then(module => ({
        default: module.PotentialPayments,
    })),
);
const Planning = React.lazy(() =>
    import('../domains/plannings').then(module => ({
        default: module.Planning,
    })),
);
const Assignments = React.lazy(() =>
    import('../domains/plannings/assignments').then(module => ({
        default: module.Assignments,
    })),
);
const PlanningDetails = React.lazy(() =>
    import('../domains/plannings/details').then(module => ({
        default: module.Details,
    })),
);
const Projects = React.lazy(() =>
    import('../domains/projects').then(module => ({
        default: module.Projects,
    })),
);
const Promptness = React.lazy(() =>
    import('../domains/promptness').then(module => ({
        default: module.Promptness,
    })),
);
const Registry = React.lazy(() =>
    import('../domains/registry').then(module => ({
        default: module.Registry,
    })),
);
const SetupAccount = React.lazy(() =>
    import('../domains/setup').then(module => ({
        default: module.SetupAccount,
    })),
);
const Storages = React.lazy(() =>
    import('../domains/storages').then(module => ({
        default: module.Storages,
    })),
);
const StorageDetails = React.lazy(() =>
    import('../domains/storages/details').then(module => ({
        default: module.Details,
    })),
);
const Tasks = React.lazy(() => import('../domains/tasks'));
const Teams = React.lazy(() =>
    import('../domains/teams').then(module => ({ default: module.Teams })),
);
const UserRoles = React.lazy(() =>
    import('../domains/userRoles').then(module => ({
        default: module.UserRoles,
    })),
);
const Users = React.lazy(() =>
    import('../domains/users').then(module => ({ default: module.Users })),
);
const UserDetails = React.lazy(() =>
    import('../domains/users/details').then(module => ({
        default: module.Details,
    })),
);
const UsersHistory = React.lazy(() =>
    import('../domains/users/history/UsersHistory').then(module => ({
        default: module.UsersHistory,
    })),
);
const Workflows = React.lazy(() =>
    import('../domains/workflows').then(module => ({
        default: module.Workflows,
    })),
);
const WorkflowDetails = React.lazy(() =>
    import('../domains/workflows/details').then(module => ({
        default: module.Details,
    })),
);

import * as Permission from '../utils/permissions';
import { baseUrls } from './urls';

export type RoutePath = {
    baseUrl: string;
    routerUrl: string; // baseUrl+"/*", so we can catch the params
    permissions: string[]; // can be skipped if allowAnonymous === true
    element: ReactElement; // a prop-less Element (not a component)
    isRootUrl?: boolean;
    allowAnonymous?: boolean;
    featureFlag?: string;
    // Incomplete page: redirects to the work in progress page unless SHOW_DEV_FEATURES is active
    dev?: boolean;
    plannedRelease?: string;
};

export type AnonymousRoutePath = Omit<RoutePath, 'permissions'> & {
    allowAnonymous: true;
    useDashboard?: boolean;
};

export const setupAccountPath = {
    baseUrl: baseUrls.setupAccount,
    routerUrl: `${baseUrls.setupAccount}/*`,
    permissions: [],
    element: (
        <React.Suspense fallback={null}>
            <SetupAccount />
        </React.Suspense>
    ),
};
export const setupAccountSettingsPath = {
    baseUrl: baseUrls.setupAccountSettings,
    routerUrl: `${baseUrls.setupAccountSettings}/*`,
    permissions: [],
    element: (
        <React.Suspense fallback={null}>
            <SetupAccount />
        </React.Suspense>
    ),
};

export const formsPath = {
    baseUrl: baseUrls.forms,
    routerUrl: `${baseUrls.forms}/*`,
    permissions: [
        Permission.FORMS,
        Permission.SUBMISSIONS,
        Permission.SUBMISSIONS_UPDATE,
    ],
    element: (
        <React.Suspense fallback={null}>
            <Forms />
        </React.Suspense>
    ),
    isRootUrl: true,
};

export const formAIPath = {
    baseUrl: baseUrls.formAI,
    routerUrl: `${baseUrls.formAI}/*`,
    permissions: [Permission.FORMS],
    element: (
        <React.Suspense fallback={null}>
            <FormAI />
        </React.Suspense>
    ),
};

export const pagesPath = {
    baseUrl: baseUrls.pages,
    routerUrl: `${baseUrls.pages}/*`,
    permissions: [Permission.PAGES, Permission.PAGE_WRITE],
    element: (
        <React.Suspense fallback={null}>
            <Pages />
        </React.Suspense>
    ),
};

export const formDetailPath = {
    baseUrl: baseUrls.formDetail,
    routerUrl: `${baseUrls.formDetail}/*`,
    permissions: [
        Permission.FORMS,
        Permission.SUBMISSIONS,
        Permission.SUBMISSIONS_UPDATE,
    ],
    element: (
        <React.Suspense fallback={null}>
            <FormDetail />
        </React.Suspense>
    ),
};

export const formsStatsPath = {
    baseUrl: baseUrls.formsStats,
    routerUrl: `${baseUrls.formsStats}/*`,
    permissions: [Permission.FORMS_STATS],
    element: (
        <React.Suspense fallback={null}>
            <FormsStats />
        </React.Suspense>
    ),
};

export const instancesPath = {
    baseUrl: baseUrls.instances,
    routerUrl: `${baseUrls.instances}/*`,
    permissions: [Permission.SUBMISSIONS, Permission.SUBMISSIONS_UPDATE],
    element: (
        <React.Suspense fallback={null}>
            <Instances />
        </React.Suspense>
    ),
};

export const instanceDetailPath = {
    baseUrl: baseUrls.instanceDetail,
    routerUrl: `${baseUrls.instanceDetail}/*`,
    permissions: [Permission.SUBMISSIONS, Permission.SUBMISSIONS_UPDATE],
    element: (
        <React.Suspense fallback={null}>
            <InstanceDetail />
        </React.Suspense>
    ),
};

export const validateInstancePath = {
    baseUrl: baseUrls.instanceValidation,
    routerUrl: `${baseUrls.instanceValidation}/*`,
    permissions: [Permission.SUBMISSIONS, Permission.SUBMISSIONS_UPDATE], // TODO use correct perm
    element: (
        <React.Suspense fallback={null}>
            <ValidateInstance />
        </React.Suspense>
    ),
};
export const compareInstanceLogsPath = {
    baseUrl: baseUrls.compareInstanceLogs,
    routerUrl: `${baseUrls.compareInstanceLogs}/*`,
    permissions: [Permission.SUBMISSIONS, Permission.SUBMISSIONS_UPDATE],
    element: (
        <React.Suspense fallback={null}>
            <CompareInstanceLogs />
        </React.Suspense>
    ),
};

export const compareInstancesPath = {
    baseUrl: baseUrls.compareInstances,
    routerUrl: `${baseUrls.compareInstances}/*`,
    permissions: [Permission.SUBMISSIONS, Permission.SUBMISSIONS_UPDATE],
    element: (
        <React.Suspense fallback={null}>
            <CompareSubmissions />
        </React.Suspense>
    ),
};

export const mappingsPath = {
    baseUrl: baseUrls.mappings,
    routerUrl: `${baseUrls.mappings}/*`,
    permissions: [Permission.MAPPINGS],
    element: (
        <React.Suspense fallback={null}>
            <Mappings />
        </React.Suspense>
    ),
};

export const mappingDetailPath = {
    baseUrl: baseUrls.mappingDetail,
    routerUrl: `${baseUrls.mappingDetail}/*`,
    permissions: [Permission.MAPPINGS],
    element: (
        <React.Suspense fallback={null}>
            <MappingDetails />
        </React.Suspense>
    ),
};

export const orgUnitsPath = {
    baseUrl: baseUrls.orgUnits,
    routerUrl: `${baseUrls.orgUnits}/*`,
    permissions: [Permission.ORG_UNITS, Permission.ORG_UNITS_READ],
    element: (
        <React.Suspense fallback={null}>
            <OrgUnits />
        </React.Suspense>
    ),
};

export const orgUnitsDetailsPath = {
    baseUrl: baseUrls.orgUnitDetails,
    routerUrl: `${baseUrls.orgUnitDetails}/*`,
    permissions: [Permission.ORG_UNITS, Permission.ORG_UNITS_READ],
    element: (
        <React.Suspense fallback={null}>
            <OrgUnitDetail />
        </React.Suspense>
    ),
};

export const orgUnitChangeRequestPath = {
    baseUrl: baseUrls.orgUnitsChangeRequest,
    routerUrl: `${baseUrls.orgUnitsChangeRequest}/*`,
    permissions: [Permission.ORG_UNITS_CHANGE_REQUEST_REVIEW],
    element: (
        <React.Suspense fallback={null}>
            <ReviewOrgUnitChanges />
        </React.Suspense>
    ),
};

export const orgUnitChangeRequestDetailPath = {
    baseUrl: baseUrls.orgUnitsChangeRequestDetail,
    routerUrl: `${baseUrls.orgUnitsChangeRequestDetail}/*`,
    permissions: [Permission.ORG_UNITS_CHANGE_REQUEST_REVIEW],
    element: (
        <React.Suspense fallback={null}>
            <ReviewOrgUnitChangesDetail />
        </React.Suspense>
    ),
};

export const orgUnitsChangeRequestConfiguration = {
    baseUrl: baseUrls.orgUnitsChangeRequestConfiguration,
    routerUrl: `${baseUrls.orgUnitsChangeRequestConfiguration}/*`,
    permissions: [Permission.ORG_UNITS_CHANGE_REQUESTS_CONFIGURATION],
    element: (
        <React.Suspense fallback={null}>
            <OrgUnitChangeRequestConfigs />
        </React.Suspense>
    ),
};

export const registryPath = {
    baseUrl: baseUrls.registry,
    routerUrl: `${baseUrls.registry}/*`,
    permissions: [Permission.REGISTRY_READ, Permission.REGISTRY_WRITE],
    element: (
        <React.Suspense fallback={null}>
            <Registry />
        </React.Suspense>
    ),
};

export const linksPath = {
    baseUrl: baseUrls.links,
    routerUrl: `${baseUrls.links}/*`,
    permissions: [Permission.LINKS],
    element: (
        <React.Suspense fallback={null}>
            <Links />
        </React.Suspense>
    ),
};

export const algosPath = {
    baseUrl: baseUrls.algos,
    routerUrl: `${baseUrls.algos}/*`,
    permissions: [Permission.LINKS],
    element: (
        <React.Suspense fallback={null}>
            <Runs />
        </React.Suspense>
    ),
};

export const completenessPath = {
    baseUrl: baseUrls.completeness,
    routerUrl: `${baseUrls.completeness}/*`,
    permissions: [Permission.COMPLETENESS],
    element: (
        <React.Suspense fallback={null}>
            <Completeness />
        </React.Suspense>
    ),
};

export const completenessStatsPath = {
    baseUrl: baseUrls.completenessStats,
    routerUrl: `${baseUrls.completenessStats}/*`,
    permissions: [Permission.COMPLETENESS_STATS],
    element: (
        <React.Suspense fallback={null}>
            <CompletenessStats />
        </React.Suspense>
    ),
};

export const promptnessPath = {
    baseUrl: baseUrls.promptness,
    routerUrl: `${baseUrls.promptness}/*`,
    permissions: [Permission.COMPLETENESS_STATS],
    element: (
        <React.Suspense fallback={null}>
            <Promptness />
        </React.Suspense>
    ),
};

export const modulesPath = {
    baseUrl: baseUrls.modules,
    routerUrl: `${baseUrls.modules}/*`,
    permissions: [Permission.MODULES],
    element: (
        <React.Suspense fallback={null}>
            <Modules />
        </React.Suspense>
    ),
};

export const usersPath = {
    baseUrl: baseUrls.users,
    routerUrl: `${baseUrls.users}/*`,
    permissions: [Permission.USERS_ADMIN, Permission.USERS_MANAGEMENT],
    element: (
        <React.Suspense fallback={null}>
            <Users />
        </React.Suspense>
    ),
};

export const usersBulkCreate = {
    baseUrl: baseUrls.usersBulkCreate,
    routerUrl: `${baseUrls.usersBulkCreate}/*`,
    permissions: [Permission.USERS_ADMIN, Permission.USERS_MANAGEMENT],
    element: (
        <React.Suspense fallback={null}>
            <UsersBulkCreate />
        </React.Suspense>
    ),
};

export const userDetailsPath = {
    baseUrl: baseUrls.userDetails,
    routerUrl: `${baseUrls.userDetails}/*`,
    permissions: [Permission.USERS_ADMIN, Permission.USERS_MANAGEMENT],
    element: (
        <React.Suspense fallback={null}>
            <UserDetails />
        </React.Suspense>
    ),
};

export const usersHistoryPath = {
    baseUrl: baseUrls.usersHistory,
    routerUrl: `${baseUrls.usersHistory}/*`,
    permissions: [Permission.USERS_ADMIN],
    element: (
        <React.Suspense fallback={null}>
            <UsersHistory />
        </React.Suspense>
    ),
};

export const userRolesPath = {
    baseUrl: baseUrls.userRoles,
    routerUrl: `${baseUrls.userRoles}/*`,
    permissions: [Permission.USER_ROLES],
    element: (
        <React.Suspense fallback={null}>
            <UserRoles />
        </React.Suspense>
    ),
};

export const projectsPath = {
    baseUrl: baseUrls.projects,
    routerUrl: `${baseUrls.projects}/*`,
    permissions: [Permission.PROJECTS],
    element: (
        <React.Suspense fallback={null}>
            <Projects />
        </React.Suspense>
    ),
};

export const dataSourcesPath = {
    baseUrl: baseUrls.sources,
    routerUrl: `${baseUrls.sources}/*`,
    permissions: [Permission.SOURCES, Permission.SOURCE_WRITE],
    element: (
        <React.Suspense fallback={null}>
            <DataSources />
        </React.Suspense>
    ),
};

export const dataSourceDetailsPath = {
    baseUrl: baseUrls.sourceDetails,
    routerUrl: `${baseUrls.sourceDetails}/*`,
    permissions: [Permission.SOURCES, Permission.SOURCE_WRITE],
    element: (
        <React.Suspense fallback={null}>
            <DataSourceDetail />
        </React.Suspense>
    ),
};

export const tasksPath = {
    baseUrl: baseUrls.tasks,
    routerUrl: `${baseUrls.tasks}/*`,
    permissions: [Permission.DATA_TASKS],
    element: (
        <React.Suspense fallback={null}>
            <Tasks />
        </React.Suspense>
    ),
};

export const groupsPath = {
    baseUrl: baseUrls.groups,
    routerUrl: `${baseUrls.groups}/*`,
    permissions: [Permission.ORG_UNIT_GROUPS],
    element: (
        <React.Suspense fallback={null}>
            <Groups />
        </React.Suspense>
    ),
};

export const groupSetsPath = {
    baseUrl: baseUrls.groupSets,
    routerUrl: `${baseUrls.groupSets}/*`,
    permissions: [Permission.ORG_UNIT_GROUPS],
    element: (
        <React.Suspense fallback={null}>
            <GroupSets />
        </React.Suspense>
    ),
};

export const groupSetDetailPath = {
    baseUrl: baseUrls.groupSetDetail,
    routerUrl: `${baseUrls.groupSetDetail}/*`,
    permissions: [Permission.ORG_UNIT_GROUPS],
    element: (
        <React.Suspense fallback={null}>
            <GroupSet />
        </React.Suspense>
    ),
};

export const orgUnitTypesPath = {
    baseUrl: baseUrls.orgUnitTypes,
    routerUrl: `${baseUrls.orgUnitTypes}/*`,
    permissions: [Permission.ORG_UNIT_TYPES],
    element: (
        <React.Suspense fallback={null}>
            <Types />
        </React.Suspense>
    ),
};
export const entitiesPath = {
    baseUrl: baseUrls.entities,
    routerUrl: `${baseUrls.entities}/*`,
    permissions: [Permission.ENTITIES],
    element: (
        <React.Suspense fallback={null}>
            <Entities />
        </React.Suspense>
    ),
};
export const entityDetailsPath = {
    baseUrl: baseUrls.entityDetails,
    routerUrl: `${baseUrls.entityDetails}/*`,
    permissions: [Permission.ENTITIES],
    element: (
        <React.Suspense fallback={null}>
            <EntityDetail />
        </React.Suspense>
    ),
};

export const entityTypesPath = {
    baseUrl: baseUrls.entityTypes,
    routerUrl: `${baseUrls.entityTypes}/*`,
    permissions: [Permission.ENTITIES],
    element: (
        <React.Suspense fallback={null}>
            <EntityTypes />
        </React.Suspense>
    ),
};
export const entityDuplicatesPath = {
    baseUrl: baseUrls.entityDuplicates,
    routerUrl: `${baseUrls.entityDuplicates}/*`,
    permissions: [
        Permission.ENTITIES_DUPLICATE_READ,
        Permission.ENTITIES_DUPLICATE_WRITE,
    ],
    element: (
        <React.Suspense fallback={null}>
            <Duplicates />
        </React.Suspense>
    ),
};
export const entityDuplicateAnalysesPath = {
    baseUrl: baseUrls.entityDuplicateAnalyses,
    routerUrl: `${baseUrls.entityDuplicateAnalyses}/*`,
    permissions: [
        Permission.ENTITIES_DUPLICATE_READ,
        Permission.ENTITIES_DUPLICATE_WRITE,
    ],
    element: (
        <React.Suspense fallback={null}>
            <DuplicateAnalyses />
        </React.Suspense>
    ),
};
export const entityDuplicatesDetailsPath = {
    baseUrl: baseUrls.entityDuplicateDetails,
    routerUrl: `${baseUrls.entityDuplicateDetails}/*`,
    permissions: [
        Permission.ENTITIES_DUPLICATE_READ,
        Permission.ENTITIES_DUPLICATE_WRITE,
    ],
    element: (
        <React.Suspense fallback={null}>
            <DuplicateDetails />
        </React.Suspense>
    ),
};
export const planningPath = {
    baseUrl: baseUrls.planning,
    routerUrl: `${baseUrls.planning}/*`,
    // FIXME use planning permissions when they exist
    permissions: [Permission.PLANNING_READ, Permission.PLANNING_WRITE],
    element: (
        <React.Suspense fallback={null}>
            <Planning />
        </React.Suspense>
    ),
};
export const planningDetailsPath = {
    baseUrl: baseUrls.planningDetails,
    routerUrl: `${baseUrls.planningDetails}/*`,
    permissions: [Permission.PLANNING_READ, Permission.PLANNING_WRITE],
    element: (
        <React.Suspense fallback={null}>
            <PlanningDetails />
        </React.Suspense>
    ),
};
export const missionsPath = {
    baseUrl: baseUrls.missions,
    routerUrl: `${baseUrls.missions}/*`,
    permissions: [Permission.MISSION_READ],
    element: (
        <React.Suspense fallback={null}>
            <Missions />
        </React.Suspense>
    ),
};

export const missionsCreatePath = {
    baseUrl: baseUrls.missionsCreate,
    routerUrl: `${baseUrls.missionsCreate}/*`,
    permissions: [Permission.MISSION_READ, Permission.MISSION_WRITE],
    element: (
        <React.Suspense fallback={null}>
            <MissionCreate />
        </React.Suspense>
    ),
};

export const missionsDetailPath = {
    baseUrl: baseUrls.missionsDetails,
    routerUrl: `${baseUrls.missionsDetails}/*`,
    permissions: [Permission.MISSION_READ],
    element: (
        <React.Suspense fallback={null}>
            <MissionDetail />
        </React.Suspense>
    ),
};

export const missionsEditPath = {
    baseUrl: baseUrls.missionsEdit,
    routerUrl: `${baseUrls.missionsEdit}/*`,
    permissions: [Permission.MISSION_READ, Permission.MISSION_WRITE],
    element: (
        <React.Suspense fallback={null}>
            <MissionEdit />
        </React.Suspense>
    ),
};

export const assignmentsPath = {
    baseUrl: baseUrls.assignments,
    routerUrl: `${baseUrls.assignments}/*`,
    // FIXME use planning permissions when they exist
    permissions: [Permission.PLANNING_READ, Permission.PLANNING_WRITE],
    element: (
        <React.Suspense fallback={null}>
            <Assignments />
        </React.Suspense>
    ),
    dev: true,
};
export const teamsPath = {
    baseUrl: baseUrls.teams,
    routerUrl: `${baseUrls.teams}/*`,
    permissions: [Permission.TEAMS],
    element: (
        <React.Suspense fallback={null}>
            <Teams />
        </React.Suspense>
    ),
};
export const storagesPath = {
    baseUrl: baseUrls.storages,
    routerUrl: `${baseUrls.storages}/*`,
    permissions: [Permission.STORAGES],
    element: (
        <React.Suspense fallback={null}>
            <Storages />
        </React.Suspense>
    ),
};
export const storageDetailPath = {
    baseUrl: baseUrls.storageDetail,
    routerUrl: `${baseUrls.storageDetail}/*`,
    permissions: [Permission.STORAGES],
    element: (
        <React.Suspense fallback={null}>
            <StorageDetails />
        </React.Suspense>
    ),
};
export const workflowsPath = {
    baseUrl: baseUrls.workflows,
    routerUrl: `${baseUrls.workflows}/*`,
    permissions: [Permission.WORKFLOWS],
    element: (
        <React.Suspense fallback={null}>
            <Workflows />
        </React.Suspense>
    ),
};
export const workflowsDetailPath = {
    baseUrl: baseUrls.workflowDetail,
    routerUrl: `${baseUrls.workflowDetail}/*`,
    permissions: [Permission.WORKFLOWS],
    element: (
        <React.Suspense fallback={null}>
            <WorkflowDetails />
        </React.Suspense>
    ),
};
export const potentialPaymentsPath = {
    baseUrl: baseUrls.potentialPayments,
    routerUrl: `${baseUrls.potentialPayments}/*`,
    permissions: [Permission.PAYMENTS],
    element: (
        <React.Suspense fallback={null}>
            <PotentialPayments />
        </React.Suspense>
    ),
};
export const lotsPaymentsPath = {
    baseUrl: baseUrls.lotsPayments,
    routerUrl: `${baseUrls.lotsPayments}/*`,
    permissions: [Permission.PAYMENTS],
    element: (
        <React.Suspense fallback={null}>
            <LotsPayments />
        </React.Suspense>
    ),
};
export const stockKeepingUnitsPath = {
    baseUrl: baseUrls.stockKeepingUnits,
    routerUrl: `${baseUrls.stockKeepingUnits}/*`,
    permissions: [Permission.STOCK_MANAGEMENT],
    element: (
        <React.Suspense fallback={null}>
            <StockKeepingUnits />
        </React.Suspense>
    ),
};
export const stockRulesVersionsPath = {
    baseUrl: baseUrls.stockRulesVersions,
    routerUrl: `${baseUrls.stockRulesVersions}/*`,
    permissions: [Permission.STOCK_MANAGEMENT],
    element: (
        <React.Suspense fallback={null}>
            <StockRulesVersions />
        </React.Suspense>
    ),
};
export const stockItemsPath = {
    baseUrl: baseUrls.stockItems,
    routerUrl: `${baseUrls.stockItems}/*`,
    permissions: [Permission.STOCK_MANAGEMENT],
    element: (
        <React.Suspense fallback={null}>
            <StockItems />
        </React.Suspense>
    ),
};

export const validationWorkflowConfigurationPath = {
    baseUrl: baseUrls.validationWorkflowsConfiguration,
    routerUrl: `${baseUrls.validationWorkflowsConfiguration}/*`,
    permissions: [Permission.VALIDATION_WORKFLOWS],
    element: (
        <React.Suspense fallback={null}>
            <ValidationWorkflowsConfiguration />
        </React.Suspense>
    ),
};

export const validationWorkflowsConfigurationDetailPath = {
    baseUrl: baseUrls.validationWorkflowsConfigurationDetail,
    routerUrl: `${baseUrls.validationWorkflowsConfigurationDetail}/*`,
    permissions: [Permission.VALIDATION_WORKFLOWS],
    element: (
        <React.Suspense fallback={null}>
            <ValidationWorkflowConfigurationDetail />
        </React.Suspense>
    ),
};

export const validationWorkflowInstancesPath = {
    baseUrl: baseUrls.validationWorkflowInstances,
    routerUrl: `${baseUrls.validationWorkflowInstances}/*`,
    permissions: [Permission.SUBMISSIONS],
    element: (
        <React.Suspense fallback={null}>
            <ValidationWorkflowInstances />
        </React.Suspense>
    ),
};

export const pipelineListPath = {
    baseUrl: baseUrls.pipelineList,
    routerUrl: `${baseUrls.pipelineList}/*`,
    permissions: [Permission.PIPELINE_MANAGEMENT],
    element: (
        <React.Suspense fallback={null}>
            <PipelineList />
        </React.Suspense>
    ),
};
export const pipelineDetailsPath = {
    baseUrl: baseUrls.pipelineDetails,
    routerUrl: `${baseUrls.pipelineDetails}/*`,
    permissions: [Permission.PIPELINE_MANAGEMENT],
    element: (
        <React.Suspense fallback={null}>
            <PipelineDetails />
        </React.Suspense>
    ),
};
export const adminApiImportPath = {
    baseUrl: baseUrls.adminApiImport,
    routerUrl: `${baseUrls.adminApiImport}/*`,
    permissions: [Permission.ACCOUNT_MANAGEMENT],
    element: (
        <React.Suspense fallback={null}>
            <ApiImports />
        </React.Suspense>
    ),
};

export const accountsPath = {
    baseUrl: baseUrls.accounts,
    routerUrl: `${baseUrls.accounts}/*`,
    element: (
        <React.Suspense fallback={null}>
            <Accounts />
        </React.Suspense>
    ),
    permissions: [Permission.ACCOUNT_MANAGEMENT],
};

export const accountsDetailsPath = {
    baseUrl: baseUrls.accountsDetail,
    routerUrl: `${baseUrls.accountsDetail}/*`,
    element: (
        <React.Suspense fallback={null}>
            <AccountsDetails />
        </React.Suspense>
    ),
    permissions: [Permission.ACCOUNT_MANAGEMENT],
};

export const accountsEditPath = {
    baseUrl: baseUrls.accountsEdit,
    routerUrl: `${baseUrls.accountsEdit}/*`,
    element: (
        <React.Suspense fallback={null}>
            <AccountsEdit />
        </React.Suspense>
    ),
    permissions: [Permission.ACCOUNT_MANAGEMENT],
};

export const page401 = {
    baseUrl: baseUrls.error401,
    routerUrl: baseUrls.error401,
    element: (
        <React.Suspense fallback={null}>
            <PageError errorCode="401" />
        </React.Suspense>
    ),
    permissions: [],
};

export const bonusPath = {
    baseUrl: baseUrls.hidden,
    routerUrl: `${baseUrls.hidden}/*`,
    permissions: [...Object.values(Permission)],
    element: (
        <React.Suspense fallback={null}>
            <Welcome />
        </React.Suspense>
    ),
};

export const page403 = {
    baseUrl: baseUrls.error403,
    routerUrl: baseUrls.error403,
    element: (
        <React.Suspense fallback={null}>
            <PageError errorCode="403" />
        </React.Suspense>
    ),
    permissions: [],
};

export const page404 = {
    baseUrl: baseUrls.error404,
    routerUrl: baseUrls.error404,
    element: (
        <React.Suspense fallback={null}>
            <PageError errorCode="404" />
        </React.Suspense>
    ),
    permissions: [],
};

export const page500 = {
    baseUrl: baseUrls.error500,
    routerUrl: baseUrls.error500,
    element: (
        <React.Suspense fallback={null}>
            <PageError errorCode="500" />
        </React.Suspense>
    ),
    permissions: [],
};

export const workInProgressPath = {
    baseUrl: baseUrls.workInProgress,
    routerUrl: `${baseUrls.workInProgress}/*`,
    element: (
        <React.Suspense fallback={null}>
            <PageWorkInProgress />
        </React.Suspense>
    ),
    permissions: [],
};

export const routeConfigs: (RoutePath | AnonymousRoutePath)[] = [
    formsPath,
    formAIPath,
    formDetailPath,
    formsStatsPath,
    mappingsPath,
    mappingDetailPath,
    instancesPath,
    instanceDetailPath,
    validateInstancePath,
    compareInstanceLogsPath,
    compareInstancesPath,
    orgUnitsPath,
    orgUnitsDetailsPath,
    linksPath,
    algosPath,
    completenessPath,
    completenessStatsPath,
    promptnessPath,
    usersPath,
    userDetailsPath,
    usersHistoryPath,
    userRolesPath,
    usersBulkCreate,
    projectsPath,
    dataSourcesPath,
    dataSourceDetailsPath,
    tasksPath,
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
    workInProgressPath,
    teamsPath,
    planningPath,
    planningDetailsPath,
    missionsPath,
    missionsCreatePath,
    missionsDetailPath,
    missionsEditPath,
    assignmentsPath,
    entitiesPath,
    entityDetailsPath,
    entityDuplicatesPath,
    entityDuplicatesDetailsPath,
    entityDuplicateAnalysesPath,
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
    stockKeepingUnitsPath,
    stockRulesVersionsPath,
    stockItemsPath,
    bonusPath,
    pipelineDetailsPath,
    pipelineListPath,
    adminApiImportPath,
    validationWorkflowConfigurationPath,
    validationWorkflowsConfigurationDetailPath,
    validationWorkflowInstancesPath,
    accountsPath,
    accountsDetailsPath,
    accountsEditPath,
];
