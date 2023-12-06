import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    vaccineSupplyChain: {
        id: 'iaso.polio.menu.vaccineSupplyChain',
        defaultMessage: 'Supply chain',
    },
    country: {
        id: 'iaso.polio.table.label.country',
        defaultMessage: 'Country',
    },
    vaccine: {
        id: 'iaso.polio.vaccine',
        defaultMessage: 'Vaccine',
    },
    obrName: {
        id: 'iaso.polio.form.label.obrName',
        defaultMessage: 'OBR Name',
    },
    poNumbers: {
        id: 'iaso.polio.label.poNumbers',
        defaultMessage: 'PO numbers',
    },
    rounds: {
        id: 'iaso.polio.form.label.rounds',
        defaultMessage: 'Rounds',
    },
    startDate: {
        id: 'iaso.label.dateFrom',
        defaultMessage: 'Start date',
    },
    endDate: {
        id: 'iaso.label.dateTo',
        defaultMessage: 'End date',
    },
    estimatedDateOfArrival: {
        id: 'iaso.polio.label.estimatedDateOfArrival',
        defaultMessage: 'Estimated date of arrival',
    },
    dosesShipped: {
        id: 'iaso.polio.label.dosesShipped',
        defaultMessage: 'Doses shipped',
    },
    actions: {
        defaultMessage: 'Action(s)',
        id: 'iaso.label.actions',
    },
    edit: {
        id: 'iaso.label.edit',
        defaultMessage: 'Edit',
    },
    search: {
        defaultMessage: 'Search',
        id: 'iaso.search',
    },
    RoundStartFrom: {
        id: 'iaso.polio.label.RoundStartFrom',
        defaultMessage: 'Round start date from',
    },
    RoundStartTo: {
        id: 'iaso.polio.label.RoundStartTo',
        defaultMessage: 'Round start date to',
    },
    deleteVRF: {
        id: 'iaso.polio.label.deleteVRF',
        defaultMessage: 'Delete VRF',
    },
    deleteVRFWarning: {
        id: 'iaso.polio.label.deleteVRFWarning',
        defaultMessage:
            'This will also delete all attached pre-alerts and VARs',
    },
    clear: {
        id: 'iaso.label.clear',
        defaultMessage: 'Clear',
    },
});

export default MESSAGES;
