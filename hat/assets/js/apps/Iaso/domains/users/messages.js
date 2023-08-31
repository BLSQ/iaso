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
        defaultMessage: 'Location',
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
        id: 'iaso.label.orgUnitsType',
        defaultMessage: 'Org unit type',
    },
    locale: {
        defaultMessage: 'Language',
        id: 'iaso.users.dialog.locale',
    },
    userRoles: {
        defaultMessage: 'User roles',
        id: 'iaso.users.dialog.userRoles',
    },
    searchUser: {
        id: 'iaso.users.filter.searchUser',
        defaultMessage: 'Search user',
    },
    chooseLocation: {
        id: 'iaso.users.dialog.chooseLocation',
        defaultMessage: 'Select location(s)',
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
    userRolesDropDownError: {
        defaultMessage: 'An error occurred while fetching user roles',
        id: 'iaso.snackBar.fetchUserRoles',
    },
    homePage: {
        defaultMessage: 'Home page',
        id: 'iaso.users.label.homePage',
    },
    ouChildrenCheckbox: {
        defaultMessage: 'Users with access to children org unit',
        id: 'iaso.users.ouChildrenCheckbox',
    },
    userPermissions: {
        defaultMessage: 'User permissions',
        id: 'iaso.users.userPermissions',
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
    multiSelectionAction: {
        defaultMessage: 'Edit selected users',
        id: 'iaso.users.multiSelectionAction',
    },
    projects: {
        defaultMessage: 'Projects',
        id: 'iaso.label.projects',
    },
    confirmMultiChange: {
        defaultMessage: 'Confirm mass changes ?',
        id: 'iaso.orgUnits.confirmMultiChange',
    },
    validate: {
        defaultMessage: 'Validate',
        id: 'iaso.label.validate',
    },
    multiEditTitle: {
        defaultMessage: 'Edit selection: {count} user(s)',
        id: 'iaso.users.multiEditTitle',
    },
    bulkChangeCount: {
        id: 'iaso.users.bulkChangeCount',
        defaultMessage: 'You are about to change {count} user(s)',
    },
    addProjects: {
        id: 'iaso.users.addProjects',
        defaultMessage: 'Add to project(s)',
    },
    removeProjects: {
        id: 'iaso.users.removeProjects',
        defaultMessage: 'Remove from project(s)',
    },
    addRoles: {
        id: 'iaso.users.addRoles',
        defaultMessage: 'Add user role(s)',
    },
    removeRoles: {
        id: 'iaso.users.removeRoles',
        defaultMessage: 'Remove user role(s)',
    },
    taskLaunched: {
        id: 'iaso.snackBar.copyVersionSuccessMessage',
        defaultMessage: 'The task has been created',
    },
    addLocations: {
        id: 'iaso.users.addLocations',
        defaultMessage: 'Add location(s)',
    },
    removeLocations: {
        id: 'iaso.users.removeLocations',
        defaultMessage: 'Remove location(s)',
    },
    iaso_write_sources: {
        id: 'iaso.permissions.iaso_write_sources',
        defaultMessage: 'Edit data sources',
    },
    iaso_page_write: {
        id: 'iaso.permissions.iaso_page_write',
        defaultMessage: 'Edit page',
    },
    iaso_polio_vaccine_authorizations_admin: {
        id: 'iaso.polio.permissions.vaccine_authorizations_admin',
        defaultMessage: 'Polio Vaccine Authorizations: Admin',
    },
    iaso_polio_vaccine_authorizations_read_only: {
        id: 'iaso.polio.permissions.vaccine_authorizations_read_only',
        defaultMessage: 'Polio Vaccine Authorizations: Read Only',
    },
});

export default MESSAGES;
