import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    users: {
        defaultMessage: 'Users',
        id: 'iaso.label.users',
    },
    create: {
        defaultMessage: 'Create user',
        id: 'iaso.users.create',
    },
    userName: {
        defaultMessage: 'User name',
        id: 'iaso.label.userName',
    },
    firstName: {
        defaultMessage: 'First name',
        id: 'iaso.label.firstName',
    },
    lastName: {
        defaultMessage: 'Last name',
        id: 'iaso.label.lastName',
    },
    email: {
        defaultMessage: 'Email',
        id: 'iaso.label.email',
    },
    newPassword: {
        defaultMessage: 'New password',
        id: 'iaso.users.newPassword',
    },
    password: {
        defaultMessage: 'Password',
        id: 'iaso.users.password',
    },
    permissions: {
        defaultMessage: 'Permissions',
        id: 'iaso.users.permissions',
    },
    orgUnitTypesDropdown: {
        defaultMessage: 'Org Unit Types',
        id: 'iaso.datasources.label.orgUnitTypes',
    },
    isSuperUser: {
        defaultMessage: 'User is a super admin and has all rights',
        id: 'iaso.users.isSuperUser',
    },
    search: {
        defaultMessage: 'Search',
        id: 'iaso.search',
    },
    infos: {
        defaultMessage: 'Infos',
        id: 'iaso.orgUnits.infos',
    },
    location: {
        defaultMessage: 'location',
        id: 'iaso.map.location',
    },
    cancel: {
        id: 'iaso.label.cancel',
        defaultMessage: 'Cancel',
    },
    save: {
        id: 'iaso.label.save',
        defaultMessage: 'Save',
    },
    selectedOrgUnits: {
        id: 'iaso.users.selectedOrgUnits',
        defaultMessage: 'Org units selected',
    },
    actions: {
        defaultMessage: 'Action(s)',
        id: 'iaso.label.actions',
    },
    edit: {
        defaultMessage: 'Edit',
        id: 'iaso.label.edit',
    },
    updateUser: {
        defaultMessage: 'Update user',
        id: 'iaso.users.update',
    },
    deleteUserTitle: {
        id: 'iaso.users.dialog.deleteUserTitle',
        defaultMessage: 'Are you sure you want to delete this user?',
    },
    deleteUserText: {
        id: 'iaso.users.dialog.deleteUserText',
        defaultMessage: 'This operation cannot be undone.',
    },
    addOrgUnit: {
        defaultMessage: 'Search org unit to add',
        id: 'iaso.orgUnits.add',
    },
    orgUnitsType: {
        id: 'iaso.orgUnits.type',
        defaultMessage: 'Org Unit type',
    },
    locale: {
        defaultMessage: 'Language',
        id: 'iaso.users.dialog.locale',
    },
    searchUser: {
        id: 'iaso.users.filter.searchUser',
        defaultMessage: 'Search user',
    },
    chooseLocation: {
        id: 'iaso.users.dialog.chooseLocation',
        defaultMessage: 'Select location(s)',
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
    iaso_reports: {
        id: 'iaso.permission.reports',
        defaultMessage: 'Reports',
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
    deleteError: {
        id: 'iaso.snackBar.deleteUserError',
        defaultMessage: 'An error occurred while deleting user profile',
    },
    deleteSuccess: {
        id: 'iaso.snackBar.delete_successful',
        defaultMessage: 'Deleted successfully',
    },
    dhis2_id: {
        id: 'iaso.label.dhis2Id',
        defaultMessage: 'DHIS2 id',
    },
    sentEmailInvitation: {
        id: 'iaso.label.sentEmailInvitation',
        defaultMessage: 'Send an invitation email',
    },
    sentEmailInvitationWhenAdresseExist: {
        id: 'iaso.label.sentEmailInvitationWhenAdresseExist',
        defaultMessage:
            'Enter email address before sending an invitation email',
    },
    fetchPermissionsError: {
        defaultMessage: 'An error occurred while fetching permissions list',
        id: 'iaso.snackBar.fetchPermissions',
    },
    homePage: {
        defaultMessage: 'Home page',
        id: 'iaso.users.label.homePage',
    },
    ouChildrenCheckbox: {
        defaultMessage: 'Users with access to children org unit',
        id: 'iaso.users.ouChildrenCheckbox',
    },
    ouParentCheckbox: {
        defaultMessage: 'Users with access to parent org unit',
        id: 'iaso.users.ouParentCheckbox',
    },
    logout: {
        defaultMessage: 'Logout',
        id: 'iaso.logout',
    },
    wrongAccount: {
        defaultMessage:
            'You are connected to the wrong account, would you like to log out and connect with the correct account to see this link?',
        id: 'iaso.label.wrongAccount',
    },
    wrongAccountTitle: {
        defaultMessage: 'Wrong account',
        id: 'iaso.label.wrongAccountTitle',
    },
    createUsersFromFile: {
        id: 'iaso.user.label.createUsersFromFile',
        defaultMessage: 'Create users from file',
    },
    createFromFile: {
        id: 'iaso.user.label.createFromFile',
        defaultMessage: 'Create from file',
    },
    downloadTemplate: {
        id: 'iaso.user.label.downloadTemplate',
        defaultMessage: 'Download template',
    },
    selectCsvFile: {
        id: 'iaso.user.label.selectCsvFile',
        defaultMessage: 'Select CSV file',
    },
    uploadError: {
        id: 'iaso.user.label.uploadError',
        defaultMessage: 'Error uploading file',
    },
    uploadSuccess: {
        id: 'iaso.user.label.uploadSuccess',
        defaultMessage: 'Users created from CSV',
    },
    backendIsBusy: {
        id: 'iaso.user.label.backendIsBusy',
        defaultMessage: 'The server is already processing another request',
    },
    confirm: {
        id: 'iaso.mappings.confirm',
        defaultMessage: 'Confirm',
    },
    fieldRequired: {
        id: 'iaso.forms.error.fieldRequired',
        defaultMessage: 'This field is required',
    },
    close: {
        id: 'iaso.label.close',
        defaultMessage: 'Close',
    },
    noTypeAssigned: {
        id: 'iaso.users.label.noTypeAssigned',
        defaultMessage: 'No org unit type assigned',
    },
});

export default MESSAGES;
