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
    locale: {
        defaultMessage: 'Language',
        id: 'iaso.users.dialog.locale',
    },
    searchUser: {
        id: 'iaso.users.filter.searchUser',
        defaultMessage: 'Search user',
    },
});

export default MESSAGES;
