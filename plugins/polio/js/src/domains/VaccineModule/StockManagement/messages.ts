import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    vaccineStockManagement: {
        id: 'iaso.polio.menu.vaccineStockManagement',
        defaultMessage: 'Stock management',
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
    clear: {
        id: 'iaso.label.clear',
        defaultMessage: 'Clear',
    },
    vialsDestroyed: {
        id: 'iaso.label.vialsDestroyed',
        defaultMessage: 'Vials destroyed',
    },
    stockUnusableVials: {
        id: 'iaso.label.stockUnusableVials',
        defaultMessage: 'Stock of unusable vials',
    },
    stockUsableVials: {
        id: 'iaso.label.stockUsableVials',
        defaultMessage: 'Stock of usable vials',
    },
    leftoverPercentage: {
        id: 'iaso.label.leftoverPercentage',
        defaultMessage: '% leftover on quantities ordered',
    },
    vialsUsed: {
        id: 'iaso.label.vialsUsed',
        defaultMessage: 'Vials used',
    },
    vialsReceived: {
        id: 'iaso.label.vialsReceived',
        defaultMessage: 'Vials received',
    },
});

export default MESSAGES;
