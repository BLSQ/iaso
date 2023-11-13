import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    vaccineSupplyChain: {
        id: 'iaso.polio.menu.vaccineSupplyChain',
        defaultMessage: 'Vaccine supply chain',
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
    doses_shipped: {
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
    supplyChainStatus: {
        id: 'iaso.polio.label.supplyChainStatus',
        defaultMessage: 'Supply chain status',
    },
    save: {
        id: 'iaso.label.save',
        defaultMessage: 'Save',
    },
    cancel: {
        id: 'iaso.label.cancel',
        defaultMessage: 'Cancel',
    },
    pre_alerts: {
        id: 'iaso.polio.label.PREALERT',
        defaultMessage: 'Pre-alerts',
    },
    vars: {
        id: 'iaso.polio.label.VAR',
        defaultMessage: 'VARs',
    },
    vrf: {
        id: 'iaso.polio.label.VRF',
        defaultMessage: 'VRF',
    },
    vrfTitle: {
        id: 'iaso.polio.label.vrfTitle',
        defaultMessage: 'Vaccine request form',
    },
    saveAll: {
        id: 'iaso.polio.label.saveAll',
        defaultMessage: 'Save all',
    },
    createVrf: {
        id: 'iaso.polio.label.createVrf',
        defaultMessage: 'Create VRF',
    },
    markForDeletion: {
        id: 'iaso.polio.label.markForDeletion',
        defaultMessage: 'Mark for deletion',
    },
    cancelDeletion: {
        id: 'iaso.polio.label.cancelDeletion',
        defaultMessage: 'Cancel deletion',
    },
    expirationDate: {
        id: 'iaso.polio.label.expirationDate',
        defaultMessage: 'Expiration date',
    },
    estimated_arrival_time: {
        id: 'iaso.polio.label.estimated_arrival_time',
        defaultMessage: 'Estimated arrival time',
    },
    lot_number: {
        id: 'iaso.polio.label.lot_number',
        defaultMessage: 'Lot number',
    },
    po_number: {
        id: 'iaso.polio.label.po_number',
        defaultMessage: 'PO number',
    },
    date_pre_alert_reception: {
        id: 'iaso.polio.label.date_pre_alert_reception',
        defaultMessage: 'Pre-alert reception',
    },
    doses_received: {
        id: 'iaso.polio.label.doses_received',
        defaultMessage: 'Doses received',
    },
    addPreAlert: {
        id: 'iaso.polio.label.addPreAlert',
        defaultMessage: 'Add pre-alert',
    },
    addVar: {
        id: 'iaso.polio.label.addVar',
        defaultMessage: 'Add VAR',
    },
    arrival_report_date: {
        id: 'iaso.polio.label.arrival_report_date',
        defaultMessage: 'Arrival report date',
    },
    dosesPerVial: {
        id: 'iaso.polio.label.dosesPerVial',
        defaultMessage: 'Doses per vial',
    },
    varsTitle: {
        id: 'iaso.polio.label.varTitle',
        defaultMessage: 'Vaccine arrival reports',
    },
    wastageRatio: {
        id: 'iaso.polio.label.wastageRatio',
        defaultMessage: 'Wastage ratio',
    },
    comments: {
        id: 'iaso.polio.label.comments',
        defaultMessage: 'Comments',
    },
    campaign: {
        id: 'iaso.polio.label.campaign',
        defaultMessage: 'Campaign',
    },
    date_vrf_signature: {
        id: 'iaso.polio.label.date_vrf_signature',
        defaultMessage: 'Date of VRF signature',
    },
    quantities_ordered_in_doses: {
        id: 'iaso.polio.label.quantities_ordered_in_doses',
        defaultMessage: 'Quantity ordered in doses',
    },
    date_vrf_reception: {
        id: 'iaso.polio.label.date_vrf_reception',
        defaultMessage: 'Date of VRF reception',
    },
    date_vrf_submission_to_orpg: {
        id: 'iaso.polio.label.date_vrf_submission_to_orpg',
        defaultMessage: 'Date of VRF submission ORPG',
    },
    quantities_approved_by_orpg_in_doses: {
        id: 'iaso.polio.label.quantities_approved_by_orpg_in_doses',
        defaultMessage: 'Quantity approved by ORPG in doses',
    },
    date_rrt_orpg_approval: {
        id: 'iaso.polio.label.date_rrt_orpg_approval',
        defaultMessage: 'Date of RRT/ORPG approval',
    },
    date_vrf_submission_dg: {
        id: 'iaso.polio.label.date_vrf_submission_dg',
        defaultMessage: 'Date of VRF submission to DG',
    },
    quantities_approved_by_dg_in_doses: {
        id: 'iaso.polio.label.quantities_approved_by_dg_in_doses',
        defaultMessage: 'Quantity approved by DG in doses',
    },
    date_dg_approval: {
        id: 'iaso.polio.label.date_dg_approval',
        defaultMessage: 'Date of DG approval',
    },
});

export default MESSAGES;
