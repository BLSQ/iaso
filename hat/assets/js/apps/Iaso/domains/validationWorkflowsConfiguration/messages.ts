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
    delete: {
        id: 'iaso.label.delete',
        defaultMessage: 'Delete',
    },
    deleteWorkflow: {
        id: 'iaso.submissions.label.deleteWorkflow',
        defaultMessage: 'Delete workflow',
    },
    duplicate: {
        id: 'iaso.workflows.duplicate',
        defaultMessage: 'Duplicate',
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
    validationWorkflows: {
        id: 'iaso.workflows.instance.validationWorkflow.label',
        defaultMessage: 'Validation workflows',
    },
    listDescription: {
        id: 'iaso.workflows.listDescription',
        defaultMessage:
            'A workflow sets the validation steps. Link it to one or more forms; their submissions then follow it.',
    },
    createWorkflow: {
        id: 'iaso.workflows.createWorkflow',
        defaultMessage: 'Create workflow',
    },
    workflow: {
        id: 'iaso.workflows.workflow',
        defaultMessage: 'Workflow',
    },
    linkedFormsCount: {
        id: 'iaso.workflows.linkedFormsCount',
        defaultMessage:
            '{count, plural, =0 {No form linked} one {# form linked} other {# forms linked}}',
    },
    stepsColumn: {
        id: 'iaso.workflows.steps',
        defaultMessage: 'Steps',
    },
    stepsCount: {
        id: 'iaso.workflows.stepsCount',
        defaultMessage:
            '{count, plural, =0 {No step} one {# step} other {# steps}}',
    },
    lastUpdated: {
        id: 'iaso.workflows.instance.lastUpdatedAt.label',
        defaultMessage: 'Last updated',
    },
});

export default MESSAGES;
