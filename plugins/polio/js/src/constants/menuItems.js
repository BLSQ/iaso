import MESSAGES from "./messages"

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
                icon: 'list',
            },
            {
                label: MESSAGES.groups,
                // permission: paths.groupsPath.permission,
                icon: 'groups',
            },
            {
                label: MESSAGES.orgUnitType,
                // permission: paths.orgUnitTypesPath.permission,
                icon: 'types',
            },
            {
                label: MESSAGES.dataSources,
                icon: 'sources',
                subMenu: [
                    {
                        label: MESSAGES.list,
                        // permission: paths.dataSourcesPath.permission,
                        icon: 'list',
                    },
                    {
                        label: MESSAGES.matching,
                        icon: 'links',
                        subMenu: [
                            {
                                label: MESSAGES.list,
                                // permission: paths.linksPath.permission,
                                icon: 'list',
                            },
                            {
                                label: MESSAGES.algorithmsRuns,
                                // permission: paths.algosPath.permission,
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
                icon: 'tasks',
            },
            {
                label: MESSAGES.monitoring,
                // permission: paths.devicesPath.permission,
                icon: 'devices',
            },
            {
                label: MESSAGES.projects,
                // permission: paths.projectsPath.permission,
                icon: 'projects',
            },
            {
                label: MESSAGES.users,
                // permission: paths.usersPath.permission,
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
                key: 'polio_dashboard',
                // permission: paths.formsPath.permission,
                icon: 'list',
            },
        ]
    }
];

export default menuItems;
