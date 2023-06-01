import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    noPermissions: {
        id: 'iaso.errors.noPermissions',
        defaultMessage:
            'No permissions have been assigned to your user, an administrator should grant you some soon, please contact someone if this is not the case',
    },
    noPermissionsTitle: {
        id: 'iaso.errors.noPermissionsTitle',
        defaultMessage: 'No permissions',
    },
    notFound: {
        id: 'iaso.errors.notFound',
        defaultMessage: 'Page not found',
    },
    labelError: {
        id: 'iaso.errors.label',
        defaultMessage: 'An error occured',
    },
});

export default MESSAGES;
