/* eslint-disable max-len */
import { defineMessages } from 'react-intl';

// List of translations for Iaso permissions used all along the project

const PERMISSIONS_MESSAGES = defineMessages({
    iaso_completeness: {
        id: 'iaso.permissions.completeness',
        defaultMessage: 'Export completeness',
    },
    iaso_completeness_tooltip: {
        id: 'iaso.permissions.tooltip.completeness',
        defaultMessage:
            'Monitor per period how many forms are ready/have errors/are exported',
    },
    iaso_mappings: {
        id: 'iaso.permissions.mappings',
        defaultMessage: 'DHIS2 mappings',
    },
    iaso_mappings_tooltip: {
        id: 'iaso.permissions.tooltip.mappings',
        defaultMessage: 'Match DHIS2 and IASO data elements for data exchanges',
    },
    iaso_polio: {
        id: 'iaso.permissions.polio',
        defaultMessage: 'Polio campaigns management - User',
    },
    iaso_polio_tooltip: {
        id: 'iaso.permissions.tooltip.polio',
        defaultMessage:
            'Manage Polio campaigns data entry, grouped campaigns, SIA calendar, LQAS/IM results',
    },
    iaso_polio_budget: {
        id: 'iaso.permissions.polio_budget',
        defaultMessage: 'Polio budget - User',
    },
    iaso_polio_budget_tooltip: {
        id: 'iaso.permissions.tooltip.polio_budget',
        defaultMessage:
            'View budget approval process and take action as defined by your role in the process',
    },
    iaso_polio_budget_admin: {
        id: 'iaso.permissions.polio_budget_admin',
        defaultMessage: 'Polio budget - Admin',
    },
    iaso_polio_budget_admin_tooltip: {
        id: 'iaso.permissions.tooltip.polio_budget_admin',
        defaultMessage:
            'View budget approval process and take action as defined by your role in the process. Extra admin powers: Override any step in the process if needed.',
    },
    iaso_polio_config: {
        id: 'iaso.permissions.polio_config',
        defaultMessage: 'Polio campaigns management - Admin',
    },
    iaso_polio_config_tooltip: {
        id: 'iaso.permissions.tooltip.polio_config',
        defaultMessage:
            'Manage Polio campaigns data entry, grouped campaigns, SIA calendar, LQAS/IM results. Extra admin powers: test campaigns, debug information LQAS/IM, Country configuration page (weekly email alerts recipients, language per country and budget teams management)',
    },
    iaso_links: {
        id: 'iaso.permissions.links',
        defaultMessage: 'Geo data sources matching',
    },
    iaso_links_tooltip: {
        id: 'iaso.permissions.tooltip.links',
        defaultMessage:
            'Match multiple geo data sources according to specific criteria and algorithms',
    },
    iaso_forms: {
        id: 'iaso.permissions.forms',
        defaultMessage: 'Forms management',
    },
    iaso_forms_tooltip: {
        id: 'iaso.permissions.tooltip.forms',
        defaultMessage:
            'XLS forms management: create or edit form(s) (version, manage period, link to Project(s)/Org unit type(s))',
    },
    iaso_pages: {
        id: 'iaso.permissions.pages',
        defaultMessage: 'Web pages management',
    },
    iaso_pages_tooltip: {
        id: 'iaso.permissions.tooltip.pages',
        defaultMessage: 'List of external links (dashboards for instance)',
    },
    iaso_projects_tooltip: {
        id: 'iaso.permissions.tooltip.projects',
        defaultMessage:
            'Manage one or multiple Projects (sub-part of Forms, Org Units, entity types). One Project is linked to one IASO Mobile App configuration, so to one App ID. You can edit Project(s) name, IDs, feature flags',
    },
    iaso_projects: {
        id: 'iaso.permissions.projects',
        defaultMessage: 'Projects',
    },

    iaso_sources: {
        id: 'iaso.permissions.sources',
        defaultMessage: 'Geo data sources - Read only',
    },
    iaso_sources_tooltip: {
        id: 'iaso.permissions.tooltip.sources',
        defaultMessage: 'View available geo data sources',
    },
    iaso_data_tasks: {
        id: 'iaso.permissions.dataTasks',
        defaultMessage: 'Batch monitoring',
    },
    iaso_data_tasks_tooltip: {
        id: 'iaso.permissions.tooltip.dataTasks',
        defaultMessage:
            'Monitor long-running tasks (eg, import or manage data in the platform)',
    },
    iaso_org_units: {
        id: 'iaso.permissions.orgUnits',
        defaultMessage: 'Organisation units management',
    },
    iaso_org_units_tooltip: {
        id: 'iaso.permissions.tooltip.orgUnits',
        defaultMessage:
            'Manage organisation units and pyramids, including uploading of geo data (GPS coordinates and shapes), and groups',
    },
    iaso_submissions: {
        id: 'iaso.permissions.submissions',
        defaultMessage: 'Submissions - Read only',
    },
    iaso_submissions_tooltip: {
        id: 'iaso.permissions.tooltip.submissions',
        defaultMessage: 'View the forms submissions',
    },
    iaso_user_roles: {
        id: 'iaso.permissions.userRoles',
        defaultMessage: 'User roles',
    },
    iaso_user_roles_tooltip: {
        id: 'iaso.permissions.tooltip.userRoles',
        defaultMessage:
            'Manage user roles: create or edit user roles (name, permissions associated)',
    },
    iaso_update_submission: {
        id: 'iaso.permissions.update_submission',
        defaultMessage: 'Submissions - Read and Write',
    },
    iaso_update_submission_tooltip: {
        id: 'iaso.permissions.tooltip.update_submission',
        defaultMessage: 'View and edit the forms submissions',
    },

    iaso_users: {
        id: 'iaso.permissions.users',
        defaultMessage: 'User management - Admin',
    },
    iaso_users_tooltip: {
        id: 'iaso.permissions.tooltip.users',
        defaultMessage:
            'Manage users of the account: create or edit users (user name, email, password, permissions/location/language/project/user role)',
    },
    iaso_teams: {
        id: 'iaso.permissions.teams',
        defaultMessage: 'Teams management',
    },
    iaso_teams_tooltip: {
        id: 'iaso.permissions.tooltip.teams',
        defaultMessage:
            'Manage teams: create or edit "team of users" or "teams of teams" (name, project, type, description, parent team)',
    },
    iaso_planning: {
        id: 'iaso.permissions.planning',
        defaultMessage: 'Planning',
    },
    iaso_assignments: {
        id: 'iaso.permissions.assignments',
        defaultMessage: 'Attributions',
    },
    iaso_assignments_tooltip: {
        id: 'iaso.permissions.tooltip.assignments',
        defaultMessage:
            'Assign tasks to specific users/teams via the Planning interface',
    },
    iaso_completeness_stats: {
        id: 'iaso.permissions.completeness_stats',
        defaultMessage: 'Completeness statistics',
    },
    iaso_completeness_stats_tooltip: {
        id: 'iaso.permissions.tooltip.completeness_stats',
        defaultMessage:
            'Monitor data collection completeness aggregated per form with drilldown to lower org unit levels',
    },
    iaso_storages: {
        id: 'iaso.label.storages',
        defaultMessage: 'External storage',
    },
    iaso_storages_tooltip: {
        defaultMessage: 'NFC cards data management',
        id: 'iaso.label.tooltip.storages',
    },
    iaso_entities: {
        id: 'iaso.permissions.entities',
        defaultMessage: 'Entities',
    },
    iaso_entities_tooltip: {
        id: 'iaso.permissions.tooltip.entities',
        defaultMessage:
            'Manage entities - An entity is an item that is not attached to one fixed place in the pyramid (it can be individual people, or any item that are being moved from an org unit to another)',
    },
    iaso_entity_type_write: {
        id: 'iaso.permissions.iaso_entity_type_write',
        defaultMessage: 'Entity types',
    },
    iaso_entity_type_write_tooltip: {
        id: 'iaso.permissions.tooltip.iaso_entity_type_write',
        defaultMessage:
            'Manage entity types and workflows associated. Entity types can be "Beneficiaries", "Mosquito nets", "Medicines" etc.',
    },
    iaso_dhis2_link: {
        id: 'iaso.permissions.iaso_dhis2_link',
        defaultMessage: 'Link with DHIS2',
    },
    iaso_workflows: {
        id: 'iaso.permissions.iaso_workflows',
        defaultMessage: 'Workflows',
    },
    iaso_entity_duplicates_read: {
        id: 'iaso.permissions.iaso_entity_duplicates_read',
        defaultMessage: 'Entity duplicates - Read only',
    },
    iaso_entity_duplicates_read_tooltip: {
        id: 'iaso.permissions.tooltip.iaso_entity_duplicates_read',
        defaultMessage:
            'View entity duplicates, without the possibility to merge them',
    },
    iaso_entity_duplicates_write: {
        id: 'iaso.permissions.iaso_entity_duplicates_write',
        defaultMessage: 'Entity duplicates - Read and Write',
    },
    iaso_entity_duplicates_write_tooltip: {
        id: 'iaso.permissions.tooltip.iaso_entity_duplicates_write',
        defaultMessage:
            'View and edit the entity duplicates - e.g. decide to merge or not similar entities',
    },
    iaso_registry: {
        id: 'iaso.permissions.iaso_registry',
        defaultMessage: 'Registry',
    },
    iaso_registry_tooltip: {
        id: 'iaso.permissions.tooltip.iaso_registry',
        defaultMessage: 'Summary view of data collected per organisation unit',
    },
    iaso_org_unit_types: {
        id: 'iaso.permissions.iaso_org_unit_types',
        defaultMessage: 'Organisation unit types management',
    },
    iaso_org_unit_types_tooltip: {
        id: 'iaso.permissions.tooltip.iaso_org_unit_types',
        defaultMessage:
            'Manage types of organisation units, i.e. define the different levels of the pyramid (eg Country/Region/District/Facility/etc)',
    },
    iaso_org_unit_groups: {
        id: 'iaso.permissions.iaso_org_unit_groups',
        defaultMessage: 'Organisation unit groups management',
    },
    iaso_reports: {
        id: 'iaso.permission.reports',
        defaultMessage: 'Devices',
    },
    iaso_reports_tooltip: {
        id: 'iaso.permission.tooltip.reports',
        defaultMessage:
            'Monitor devices linked to the instance (synchronisation, owner, etc.)',
    },
    iaso_users_managed: {
        id: 'iaso.permissions.users_management',
        defaultMessage: 'User management - Geo limited',
    },
    iaso_users_managed_tooltip: {
        id: 'iaso.permissions.tooltip.users_management',
        defaultMessage:
            'Manage users of the instance: create or edit users (user name, email, password, permissions/location/language/project/user role). Edition rights limited to the users linked to the children org units of the current user.',
    },
    iaso_page_write: {
        id: 'iaso.permissions.iaso_page_write',
        defaultMessage: 'Web pages management - Read and Write',
    },
    iaso_write_sources: {
        id: 'iaso.permissions.iaso_write_sources',
        defaultMessage: 'Geo data sources - Read and Write',
    },
    iaso_write_sources_tooltip: {
        id: 'iaso.permissions.tooltip.iaso_write_sources',
        defaultMessage:
            'Manage multiple geo data sources: create or edit sources (name, description, project(s), default version, DHIS2 links)',
    },
    iaso_polio_vaccine_authorizations_admin: {
        id: 'iaso.permissions.polio_vaccine_authorizations_admin',
        defaultMessage: 'Polio Vaccine Authorizations: Admin',
    },
    iaso_polio_vaccine_authorizations_read_only: {
        id: 'iaso.permissions.polio_vaccine_authorizations_read_only',
        defaultMessage: 'Polio Vaccine Authorizations: Read Only',
    },
});

export default PERMISSIONS_MESSAGES;
