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
});

export default MESSAGES;
