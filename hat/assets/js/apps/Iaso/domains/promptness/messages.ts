import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    addFilters: {
        defaultMessage: 'Add filters',
        id: 'iaso.promptness.addFilters',
    },
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
    formNotSelected: {
        defaultMessage:
            'Not selected · only forms with a period type are listed',
        id: 'iaso.promptness.formNotSelected',
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
        defaultMessage: 'Org unit',
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
    parentNotSelected: {
        defaultMessage: 'Not selected · the table lists its children',
        id: 'iaso.promptness.parentNotSelected',
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
    requiredFiltersInfo: {
        defaultMessage:
            'Promptness is computed for one form, over one period, below one parent org unit. These filters are required.',
        id: 'iaso.promptness.requiredFiltersInfo',
    },
    requiredFiltersTitle: {
        defaultMessage:
            '{count, plural, one {Set # filter to see promptness} other {Set # filters to see promptness}}',
        id: 'iaso.promptness.requiredFiltersTitle',
    },
    seeChildren: {
        defaultMessage: 'See children',
        id: 'iaso.label.seeChildren',
    },
    selectForm: {
        defaultMessage: 'Select a form',
        id: 'iaso.promptness.selectForm',
    },
    selectFormFirst: {
        defaultMessage: 'Select a form first',
        id: 'iaso.promptness.selectFormFirst',
    },
    share: {
        defaultMessage: 'Share',
        id: 'iaso.promptness.share',
    },
    stepRequired: {
        defaultMessage: 'Required',
        id: 'iaso.promptness.stepRequired',
    },
    stepWaiting: {
        defaultMessage: 'Waiting',
        id: 'iaso.promptness.stepWaiting',
    },
    status: {
        defaultMessage: 'Promptness',
        id: 'iaso.promptness.status',
    },
    startFromForm: {
        defaultMessage: 'Prefer to start from a form?',
        id: 'iaso.promptness.startFromForm',
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
