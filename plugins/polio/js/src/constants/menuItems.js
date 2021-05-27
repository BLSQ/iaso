import MESSAGES from './messages';

export const menuItems = [
    {
        label: MESSAGES.formsTitle,
        icon: 'forms',
        subMenu: [
            {
                label: MESSAGES.list,
                // permission: paths.formsPath.permission,
                path: '/dashboard/forms/list',
                icon: 'list',
            },

            {
                label: MESSAGES.dhis2Mappings,
                // permission: paths.mappingsPath.permission,
                path: '/dashboard/forms/mappings',
                icon: 'mappings',
            },
            {
                label: MESSAGES.completeness,
                // permission: paths.completenessPath.permission,
                path: '/dashboard/forms/completeness',
                icon: 'completeness',
            },
            {
                label: MESSAGES.archived,
                // permission: paths.archivedPath.permission,
                path: '/dashboard/forms/archived',
                icon: 'archived',
            },
        ],
    },
    {
        label: MESSAGES.orgUnitsTitle,
        icon: 'orgunits',

        subMenu: [
            {
                label: MESSAGES.list,
                // permission: paths.orgUnitsPath.permission,
                path: '/dashboard/orgunits/list',
                icon: 'list',
            },
            {
                label: MESSAGES.groups,
                // permission: paths.groupsPath.permission,
                path: '/dashboard/orgunits/groups',
                icon: 'groups',
            },
            {
                label: MESSAGES.orgUnitType,
                // permission: paths.orgUnitTypesPath.permission,
                path: '/dashboard/orgunits/types',
                icon: 'types',
            },
            {
                label: MESSAGES.dataSources,
                icon: 'sources',
                subMenu: [
                    {
                        label: MESSAGES.list,
                        // permission: paths.dataSourcesPath.permission,
                        path: '/dashboard/orgunits/sources/list',
                        icon: 'list',
                    },
                    {
                        label: MESSAGES.matching,
                        icon: 'links',
                        subMenu: [
                            {
                                label: MESSAGES.list,
                                // permission: paths.linksPath.permission,
                                path: '/dashboard/orgunits/sources/list',
                                icon: 'list',
                            },
                            {
                                label: MESSAGES.algorithmsRuns,
                                // permission: paths.algosPath.permission,
                                path: '/dashboard/orgunits/sources/links/runs',
                                icon: 'runs',
                            },
                        ],
                    },
                ],
            },
        ],
    },
    {
        label: MESSAGES.config,
        icon: 'settings',
        subMenu: [
            {
                label: MESSAGES.tasks,
                // permission: paths.tasksPath.permission,
                path: '/dashboard/settings/tasks',
                icon: 'tasks',
            },
            {
                label: MESSAGES.monitoring,
                // permission: paths.devicesPath.permission,
                path: '/dashboard/settings/devices',
                icon: 'devices',
            },
            {
                label: MESSAGES.projects,
                // permission: paths.projectsPath.permission,
                path: '/dashboard/settings/projects',
                icon: 'projects',
            },
            {
                label: MESSAGES.users,
                // permission: paths.usersPath.permission,
                path: '/dashboard/settings/users',
                icon: 'users',
            },
        ],
    },
    {
        label: MESSAGES.polio,
        key: 'polio',
        icon: 'forms',
        subMenu: [
            {
                label: MESSAGES.dashboard,
                path: '/dashboard/polio/list',
                key: 'list',
                // permission: paths.formsPath.permission,
                icon: 'list',
            },
        ],
    },
];

export default menuItems;
