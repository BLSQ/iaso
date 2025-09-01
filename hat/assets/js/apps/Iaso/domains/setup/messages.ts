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
    account_name: {
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
    account_name_already_exist: {
        defaultMessage: 'Account name already exists',
        id: 'iaso.setup.accountNameAlreadyExist',
    },
    data_source_name_already_exist: {
        defaultMessage: 'Data source name already exists',
        id: 'iaso.setup.dataSourceNameAlreadyExist',
    },
    user_name_already_exist: {
        defaultMessage: 'Username already exists',
        id: 'iaso.setup.usernameAlreadyExist',
    },
    user_username: {
        defaultMessage: 'User name',
        id: 'iaso.label.userName',
    },
    user_first_name: {
        defaultMessage: 'First name',
        id: 'iaso.label.firstName',
    },
    user_last_name: {
        defaultMessage: 'Last name',
        id: 'iaso.label.lastName',
    },
    user_email: {
        defaultMessage: 'Email',
        id: 'iaso.label.email',
    },
    email_invitation: {
        defaultMessage: 'Send email invitation to set password',
        id: 'iaso.setup.emailInvitation',
    },
    language: {
        defaultMessage: 'Language',
        id: 'iaso.label.language',
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
    modules_empty: {
        defaultMessage: 'Modules should not be empty',
        id: 'iaso.setup.modulesEmpty',
    },
    modules_not_exist: {
        defaultMessage: 'Modules do not exist',
        id: 'iaso.setup.modulesNotExist',
    },
    modules: {
        defaultMessage: 'Modules',
        id: 'iaso.modules.title',
    },
    modulesDropDownError: {
        defaultMessage: 'An error occurred while fetching modules',
        id: 'iaso.snackBar.fetchModules',
    },
});
