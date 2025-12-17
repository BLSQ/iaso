/* eslint-disable max-len */
import { defineMessages } from 'react-intl';

// List of translations for Iaso groups of permissions used all along the project

const PERMISSIONS_GROUPS_MESSAGES = defineMessages({
    forms: {
        id: 'iaso.permissions.group.forms',
        defaultMessage: 'Forms:',
    },
    org_units: {
        id: 'iaso.permissions.group.org_units',
        defaultMessage: 'Org units:',
    },
    entities: {
        id: 'iaso.permissions.group.entities',
        defaultMessage: 'Entities:',
    },
    payments: {
        id: 'iaso.permissions.group.payments',
        defaultMessage: 'Payments:',
    },
    dhis2_mapping: {
        id: 'iaso.permissions.group.dhis2_mapping',
        defaultMessage: 'Dhis2 mapping:',
    },
    external_storage: {
        id: 'iaso.permissions.group.external_storage',
        defaultMessage: 'External storage:',
    },
    planning: {
        id: 'iaso.permissions.group.planning',
        defaultMessage: 'Planning:',
    },
    embedded_links: {
        id: 'iaso.permissions.group.embedded_links',
        defaultMessage: 'Embedded links:',
    },
    polio: {
        id: 'iaso.permissions.group.polio',
        defaultMessage: 'Polio:',
    },
    trypelim: {
        id: 'iaso.permissions.group.trypelim',
        defaultMessage: 'Trypelim:',
    },
    admin: {
        id: 'iaso.permissions.group.admin',
        defaultMessage: 'Admin:',
    },
    data_validation: {
        id: 'iaso.permissions.group.data_validation',
        defaultMessage: 'Validation',
    },
    registry: {
        id: 'iaso.permissions.group.registry',
        defaultMessage: 'Registry:',
    },
    saas: {
        id: 'iaso.permissions.group.saas',
        defaultMessage: 'SaaS:',
    },
    stock_management: {
        id: 'iaso.permissions.group.stock_management',
        defaultMessage: 'Stock management:',
    }
});

export default PERMISSIONS_GROUPS_MESSAGES;
