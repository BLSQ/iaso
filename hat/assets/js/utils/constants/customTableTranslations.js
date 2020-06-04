import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    previousText: {
        defaultMessage: 'Previous',
        id: 'table.previous',
    },
    nextText: {
        defaultMessage: 'Next',
        id: 'table.next',
    },
    loadingText: {
        defaultMessage: 'Loading...',
        id: 'table.loading',
    },
    noDataText: {
        defaultMessage: 'No result',
        id: 'table.noResult',
    },
    pageText: {
        defaultMessage: 'Page',
        id: 'table.page',
    },
    ofText: {
        defaultMessage: 'of',
        id: 'table.of',
    },
    rowsText: {
        defaultMessage: 'results',
        id: 'table.results',
    },
});

const customTableTranslations = formatMessage => ({
    previousText: formatMessage(MESSAGES.previousText),
    nextText: formatMessage(MESSAGES.nextText),
    loadingText: formatMessage(MESSAGES.loadingText),
    noDataText: formatMessage(MESSAGES.noDataText),
    pageText: formatMessage(MESSAGES.pageText),
    ofText: formatMessage(MESSAGES.ofText),
    rowsText: formatMessage(MESSAGES.rowsText),
});
export default customTableTranslations;
