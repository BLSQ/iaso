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
    tooMuchDepth: {
        id: 'iaso.completeness.tooMuchDepth',
        defaultMessage: 'Too much depth between parent and type',
    },
});

export default MESSAGES;
