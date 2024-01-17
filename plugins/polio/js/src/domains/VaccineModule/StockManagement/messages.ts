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
    unusableVials: {
        id: 'iaso.label.unusableVials',
        defaultMessage: 'Unusable vials',
    },
    usableVials: {
        id: 'iaso.label.usableVials',
        defaultMessage: 'Usable vials',
    },
    unusable: {
        id: 'iaso.label.unusable',
        defaultMessage: 'Unusable',
    },
    usable: {
        id: 'iaso.label.usable',
        defaultMessage: 'Usable',
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
    doses_out: {
        id: 'iaso.label.doses_out',
        defaultMessage: 'Doses OUT',
    },
    doses_in: {
        id: 'iaso.label.doses_in',
        defaultMessage: 'Doses IN',
    },
    vials_out: {
        id: 'iaso.label.vials_out',
        defaultMessage: 'Vials OUT',
    },
    vials_in: {
        id: 'iaso.label.vials_in',
        defaultMessage: 'Vials IN',
    },
    action: {
        id: 'iaso.label.action',
        defaultMessage: 'Action',
    },
    date: {
        defaultMessage: 'Date',
        id: 'iaso.label.date',
    },
    unusableDoses: {
        id: 'iaso.label.unusableDoses',
        defaultMessage: 'Unusable doses',
    },
    usableDoses: {
        id: 'iaso.label.usableDoses',
        defaultMessage: 'Usable doses',
    },
    stockBalance: {
        id: 'iaso.label.stockBalance',
        defaultMessage: 'Stock balance',
    },
    stockDetails: {
        id: 'iaso.label.stockDetails',
        defaultMessage: 'Stock details',
    },
    formA: {
        id: 'iaso.polio.label.formA',
        defaultMessage: 'Form A',
    },
    destructionReports: {
        id: 'iaso.polio.label.destructionReports',
        defaultMessage: 'Destruction reports',
    },
    incidentReports: {
        id: 'iaso.polio.label.incidentReports',
        defaultMessage: 'Incident reports',
    },
    stockVariation: {
        id: 'iaso.polio.label.stockVariation',
        defaultMessage: 'Stock variation',
    },
    forma_vials_used: {
        id: 'iaso.polio.label.forma_vials_used',
        defaultMessage: 'Vials used',
    },
    forma_vials_missing: {
        id: 'iaso.polio.label.forma_vials_missing',
        defaultMessage: 'Vials missing',
    },
    forma_unusable_vials: {
        id: 'iaso.polio.label.forma_unusable_vials',
        defaultMessage: 'Unusable vials',
    },
    lot_numbers_for_usable_vials: {
        id: 'iaso.polio.label.lot_numbers_for_usable_vials',
        defaultMessage: 'Lot numbers for usable vials',
    },
    date_of_report: {
        id: 'iaso.polio.label.date_of_report',
        defaultMessage: 'Date of report',
    },
    forma_reception_rrt: {
        id: 'iaso.polio.label.forma_reception_rrt',
        defaultMessage: 'Form A reception (RRT)',
    },
    unusable_vials: {
        id: 'iaso.polio.label.unusable_vials',
        defaultMessage: 'Unusable vials',
    },
    usable_vials: {
        id: 'iaso.polio.label.usable_vials',
        defaultMessage: 'Usable vials',
    },
    vials_destroyed: {
        id: 'iaso.polio.label.vials_destroyed',
        defaultMessage: 'Vials destroyed',
    },
    incident_reception_rrt: {
        id: 'iaso.polio.label.incident_reception_rrt',
        defaultMessage: 'Incident report received by RRT',
    },
    destruction_reception_rrt: {
        id: 'iaso.polio.label.destruction_reception_rrt',
        defaultMessage: 'Destruction report received by RRT',
    },
    formaReports: {
        id: 'iaso.polio.label.formA',
        defaultMessage: 'Form A',
    },
    destruction: {
        id: 'iaso.polio.label.destruction',
        defaultMessage: 'Destruction',
    },
    incident: {
        id: 'iaso.polio.label.incident',
        defaultMessage: 'Incident',
    },
    lot_numbers: {
        id: 'iaso.polio.label.lot_numbers',
        defaultMessage: 'Lot numbers',
    },
    PHYSICAL_INVENTORY: {
        id: 'iaso.polio.label.PHYSICAL_INVENTORY',
        defaultMessage: 'Physical inventory',
    },
    STEALING: {
        id: 'iaso.polio.label.STEALING',
        defaultMessage: 'Theft',
    },
    RETURN_TO_SUPPLIER: {
        id: 'iaso.polio.label.RETURN_TO_SUPPLIER',
        defaultMessage: 'Return to supplier',
    },
    LOSSES: {
        id: 'iaso.polio.label.LOSSES',
        defaultMessage: 'Losses',
    },
    VACCINE_EXPIRED: {
        id: 'iaso.polio.label.VACCINE_EXPIRED',
        defaultMessage: 'Vaccine expired',
    },
    VM_REACHED_DISCARD_POINT: {
        id: 'iaso.polio.label.VM_REACHED_DISCARD_POINT',
        defaultMessage: 'VM reached discard point',
    },
    stockCorrection: {
        id: 'iaso.polio.label.stockCorrection',
        defaultMessage: 'Stock correction',
    },
    save: {
        id: 'iaso.label.save',
        defaultMessage: 'Save',
    },
    cancel: {
        id: 'iaso.label.cancel',
        defaultMessage: 'Cancel',
    },
    create: {
        defaultMessage: 'Create',
        id: 'iaso.label.create',
    },
    positiveInteger: {
        id: 'iaso.polio.form.validator.error.positiveInteger',
        defaultMessage: 'Please use a positive integer',
    },
    positiveNumber: {
        id: 'iaso.polio.form.validator.error.positiveNumber',
        defaultMessage: 'Please use a positive number',
    },
    invalidDate: {
        id: 'iaso.polio.form.invalidDate',
        defaultMessage: 'Date is invalid',
    },
    requiredField: {
        id: 'iaso.forms.error.fieldRequired',
        defaultMessage: 'This field is required',
    },
});

export default MESSAGES;
