import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    title: {
        id: 'iaso.workflows.instance.title',
        defaultMessage: 'Validation',
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
    orgUnits: {
        defaultMessage: 'Org units',
        id: 'iaso.label.orgUnit',
    },
    orgUnit: {
        defaultMessage: 'Org unit',
        id: 'iaso.label.orgUnitSingle',
    },
    submission: {
        defaultMessage: 'Submission',
        id: 'iaso.workflows.instance.submission',
    },
    submittedBy: {
        defaultMessage: 'Submitted by',
        id: 'iaso.workflows.instance.submittedBy',
    },
    queueAll: {
        defaultMessage: 'All',
        id: 'iaso.workflows.instance.queue.all',
    },
    queueAwaitingMyAction: {
        defaultMessage: 'Awaiting my action',
        id: 'iaso.workflows.instance.queue.awaitingMyAction',
    },
    queueAwaitingOthers: {
        defaultMessage: 'Awaiting others',
        id: 'iaso.workflows.instance.queue.awaitingOthers',
    },
    queueHandledByMe: {
        defaultMessage: 'Handled by me',
        id: 'iaso.workflows.instance.queue.handledByMe',
    },
    queueRejected: {
        defaultMessage: 'Rejected',
        id: 'iaso.workflows.instance.queue.rejected',
    },
    oldestWaiting: {
        defaultMessage:
            'oldest waiting {days, plural, =0 {less than a day} one {# day} other {# days}}',
        id: 'iaso.workflows.instance.oldestWaiting',
    },
    step: {
        defaultMessage: 'Step {position} / {count}',
        id: 'iaso.workflows.instance.step',
    },
    waitingOnYou: {
        defaultMessage:
            'Waiting on you · {days, plural, =0 {today} one {# day} other {# days}}',
        id: 'iaso.workflows.instance.waitingOnYou',
    },
    waitingOnOthers: {
        defaultMessage:
            'Waiting on others · {days, plural, =0 {today} one {# day} other {# days}}',
        id: 'iaso.workflows.instance.waitingOnOthers',
    },
    youApprovedStep: {
        defaultMessage: 'You approved step {position} on {date}',
        id: 'iaso.workflows.instance.youApprovedStep',
    },
    youRejectedStep: {
        defaultMessage: 'You rejected step {position} on {date}',
        id: 'iaso.workflows.instance.youRejectedStep',
    },
    youApprovedNamedStep: {
        defaultMessage: 'You approved "{name}" on {date}',
        id: 'iaso.workflows.instance.youApprovedNamedStep',
    },
    youRejectedNamedStep: {
        defaultMessage: 'You rejected "{name}" on {date}',
        id: 'iaso.workflows.instance.youRejectedNamedStep',
    },
    resubmittedAfterRejection: {
        defaultMessage: 'Resubmitted after rejection',
        id: 'iaso.workflows.instance.resubmittedAfterRejection',
    },
    review: {
        defaultMessage: 'Review',
        id: 'iaso.workflows.instance.review',
    },
    viewOrgUnit: {
        defaultMessage: 'View org unit',
        id: 'iaso.workflows.instance.viewOrgUnit',
    },
});

export default MESSAGES;
