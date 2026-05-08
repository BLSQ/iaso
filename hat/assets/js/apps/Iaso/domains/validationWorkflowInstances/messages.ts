import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    title: {
        id: 'iaso.workflows.instance.title',
        defaultMessage: 'Validation workflows related submissions',
    },
    status: {
        id: 'iaso.workflows.instance.status.label',
        defaultMessage: 'Status',
    },
    project: {
        id: 'iaso.workflows.instance.project.label',
        defaultMessage: 'Project',
    },
    projects: {
        id: 'iaso.workflows.instance.projects.label',
        defaultMessage: 'Projects',
    },
    viewSubmissionDetails: {
        defaultMessage: 'View submission details',
        id: 'iaso.instance.details',
    },
    actions: {
        defaultMessage: 'Action(s)',
        id: 'iaso.label.actions',
    },
    form: {
        id: 'iaso.workflows.instance.form.label',
        defaultMessage: 'Form',
    },
    forms: {
        id: 'iaso.workflows.instance.forms.label',
        defaultMessage: 'Forms',
    },
    last_updated_at: {
        id: 'iaso.workflows.instance.lastUpdatedAt.label',
        defaultMessage: 'Last updated',
    },
    requiresUserAction: {
        defaultMessage: 'Requires my action',
        id: 'iaso.workflows.instance.requiresAction.label',
    },
    validationWorkflows: {
        defaultMessage: 'Validation workflows',
        id: 'iaso.workflows.instance.validationWorkflow.label',
    },
    statusApproved: {
        defaultMessage: 'Approved',
        id: 'iaso.workflows.instance.status.approved',
    },

    statusRejected: {
        defaultMessage: 'Rejected',
        id: 'iaso.workflows.instance.status.rejected',
    },

    statusPending: {
        defaultMessage: 'Pending',
        id: 'iaso.workflows.instance.status.pending',
    },
    userHasBeenInvolvedTooltip: {
        defaultMessage: 'You took previous actions in that workflow',
        id: 'iaso.workflows.instance.userHasBeenInvolvedTooltip',
    },
    requiresUserActionTooltip: {
        defaultMessage: 'Waiting for your action',
        id: 'iaso.workflows.instance.requiresUserActionTooltip',
    },
    yes: {
        defaultMessage: 'Yes',
        id: 'iaso.label.yes',
    },
    no: {
        defaultMessage: 'No',
        id: 'iaso.label.no',
    },
});

export default MESSAGES;
