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
    canSkipPreviousNodes: {
        id: 'iaso.workflows.label.canSkipPreviousNodes',
        defaultMessage: 'Can skip previous validation step(s)',
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
    validationWorkflows: {
        id: 'iaso.workflows.instance.validationWorkflow.label',
        defaultMessage: 'Validation workflows',
    },
    goToAllForms: {
        id: 'iaso.workflows.goToAllForms',
        defaultMessage: 'Go to all forms',
    },
    workflowDetails: {
        id: 'iaso.workflows.workflowDetails',
        defaultMessage: 'Workflow details',
    },
    workflowName: {
        id: 'iaso.workflows.workflowName',
        defaultMessage: 'Workflow name',
    },
    formsHelp: {
        id: 'iaso.workflows.formsHelp',
        defaultMessage: 'Submissions of these forms follow this workflow.',
    },
    createdByOn: {
        id: 'iaso.workflows.createdByOn',
        defaultMessage: 'Created by {name} on {date}',
    },
    updatedOn: {
        id: 'iaso.workflows.updatedOn',
        defaultMessage: 'Updated {date}',
    },
    stepsOrderHelp: {
        id: 'iaso.workflows.stepsOrderHelp',
        defaultMessage:
            'Steps run from top to bottom. Step 1 is the first validator; the submission moves to the next step once it is approved.',
    },
});

export default MESSAGES;
