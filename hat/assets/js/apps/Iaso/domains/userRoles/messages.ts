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
    requiredField: {
        id: 'iaso.forms.error.fieldRequired',
        defaultMessage: 'This field is required',
    },
    userRolePermissions: {
        id: 'iaso.userRoles.userRolePermissions',
        defaultMessage: 'User role permissions',
    },
    userRoleDialogInfoTitle: {
        id: 'iaso.userRoles.dialogInfoTitle',
        defaultMessage: 'Warning on the new created user role',
    },
    userRoleDialogInfoMessage: {
        id: 'iaso.userRoles.dialogInfoMessage',
        defaultMessage:
            'Please refresh your page before adding users to this new created user role',
    },
    userRoleInfoButton: {
        id: 'iaso.userRoles.infoButton',
        defaultMessage: 'Yes',
    },
    userRolesDropDownError: {
        defaultMessage: 'An error occurred while fetching user roles',
        id: 'iaso.snackBar.fetchUserRoles',
    },
    orgUnitWriteTypesInfos: {
        id: 'iaso.userRoles.orgUnitWriteTypesInfos',
        defaultMessage: 'Select the org unit types the user role can edit',
    },
    selectAllHelperText: {
        id: 'iaso.users.selectAllHelperText',
        defaultMessage: 'Leave empty to select all',
    },
    orgUnitWriteTypes: {
        id: 'iaso.users.orgUnitWriteTypes',
        defaultMessage: 'Org unit write types',
    },
    OrgUnitTypeWriteDisableTooltip: {
        id: 'iaso.users.orgUnitTypeWriteDisableTooltip',
        defaultMessage:
            'Enable the permission “Org Units management - Write” in order to be able to detail the Org Unit Write Type(s) for this {type}',
    },
    userRole: {
        id: 'iaso.userRoles.label.userRole',
        defaultMessage: 'User role',
    },
});

export default MESSAGES;
