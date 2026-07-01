import { defineMessages } from 'react-intl';

export const MESSAGES = defineMessages({
    title: {
        defaultMessage: 'Modules',
        id: 'iaso.modules.title',
    },
    name: {
        defaultMessage: 'Name',
        id: 'iaso.label.name',
    },
    codename: {
        defaultMessage: 'Code name',
        id: 'iaso.label.codename',
    },
    status: {
        defaultMessage: 'Status',
        id: 'iaso.modules.status',
    },
    search: {
        defaultMessage: 'Search',
        id: 'iaso.search',
    },
    created_at: {
        defaultMessage: 'Created',
        id: 'iaso.label.created_at',
    },
    updated_at: {
        defaultMessage: 'Updated',
        id: 'iaso.label.updated_at',
    },
    modulesInformation: {
        id: 'iaso.modules.modulesInformation',
        defaultMessage:
            'You can see here the feature modules that are activated for your account. Contact an admin of your instance if you wish to activate additional features.',
    },
    dropdownLabel: {
        defaultMessage: 'Modules',
        id: 'iaso.modules.dropdown.label',
    },
    modulesDropDownError: {
        defaultMessage: 'An error occurred while fetching modules',
        id: 'iaso.snackBar.fetchModules',
    },
    activated: {
        defaultMessage: 'Activated',
        id: 'iaso.modules.activated',
    },
    notActivated: {
        defaultMessage: 'Not activated',
        id: 'iaso.modules.notActivated',
    },
});

export default MESSAGES;
