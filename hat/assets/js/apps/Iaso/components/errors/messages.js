import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    labelError: {
        id: 'iaso.errors.label',
        defaultMessage: 'An error occured',
    },
    noPermissions: {
        id: 'iaso.errors.noPermissions',
        defaultMessage:
            'Your user account currently has no permissions. Contact an administrator.',
    },
    noPermissionsTitle: {
        id: 'iaso.errors.noPermissionsTitle',
        defaultMessage: 'No permissions',
    },
    notAuthenticated: {
        id: 'iaso.errors.notAuthenticated',
        defaultMessage: 'You are not logged in',
    },
    notFound: {
        id: 'iaso.errors.notFound',
        defaultMessage: 'Page not found',
    },
    unauthorized: {
        id: 'iaso.errors.unauthorized',
        defaultMessage: 'You are not allowed to see this page',
    },
});

export default MESSAGES;
