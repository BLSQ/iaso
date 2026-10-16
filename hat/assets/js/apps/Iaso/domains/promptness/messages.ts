import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    allTypes: {
        defaultMessage: 'All types',
        id: 'iaso.promptness.allTypes',
    },
    browseForms: {
        defaultMessage: 'Browse forms',
        id: 'iaso.promptness.browseForms',
    },
    completeness: {
        defaultMessage: 'Completeness',
        id: 'iaso.completenessStats.completeness',
    },
    completenessDetails: {
        defaultMessage: '{received} received, on time or late',
        id: 'iaso.promptness.completenessDetails',
    },
    configuredFor: {
        defaultMessage: 'Configured for {orgUnitTypes}',
        id: 'iaso.promptness.configuredFor',
    },
    deadline: {
        defaultMessage:
            'Deadline for <b>{period}</b>: on time until <b>{deadline}</b>',
        id: 'iaso.promptness.deadline',
    },
    deadlineDetails: {
        defaultMessage:
            '{days} days after period end ({periodEnd}) · defined in form settings',
        id: 'iaso.promptness.deadlineDetails',
    },
    expected: {
        defaultMessage: 'Expected',
        id: 'iaso.promptness.expected',
    },
    expectedDetails: {
        defaultMessage: 'In the hierarchy of {orgUnit}',
        id: 'iaso.promptness.expectedDetails',
    },
    expectedSubmissions: {
        defaultMessage: 'Expected submissions',
        id: 'iaso.promptness.expectedSubmissions',
    },
    exportCsv: {
        defaultMessage: 'Export CSV',
        id: 'iaso.promptness.exportCsv',
    },
    form: {
        defaultMessage: 'Form',
        id: 'iaso.label.form',
    },
    formRequired: {
        defaultMessage: 'Required — pick a form to compute promptness',
        id: 'iaso.promptness.formRequired',
    },
    formNoGracePeriod: {
        defaultMessage:
            'No grace period is configured for this form, set it in the form settings',
        id: 'iaso.promptness.formNoGracePeriod',
    },
    formSettings: {
        defaultMessage: 'Form settings',
        id: 'iaso.promptness.formSettings',
    },
    late: {
        defaultMessage: 'Late',
        id: 'iaso.promptness.late',
    },
    missing: {
        defaultMessage: 'Missing',
        id: 'iaso.promptness.missing',
    },
    notApplicableType: {
        defaultMessage: 'Not applicable for this form',
        id: 'iaso.promptness.notApplicableType',
    },
    notApplicable: {
        defaultMessage: 'Nothing is expected in this hierarchy for this form',
        id: 'iaso.promptness.notApplicable',
    },
    ofExpected: {
        defaultMessage: '{percent} of expected',
        id: 'iaso.promptness.ofExpected',
    },
    onTime: {
        defaultMessage: 'On time',
        id: 'iaso.promptness.onTime',
    },
    openSubmissions: {
        defaultMessage: 'Open submissions',
        id: 'iaso.promptness.openSubmissions',
    },
    orgUnit: {
        defaultMessage: 'Org Unit',
        id: 'iaso.label.orgUnitSingle',
    },
    orgUnitsIn: {
        defaultMessage: 'Org units in {orgUnit}',
        id: 'iaso.promptness.orgUnitsIn',
    },
    orgUnitType: {
        defaultMessage: 'Org unit type',
        id: 'iaso.forms.org_unit_type_id',
    },
    orgUnitTypes: {
        defaultMessage: 'Org unit types',
        id: 'iaso.label.orgUnitsTypes',
    },
    orgUnitTypesSelectedInfo: {
        defaultMessage: 'Only org units of the selected types are listed',
        id: 'iaso.promptness.orgUnitTypesSelectedInfo',
    },
    orgUnitTypesInfo: {
        defaultMessage: 'Leave empty to list the direct children',
        id: 'iaso.promptness.orgUnitTypesInfo',
    },
    parent: {
        defaultMessage: 'Parent Org unit',
        id: 'iaso.label.parentOu',
    },
    period: {
        defaultMessage: 'Period',
        id: 'iaso.label.period',
    },
    periodInfo: {
        defaultMessage: 'Follows the form period type ({periodType})',
        id: 'iaso.promptness.periodInfo',
    },
    periodProvisional: {
        defaultMessage: 'Period in progress · figures are provisional',
        id: 'iaso.promptness.periodProvisional',
    },
    promptness: {
        defaultMessage: 'Promptness',
        id: 'iaso.promptness.title',
    },
    received: {
        defaultMessage: 'Received',
        id: 'iaso.promptness.received',
    },
    seeChildren: {
        defaultMessage: 'See children',
        id: 'iaso.label.seeChildren',
    },
    selectFilters: {
        defaultMessage: 'Select a period and a parent org unit',
        id: 'iaso.promptness.selectFilters',
    },
    selectFiltersInfo: {
        defaultMessage:
            'The promptness is computed for one period, in the hierarchy of the parent org unit. Pick them above and search.',
        id: 'iaso.promptness.selectFiltersInfo',
    },
    selectForm: {
        defaultMessage: 'Select a form',
        id: 'iaso.promptness.selectForm',
    },
    selectFormFirst: {
        defaultMessage: 'Select a form first',
        id: 'iaso.promptness.selectFormFirst',
    },
    selectFormInfo: {
        defaultMessage:
            'Promptness is computed against the deadline of one form. Pick a form above.',
        id: 'iaso.promptness.selectFormInfo',
    },
    share: {
        defaultMessage: 'Share',
        id: 'iaso.promptness.share',
    },
    status: {
        defaultMessage: 'Promptness',
        id: 'iaso.promptness.status',
    },
    statusInfo: {
        defaultMessage:
            'Remove a status to hide it from the totals and the table',
        id: 'iaso.promptness.statusInfo',
    },
    totalsFor: {
        defaultMessage: 'Totals for',
        id: 'iaso.promptness.totalsFor',
    },
});

export default MESSAGES;
