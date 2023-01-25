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
    orgUnit: {
        id: 'iaso.instance.org_unit',
        defaultMessage: 'Org unit',
    },
    form: {
        id: 'iaso.instance.formShort',
        defaultMessage: 'Form',
    },
    completenessWithDescendants: {
        id: 'iaso.completeness.titleWithDescendants',
        defaultMessage: 'Completeness (with descendants)',
    },
    formsFilledWithDescendants: {
        id: 'iaso.completeness.formsFilledWithDescendants',
        defaultMessage: '# Forms filled (with descendants)',
    },
    orgUnitHasMultipleSubmissions: {
        id: 'iaso.completeness.orgUnitHasMultipleSubmissions',
        defaultMessage: 'This org. unit has multiple direct submissions',
    },
    completenessDirect: {
        id: 'iaso.completeness.titleDirect',
        defaultMessage: 'Completeness (direct)',
    },
    formsFilledDirect: {
        id: 'iaso.completeness.formsFilledDirect',
        defaultMessage: '# Forms filled (direct)',
    },
    chooseParent: {
        id: 'iaso.completeness.chooseParent',
        defaultMessage: 'Select a form or a parent org unit to enable',
    },
    completenessStats: {
        defaultMessage: 'Completeness Stats',
        id: 'iaso.completenessStats.title',
    },
    actions: {
        defaultMessage: 'Actions',
        id: 'iaso.label.actions',
    },
    seeChildren: {
        defaultMessage: 'See children',
        id: 'iaso.label.seeChildren',
    },
});

export default MESSAGES;
