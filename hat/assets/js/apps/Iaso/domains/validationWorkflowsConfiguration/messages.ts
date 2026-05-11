import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    configureInstancesValidation: {
        id: 'iaso.label.configureInstancesValidation',
        defaultMessage: 'Configure validation workflows',
    },
    create: {
        defaultMessage: 'Create',
        id: 'iaso.label.create',
    },
    name: {
        defaultMessage: 'Name',
        id: 'iaso.label.name',
    },
    created_at: {
        id: 'iaso.instance.created_at',
        defaultMessage: 'Created in Iaso',
    },
    forms: {
        defaultMessage: 'Forms',
        id: 'iaso.forms.title',
    },
    updated_at: {
        id: 'iaso.instance.updated_at',
        defaultMessage: 'Updated',
    },
    created_by: {
        id: 'iaso.label.created_by',
        defaultMessage: 'Created by',
    },
    updated_by: {
        id: 'iaso.label.updated_by',
        defaultMessage: 'Updated by',
    },
    actions: {
        defaultMessage: 'Action(s)',
        id: 'iaso.label.actions',
    },
    edit: {
        defaultMessage: 'Edit',
        id: 'iaso.label.edit',
    },
    deleteWorkflow: {
        id: 'iaso.submissions.label.deleteWorkflow',
        defaultMessage: 'Delete workflow',
    },
    search: {
        defaultMessage: 'Search',
        id: 'iaso.search',
    },
    addInstancesValidationWorkflow: {
        id: 'iaso.label.addInstancesValidationWorkflow',
        defaultMessage: 'Add validation workflow',
    },
    infos: {
        defaultMessage: 'Informations',
        id: 'iaso.instance.infos',
    },
    steps: {
        id: 'iaso.form.label.steps',
        defaultMessage: 'step(s)',
    },
    canSkipPreviousNodes: {
        id: 'iaso.workflows.label.canSkipPreviousNodes',
        defaultMessage: 'Can skip previous steps',
    },
    saveOrder: {
        id: 'iaso.workflows.saveOrder',
        defaultMessage: 'Save order',
    },
    resetOrder: {
        id: 'iaso.workflows.resetOrder',
        defaultMessage: 'Reset order',
    },
    deleteNodeQuestion: {
        id: 'iaso.workflows.label.deleteNodeQuestion',
        defaultMessage: 'Delete step?',
    },
    color: {
        defaultMessage: 'Color',
        id: 'iaso.label.color',
    },
    description: {
        id: 'iaso.form.label.description',
        defaultMessage: 'Description',
    },
    rolesRequired: {
        id: 'iaso.validation.label.rolesRequired',
        defaultMessage: 'Roles required',
    },
    save: {
        id: 'iaso.label.save',
        defaultMessage: 'Save',
    },
    requiredField: {
        id: 'iaso.forms.error.fieldRequired',
        defaultMessage: 'This field is required',
    },
    cancel: {
        id: 'iaso.label.cancel',
        defaultMessage: 'Cancel',
    },
});

export default MESSAGES;
