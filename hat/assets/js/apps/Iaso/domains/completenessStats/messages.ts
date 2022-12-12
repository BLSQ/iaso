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
    completeness: {
        id: 'iaso.completeness.title',
        defaultMessage: 'Completeness',
    },
    formsFilled: {
        id: 'iaso.completeness.formsFilled',
        defaultMessage: '# Forms filled',
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
