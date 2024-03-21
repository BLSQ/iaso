import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    createBudgetProcessTitle: {
        id: 'iaso.polio.budget.title.create_budget',
        defaultMessage: 'Plan a new budget process',
    },
    cancel: {
        id: 'iaso.label.cancel',
        defaultMessage: 'Cancel',
    },
    save: {
        id: 'iaso.label.save',
        defaultMessage: 'Save',
    },
    labelCampaign: {
        id: 'iaso.polio.budget.label.campaign',
        defaultMessage: 'Campaign',
    },
    labelCountry: {
        id: 'iaso.polio.budget.label.country',
        defaultMessage: 'Country',
    },
    labelRound: {
        id: 'iaso.polio.budget.label.round',
        defaultMessage: 'Round',
    },
    modalDeleteYes: {
        id: 'iaso.polio.modal.yes',
        defaultMessage: 'Yes',
    },
    modalDeleteNo: {
        id: 'iaso.polio.modal.no',
        defaultMessage: 'No',
    },
    modalConfirmDeleteBudgetProcess: {
        id: 'iaso.polio.modal.confirm.deleteBudgetProcess',
        defaultMessage: 'Are you sure you want to delete this budget process?',
    },
    requiredField: {
        id: 'iaso.forms.error.fieldRequired',
        defaultMessage: 'This field is required',
    },
    requiredPositiveInteger: {
        id: 'iaso.forms.error.positiveInteger',
        defaultMessage: 'Please use a positive integer',
    },
    requiredUuid: {
        id: 'iaso.forms.error.requiredUuid',
        defaultMessage: 'Please use an UUID',
    },
});

export default MESSAGES;
