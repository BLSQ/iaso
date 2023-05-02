import { defineMessages } from 'react-intl';

// TODO when moving to blsq-comp, change translation keys and add to cutom translations
const MESSAGES = defineMessages({
    doYouWantToClose: {
        id: 'iaso.label.doYouWantToClose',
        defaultMessage: 'Do you want to close?',
    },
    unsavedDataWillBeLost: {
        id: 'iaso.label.unsavedDataWillBeLost',
        defaultMessage: 'Unsaved data will be lost',
    },
    proceed: {
        id: 'iaso.label.proceed',
        defaultMessage: 'proceed',
    },
    cancel: {
        defaultMessage: 'Cancel',
        id: 'iaso.label.cancel',
    },
});

export default MESSAGES;
