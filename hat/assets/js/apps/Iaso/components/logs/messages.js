import { defineMessages } from 'react-intl';

export const MESSAGES = defineMessages({
    seeChanges: {
        id: 'iaso.logs.seeChanges',
        defaultMessage: 'See only changes',
    },
    seeAll: {
        id: 'iaso.logs.seeAll',
        defaultMessage: 'See all fields',
    },
    noDifference: {
        id: 'iaso.logs.noDifference',
        defaultMessage: 'No difference between revisions',
    },
    goToRevision: {
        id: 'iaso.logs.goToRevision',
        defaultMessage: 'Keep all',
    },
    goToRevisionQuestion: {
        id: 'iaso.logs.goToRevisionQuestion',
        defaultMessage: 'Do you confirm the roll back to this revision ?',
    },
    goToRevisionText: {
        id: 'iaso.logs.goToRevisionText',
        defaultMessage: 'All fields will be replaced',
    },
    goToRevisionChanges: {
        id: 'iaso.logs.goToRevisionChanges',
        defaultMessage: 'Keep only changes',
    },
    goToRevisionTextChanges: {
        id: 'iaso.logs.goToRevisionTextChanges',
        defaultMessage: 'Modified fields will be replaced',
    },
    loading: {
        id: 'iaso.label.loading',
        defaultMessage: 'Loading',
    },
    before: {
        id: 'iaso.label.before',
        defaultMessage: 'Before',
    },
    after: {
        id: 'iaso.label.after',
        defaultMessage: 'After',
    },
    deleted: {
        id: 'iaso.label.deleted',
        defaultMessage: 'Deleted',
    },
    created: {
        id: 'iaso.label.created',
        defaultMessage: 'Creation',
    },
    renderError: {
        id: 'iaso.label.renderError',
        defaultMessage: 'Error rendering value',
    },
    REJECTED: {
        defaultMessage: 'Rejected',
        id: 'iaso.forms.rejectedCap',
    },
    NEW: {
        defaultMessage: 'New',
        id: 'iaso.forms.newCap',
    },
    VALID: {
        defaultMessage: 'Valid',
        id: 'iaso.forms.valid',
    },
});

export default MESSAGES;
