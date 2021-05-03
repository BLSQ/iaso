export const menuItems = [
  {
    label: "iaso.forms.title",
    icon: "forms",
    subMenu: [
      {
        label: "iaso.label.list",
        // permission: paths.formsPath.permission,
        path: "/dashboard/forms/list",
        icon: "list",
      },

      {
        label: "iaso.label.dhis2Mappings",
        // permission: paths.mappingsPath.permission,
        path: "/dashboard/forms/mappings",
        icon: "mappings",
      },
      {
        label: "iaso.completeness.title",
        // permission: paths.completenessPath.permission,
        path: "/dashboard/forms/completeness",
        icon: "completeness",
      },
      {
        label: "iaso.archived.title",
        // permission: paths.archivedPath.permission,
        path: "/dashboard/forms/archived",
        icon: "archived",
      },
    ],
  },
  {
    label: "iaso.orgUnits.title",
    icon: "orgunits",

    subMenu: [
      {
        label: "iaso.label.list",
        // permission: paths.orgUnitsPath.permission,
        icon: "list",
      },
      {
        label: "iaso.label.groups",
        // permission: paths.groupsPath.permission,
        icon: "groups",
      },
      {
        label: "'iaso.orgUnits.orgUnitsTypes'",
        // permission: paths.orgUnitTypesPath.permission,
        icon: "types",
      },
      {
        label: "iaso.orgUnits.dataSources",
        icon: "sources",
        subMenu: [
          {
            label: "iaso.label.list",
            // permission: paths.dataSourcesPath.permission,
            icon: "list",
          },
          {
            label: "iaso.matching.title",
            icon: "links",
            subMenu: [
              {
                label: "iaso.label.list",
                // permission: paths.linksPath.permission,
                icon: "list",
              },
              {
                label: "iaso.label.algorithmsRuns",
                // permission: paths.algosPath.permission,
                icon: "runs",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    label: "iaso.label.config",
    icon: "settings",
    subMenu: [
      {
        label: "iaso.label.tasks",
        // permission: paths.tasksPath.permission,
        icon: "tasks",
      },
      {
        label: "iaso.label.monitoring",
        // permission: paths.devicesPath.permission,
        icon: "devices",
      },
      {
        label: "iaso.label.projects",
        // permission: paths.projectsPath.permission,
        icon: "projects",
      },
      {
        label: "iaso.label.users",
        // permission: paths.usersPath.permission,
        icon: "users",
      },
    ],
  },
];

export default menuItems;
