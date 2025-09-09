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
    username: {
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
    first_name: {
        defaultMessage: 'First name',
        id: 'iaso.label.firstName',
    },
    last_name: {
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
    user_roles: {
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

    homePage: {
        defaultMessage: 'Home page',
        id: 'iaso.users.label.homePage',
    },
    home_page: {
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
    project: {
        defaultMessage: 'Project',
        id: 'iaso.label.project',
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
        defaultMessage: 'Geo data sources - Read and Write',
    },
    iaso_write_sources_tooltip: {
        id: 'iaso.permissions.tooltip.iaso_write_sources',
        defaultMessage:
            'Manage multiple geo data sources: create or edit sources (name, description, project(s), default version, DHIS2 links)',
    },
    iaso_page_write: {
        id: 'iaso.permissions.iaso_page_write',
        defaultMessage: 'Web embedded links management - Read and Write',
    },
    teams: {
        defaultMessage: 'Teams',
        id: 'iaso.label.teams',
    },
    homePageInfos: {
        defaultMessage: 'Copy/paste the url after "dashboard/"',
        id: 'iaso.users.homePageInfos',
    },
    addTeams: {
        id: 'iaso.users.addTeams',
        defaultMessage: 'Add to team(s)',
    },
    removeTeams: {
        id: 'iaso.users.removeTeams',
        defaultMessage: 'Remove from team(s)',
    },
    exportMobileAppTooltip: {
        defaultMessage:
            'Download a zip file to allow setting up the mobile application without Internet connection',
        id: 'iaso.users.exportMobileAppTooltip',
    },
    exportMobileAppTitle: {
        defaultMessage: 'Export zip file for mobile app setup',
        id: 'iaso.users.exportMobileAppTitle',
    },
    exportMobileAppBody: {
        defaultMessage:
            'This will create a zip file containing all data needed to perform the initial set up for the mobile application for:',
        id: 'iaso.users.exportMobileAppBody',
    },
    exportMobileAppBodyWarning: {
        defaultMessage:
            // eslint-disable-next-line max-len
            'Caution: This file will contain sensitive information, for this reason the exported file will be encrypted. Please choose a password of at least 8 characters to encrypt the file. You will need to provide this password when setting up the mobile application.',
        id: 'iaso.users.exportMobileAppBodyWarning',
    },
    exportMobileAppBodySure: {
        defaultMessage: 'Are you sure you wish to create the export file?',
        id: 'iaso.users.exportMobileAppBodySure',
    },
    exportMobileAppBtn: {
        defaultMessage: 'Generate file',
        id: 'iaso.users.exportMobileAppBtn',
    },
    exportMobileAppInProgress: {
        defaultMessage: 'Generating export file, please wait...',
        id: 'iaso.users.exportMobileAppInProgress',
    },
    exportMobileAppDownloadBtn: {
        defaultMessage: 'Download file',
        id: 'iaso.users.exportMobileAppDownloadBtn',
    },
    exportMobileAppBodyNoProjects: {
        defaultMessage:
            "This user doesn't have any assigned projects. The mobile app setup needs to be done for a specific project. Please assign at least one project to this user in order to proceed.",
        id: 'iaso.users.exportMobileAppBodyNoProjects',
    },
    exportMobileAppUser: {
        defaultMessage: 'User:',
        id: 'iaso.users.exportMobileAppUser',
    },
    exportMobileAppProject: {
        defaultMessage: 'Project:',
        id: 'iaso.users.exportMobileAppProject',
    },
    exportMobileAppError: {
        defaultMessage:
            'Something went wrong, please refer to the tasks overview page for more details.',
        id: 'iaso.users.exportMobileAppError',
    },
    exportMobileAppViewTasks: {
        defaultMessage:
            'Closing this modal will not stop the document export. You can find all tasks and their progress on the tasks overview page.',
        id: 'iaso.users.exportMobileAppViewTasks',
    },
    phoneNumber: {
        defaultMessage: 'Phone number',
        id: 'iaso.users.phoneNumber',
    },
    phone_number: {
        defaultMessage: 'Phone number',
        id: 'iaso.users.phoneNumber',
    },
    usersHistory: {
        defaultMessage: 'Users history',
        id: 'iaso.users.usersHistory',
    },
    modifiedBy: {
        id: 'iaso.labels.modifiedBy',
        defaultMessage: 'Modified by',
    },
    fieldsModified: {
        id: 'iaso.labels.fieldsModified',
        defaultMessage: 'Fields modified',
    },
    newLocation: {
        id: 'iaso.users.history.labels.newLocation',
        defaultMessage: 'New location',
    },
    pastLocation: {
        id: 'iaso.users.history.labels.pastLocation',
        defaultMessage: 'Past location',
    },
    dateModified: {
        id: 'iaso.users.history.labels.dateModified',
        defaultMessage: 'Date modified',
    },
    modifiedBefore: {
        id: 'iaso.users.history.labels.modifiedBefore',
        defaultMessage: 'Modified before',
    },
    modifiedAfter: {
        id: 'iaso.users.history.labels.modifiedAfter',
        defaultMessage: 'Modified after',
    },
    before: {
        id: 'iaso.label.before',
        defaultMessage: 'Before',
    },
    after: {
        id: 'iaso.label.after',
        defaultMessage: 'After',
    },
    created: {
        id: 'iaso.label.created',
        defaultMessage: 'Creation',
    },
    renderError: {
        id: 'iaso.label.renderError',
        defaultMessage: 'Error rendering value',
    },
    yes: {
        defaultMessage: 'Yes',
        id: 'iaso.label.yes',
    },
    no: {
        defaultMessage: 'No',
        id: 'iaso.label.no',
    },
    fr: {
        defaultMessage: 'French',
        id: 'iaso.users.label.french',
    },
    en: {
        defaultMessage: 'English',
        id: 'iaso.users.label.english',
    },
    language: {
        defaultMessage: 'Language',
        id: 'iaso.users.dialog.locale',
    },
    user_permissions: {
        defaultMessage: 'User permissions',
        id: 'iaso.users.userPermissions',
    },
    org_units: {
        defaultMessage: 'Location',
        id: 'iaso.map.location',
    },
    password_updated: {
        defaultMessage: 'Password updated',
        id: 'iaso.users.label.password_updated',
    },
    deleted_at: {
        id: 'iaso.forms.deleted_at',
        defaultMessage: 'Deleted',
    },
    new_user_created: {
        id: 'iaso.users.label.new_user_created',
        defaultMessage: 'New user created',
    },
    phoneNumberWarning: {
        id: 'iaso.users.label.phoneNumberWarning',
        defaultMessage: 'WARNING: Updating phone number',
    },
    phoneNumberWarningMessage: {
        id: 'iaso.users.label.phoneNumberWarningMessage',
        defaultMessage: 'All phone number updates are logged and archived',
    },
    createUserWithoutPerm: {
        id: 'iaso.users.labels.createUserWithoutPerm',
        defaultMessage: 'Save user with no permissions?',
    },
    warningModalMessage: {
        id: 'iaso.users.warningModalMessage',
        defaultMessage: `You are about to save a user with no permissions. This user will
        have access to the mobile application but not to the features of the
        web interface.`,
    },
    permAndPhoneWarningTitle: {
        id: 'iaso.users.permAndPhoneWarningTitle',
        defaultMessage: 'WARNING: Read before saving',
    },
    organization: {
        id: 'iaso.users.organization',
        defaultMessage: 'Organization',
    },
    orgUnitWriteTypes: {
        id: 'iaso.users.orgUnitWriteTypes',
        defaultMessage: 'Org unit write types',
    },
    orgUnitWriteTypesInfos: {
        id: 'iaso.users.orgUnitWriteTypesInfos',
        defaultMessage: 'Select the org unit types the user can edit',
    },
    selectAllHelperText: {
        id: 'iaso.users.selectAllHelperText',
        defaultMessage: 'Leave empty to select all',
    },
    OrgUnitTypeWriteDisableTooltip: {
        id: 'iaso.users.orgUnitTypeWriteDisableTooltip',
        defaultMessage:
            'Enable the permission “Org Units management - Write” in order to be able to detail the Org Unit Write Type(s) for this {type}',
    },
    user: {
        id: 'iaso.label.user',
        defaultMessage: 'User',
    },
    userRoleOrgUnitTypeRestrictionWarning: {
        id: 'iaso.users.userRoleOrgUnitTypeRestrictionWarning',
        defaultMessage:
            'Org Unit Type Write restrictions from User role apply to this user. Refer to the user role configuration for more details',
    },
    multiAccountUserInfoDisabledWarning: {
        id: 'iaso.users.multiAccountUserInfoDisabledWarning',
        defaultMessage:
            'This user is a multi-account user. For this user, you can only edit settings specific to this account, such as their permissions.',
    },
    invalidEmailFormat: {
        id: 'iaso.users.invalidEmailFormat',
        defaultMessage: 'Invalid email format',
    },
});

export default MESSAGES;
