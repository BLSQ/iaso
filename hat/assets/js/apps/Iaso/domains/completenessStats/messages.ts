import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    parent: {
        id: 'iaso.label.parentOu',
        defaultMessage: 'Parent Org unit',
    },
    orgUnitType: {
        id: 'iaso.forms.org_unit_type_id',
        defaultMessage: 'Org unit type',
    },
    orgUnitTypeGroupBy: {
        id: 'iaso.completeness.orgUnitTypeGroupBy',
        defaultMessage: 'Group by type',
    },
    orgUnit: {
        id: 'iaso.instance.org_unit',
        defaultMessage: 'Org unit',
    },
    form: {
        id: 'iaso.instance.formShort',
        defaultMessage: 'Form',
    },
    group: {
        defaultMessage: 'Group',
        id: 'iaso.label.group',
    },
    completenessStats: {
        defaultMessage: 'Completeness Stats',
        id: 'iaso.completenessStats.title',
    },
    actions: {
        defaultMessage: 'Action(s)',
        id: 'iaso.label.actions',
    },
    seeChildren: {
        defaultMessage: 'See children',
        id: 'iaso.label.seeChildren',
    },
    seeParent: {
        defaultMessage: 'See parent',
        id: 'iaso.label.seeParent',
    },
    planning: {
        defaultMessage: 'Planning',
        id: 'iaso.label.planning',
    },
    period: {
        defaultMessage: 'Period',
        id: 'iaso.label.period',
    },
    periodPlaceHolder: {
        defaultMessage: 'Please select a form with a period to filter',
        id: 'iaso.label.periodPlaceHolder',
    },
    itselfColumnTitle: {
        defaultMessage: 'Submissions on this org unit',
        id: 'iaso.completenessStats.itselfColumnTitle',
    },
    itselfColumnLabel: {
        defaultMessage: 'Itself',
        id: 'iaso.completenessStats.itselfColumnLabel',
    },
    itselfSubmissionCount: {
        defaultMessage: 'Total submissions: {value}',
        id: 'iaso.completenessStats.itselfSubmissionCount',
    },
    itselfNoSubmissionExpected: {
        defaultMessage: 'No submission is expected on this level for this form',
        id: 'iaso.completenessStats.itselfNoSubmissionExcepted',
    },
    descendants: {
        defaultMessage: 'Descendants',
        id: 'iaso.completenessStats.descendants',
    },
    descendantsNoSubmissionExpected: {
        defaultMessage:
            'No descendant OrgUnit is expected to fill that form. Check the Form config if this is unexpected',
        id: 'iaso.completenessStats.descendantsNoSubmissionExpected',
    },
    rejected: {
        defaultMessage: 'Rejected',
        id: 'iaso.forms.rejectedCap',
    },
    new: {
        defaultMessage: 'New',
        id: 'iaso.forms.newCap',
    },
    validated: {
        defaultMessage: 'Validated',
        id: 'iaso.forms.validated',
    },
    validationStatus: {
        defaultMessage: 'Validation status',
        id: 'iaso.forms.validationStatus',
    },
    viewInstances: {
        defaultMessage: 'View submission(s)',
        id: 'iaso.forms.viewInstances',
    },
    list: {
        defaultMessage: 'List',
        id: 'iaso.label.list',
    },
    map: {
        defaultMessage: 'Map',
        id: 'iaso.label.map',
    },
    see: {
        defaultMessage: 'See',
        id: 'iaso.label.see',
    },
    name: {
        defaultMessage: 'Name',
        id: 'iaso.label.name',
    },
    count: {
        defaultMessage: 'Instance(s) count',
        id: 'iaso.completenessStats.count',
    },
    completeness: {
        defaultMessage: 'Completeness',
        id: 'iaso.completenessStats.completeness',
    },
    directCompleteness: {
        defaultMessage: 'Form filled at org unit',
        id: 'iaso.completenessStats.directCompleteness',
    },
    childrenCompleteness: {
        defaultMessage: 'Children completeness',
        id: 'iaso.completenessStats.childrenCompleteness',
    },
    completed: {
        defaultMessage: 'Completed',
        id: 'iaso.completenessStats.completed',
    },
    notCompleted: {
        defaultMessage: 'Not completed',
        id: 'iaso.completenessStats.notCompleted',
    },
    formsInfos: {
        defaultMessage:
            'Please select one form to enable completeness map view',
        id: 'iaso.completenessStats.formsInfos',
    },
    selectAForm: {
        defaultMessage:
            'Please select a Form to watch completeness with the map view',
        id: 'iaso.completenessStats.selectAForm',
    },
});

export default MESSAGES;
