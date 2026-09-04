import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    answeredQuestions: {
        defaultMessage: 'Sent selected answers',
        id: 'iaso.chatPanel.answeredQuestions',
    },
    attachFile: {
        defaultMessage: 'Attach a file',
        id: 'iaso.chatPanel.attachFile',
    },
    defaultAttachmentMessage: {
        defaultMessage: 'Please review the attached file(s).',
        id: 'iaso.chatPanel.defaultAttachmentMessage',
    },
    placeholder: {
        defaultMessage: 'Type a message...',
        id: 'iaso.chatPanel.placeholder',
    },
    revert: {
        defaultMessage: 'Revert this change',
        id: 'iaso.chatPanel.revert',
    },
    reverted: {
        defaultMessage: 'Reverted',
        id: 'iaso.chatPanel.reverted',
    },
    revertConfirmTitle: {
        defaultMessage: 'Revert this change?',
        id: 'iaso.chatPanel.revertConfirmTitle',
    },
    revertConfirmMessage: {
        defaultMessage:
            'This cannot be undone. Every change made after this one will be reverted as well.',
        id: 'iaso.chatPanel.revertConfirmMessage',
    },
    revertConfirmAccept: {
        defaultMessage: 'Revert',
        id: 'iaso.chatPanel.revertConfirmAccept',
    },
    revertConfirmCancel: {
        defaultMessage: 'Cancel',
        id: 'iaso.chatPanel.revertConfirmCancel',
    },
    sendAnswers: {
        defaultMessage: 'Send answers',
        id: 'iaso.chatPanel.sendAnswers',
    },
});

export default MESSAGES;
