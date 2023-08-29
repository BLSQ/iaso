import { defineMessages } from 'react-intl';

export const MESSAGES = defineMessages({
    welcome: {
        defaultMessage: 'Welcome to Iaso',
        id: 'iaso.setup.welcome',
    },
    accountSetup: {
        defaultMessage: 'Account setup',
        id: 'iaso.setup.accountSetup',
    },
    accountName: {
        defaultMessage: 'Account name',
        id: 'iaso.setup.accountName',
    },
    notAdmin: {
        defaultMessage: 'User "{displayName}" has no Iaso profile and account.',
        id: 'iaso.setup.notAdmin',
    },
    notAdmin2: {
        defaultMessage: 'Please contact your administrator.',
        id: 'iaso.setup.notAdmin2',
    },
    confirmMessage: {
        id: 'iaso.setup.confirmMessage',
        defaultMessage:
            'Account and profile created successfully, please logout and login again with the new profile.',
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
    password: {
        defaultMessage: 'Password',
        id: 'iaso.users.password',
    },
    confirm: {
        defaultMessage: 'Confirm',
        id: 'iaso.label.confirm',
    },
    requiredField: {
        id: 'iaso.forms.error.fieldRequired',
        defaultMessage: 'This field is required',
    },
    logout: {
        defaultMessage: 'Logout',
        id: 'iaso.logout',
    },
});
