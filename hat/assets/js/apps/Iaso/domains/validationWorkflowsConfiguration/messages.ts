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
    general: {
        id: 'iaso.instance.general',
        defaultMessage: 'General',
    },
    canSkipPreviousNodes: {
        id: 'iaso.workflows.label.canSkipPreviousNodes',
        defaultMessage: 'Can skip previous steps',
    },
    deleteNodeQuestion: {
        id: 'iaso.workflows.label.deleteNodeQuestion',
        defaultMessage: 'Delete step?',
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
    validationSteps: {
        id: 'iaso.workflows.validationSteps',
        defaultMessage: 'Validation steps',
    },
    addStep: {
        id: 'iaso.workflows.addStep',
        defaultMessage: 'Add step',
    },
    stepName: {
        id: 'iaso.workflows.stepName',
        defaultMessage: 'Step name',
    },
    validatedByUserRole: {
        id: 'iaso.workflows.validatedByUserRole',
        defaultMessage: 'Validated by user role',
    },
    noSteps: {
        id: 'iaso.workflows.noSteps',
        defaultMessage: 'No steps yet',
    },
    duplicateStepName: {
        id: 'iaso.workflows.duplicateStepName',
        defaultMessage: 'Step names must be unique',
    },
    linkedForms: {
        id: 'iaso.workflows.linkedForms',
        defaultMessage:
            '{count, plural, one {# form linked to this workflow:} other {# forms linked to this workflow:}}',
    },
    noLinkedForms: {
        id: 'iaso.workflows.noLinkedForms',
        defaultMessage: 'No form linked to this workflow',
    },
    manageLinkedForms: {
        id: 'iaso.workflows.manageLinkedForms',
        defaultMessage: 'Manage linked forms',
    },
    validationWorkflows: {
        id: 'iaso.workflows.instance.validationWorkflow.label',
        defaultMessage: 'Validation workflows',
    },
});

export default MESSAGES;
