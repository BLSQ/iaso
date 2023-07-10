import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    title: {
        defaultMessage: 'User roles',
        id: 'iaso.userRoles.title',
    },
    search: {
        defaultMessage: 'Search',
        id: 'iaso.search',
    },
    name: {
        defaultMessage: 'Name',
        id: 'iaso.label.name',
    },
    created_at: {
        defaultMessage: 'Created',
        id: 'iaso.label.created_at',
    },
    updated_at: {
        defaultMessage: 'Updated',
        id: 'iaso.label.updated_at',
    },
    actions: {
        defaultMessage: 'Action(s)',
        id: 'iaso.label.actions',
    },
    delete: {
        id: 'iaso.userRoles.delete',
        defaultMessage: 'Are you sure you want to delete this user role?',
    },
    deleteError: {
        id: 'iaso.snackBar.deleteUserRoleError',
        defaultMessage: 'An error occurred while deleting user role',
    },
    deleteSuccess: {
        id: 'iaso.snackBar.delete_successful',
        defaultMessage: 'Deleted successfully',
    },
    edit: {
        id: 'iaso.label.edit',
        defaultMessage: 'Edit',
    },
    editUserRole: {
        id: 'iaso.userRoles.edit',
        defaultMessage: 'Edit user role',
    },
    createUserRole: {
        id: 'iaso.userRoles.create',
        defaultMessage: 'Create user role',
    },
    cancel: {
        id: 'iaso.label.cancel',
        defaultMessage: 'Cancel',
    },
    save: {
        id: 'iaso.label.save',
        defaultMessage: 'Save',
    },
    fetchPermissionsError: {
        defaultMessage: 'An error occurred while fetching permissions list',
        id: 'iaso.snackBar.fetchPermissions',
    },
    iaso_completeness: {
        id: 'iaso.permissions.completeness',
        defaultMessage: 'Data completeness',
    },
    iaso_mappings: {
        id: 'iaso.permissions.mappings',
        defaultMessage: 'Mappings with DHIS2',
    },
    iaso_polio: {
        id: 'iaso.permissions.polio',
        defaultMessage: 'Polio campaign management',
    },
    iaso_polio_budget: {
        id: 'iaso.permissions.polio_budget',
        defaultMessage: 'Polio budget validation',
    },
    iaso_polio_budget_admin: {
        id: 'iaso.permissions.polio_budget_admin',
        defaultMessage: 'Polio budget admin',
    },
    iaso_polio_config: {
        id: 'iaso.permissions.polio_config',
        defaultMessage: 'Polio campaign admin',
    },
    iaso_links: {
        id: 'iaso.permissions.links',
        defaultMessage: 'Sources matching',
    },
    iaso_forms: { id: 'iaso.permissions.forms', defaultMessage: 'Forms' },
    iaso_pages: { id: 'iaso.permissions.pages', defaultMessage: 'Pages' },
    iaso_projects: {
        id: 'iaso.permissions.projects',
        defaultMessage: 'Projects',
    },
    iaso_sources: { id: 'iaso.permissions.sources', defaultMessage: 'Sources' },
    iaso_data_tasks: {
        id: 'iaso.permissions.dataTasks',
        defaultMessage: 'Tasks',
    },
    iaso_org_units: {
        id: 'iaso.permissions.orgUnits',
        defaultMessage: 'Organisation units',
    },
    iaso_submissions: {
        id: 'iaso.permissions.submissions',
        defaultMessage: 'Form Submissions',
    },
    iaso_user_roles: {
        id: 'iaso.permissions.userRoles',
        defaultMessage: 'User roles',
    },
    iaso_update_submission: {
        id: 'iaso.permissions.update_submission',
        defaultMessage: 'Update Submissions',
    },
    iaso_users: {
        id: 'iaso.permissions.users',
        defaultMessage: 'Users',
    },
    iaso_teams: {
        id: 'iaso.permissions.teams',
        defaultMessage: 'Teams',
    },
    iaso_planning: {
        id: 'iaso.permissions.planning',
        defaultMessage: 'Planning',
    },
    iaso_assignments: {
        id: 'iaso.permissions.assignments',
        defaultMessage: 'Assignments',
    },
    iaso_completeness_stats: {
        id: 'iaso.permissions.completeness_stats',
        defaultMessage: 'Completeness stats',
    },
    iaso_storages: {
        id: 'iaso.label.storages',
        defaultMessage: 'Storages',
    },
    iaso_entities: {
        id: 'iaso.permissions.entities',
        defaultMessage: 'Beneficiaries',
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
        defaultMessage: 'See entity duplicates',
    },
    iaso_entity_duplicates_write: {
        id: 'iaso.permissions.iaso_entity_duplicates_write',
        defaultMessage: 'Edit entity duplicates',
    },
    iaso_registry: {
        id: 'iaso.permissions.iaso_registry',
        defaultMessage: 'Registry',
    },
    iaso_org_unit_types: {
        id: 'iaso.permissions.iaso_org_unit_types',
        defaultMessage: 'Org unit types',
    },
    iaso_org_unit_groups: {
        id: 'iaso.permissions.iaso_org_unit_groups',
        defaultMessage: 'Org unit groups',
    },
    iaso_reports: {
        id: 'iaso.permission.reports',
        defaultMessage: 'Reports',
    },
    iaso_page_write: {
        id: 'iaso.permissions.iaso_page_write',
        defaultMessage: 'Edit page',
    },
});

export default MESSAGES;
