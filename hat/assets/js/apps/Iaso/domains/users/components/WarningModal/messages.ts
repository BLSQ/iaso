import { defineMessages } from 'react-intl';

export const MESSAGES = defineMessages({
    createUserWithoutPerm: {
        id: 'iaso.users.labels.createUserWithoutPerm',
        defaultMessage: 'Save user with no permissions?',
    },
    cancel: {
        id: 'iaso.label.cancel',
        defaultMessage: 'Cancel',
    },
    confirm: {
        id: 'iaso.mappings.confirm',
        defaultMessage: 'Confirm',
    },
    warningModalMessage: {
        id: 'iaso.users.warningModalMessage',
        defaultMessage: `You are about to save a user with no permissions. This user will
        have access to the mobile application but not to the features of the
        web interface.`,
    },
});
