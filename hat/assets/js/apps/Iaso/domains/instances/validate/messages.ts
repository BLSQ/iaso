import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    form: {
        id: 'iaso.instance.formShort',
        defaultMessage: 'Form',
    },
    validate: {
        id: 'iaso.label.validate',
        defaultMessage: 'Validate',
    },
    validateInstance: {
        id: 'iaso.label.validateInstance',
        defaultMessage: 'Validate submission',
    },
    comment: {
        id: 'iaso.label.comment',
        defaultMessage: 'Comment',
    },
    validation: {
        defaultMessage: 'Validation',
        id: 'iaso.label.validation',
    },
    step: {
        id: 'iaso.form.label.step',
        defaultMessage: 'step',
    },
    bypassedSteps: {
        id: 'iaso.form.label.bypassedSteps',
        defaultMessage: 'Bypassed steps',
    },
    approve: {
        defaultMessage: 'Approve',
        id: 'iaso.validation.label.approve',
    },
    reject: {
        defaultMessage: 'Reject',
        id: 'iaso.label.reject',
    },
    current: {
        defaultMessage: 'Current',
        id: 'iaso.label.current',
    },
    previous: {
        defaultMessage: 'Previous',
        id: 'iaso.label.previous',
    },
    toggleShowAllFields: {
        defaultMessage: 'Show all fields',
        id: 'iaso.label.toggleShowAllFields',
    },
    commentForRejection: {
        defaultMessage: 'Add comment to enable rejection',
        id: 'iaso.validationWorkflow.label.commentForRejection',
    },
    noPreviousVersion: {
        id: 'iaso.validation.label.noPreviousVersion',
        defaultMessage: 'No previous version to compare',
    },
});

export default MESSAGES;
