const customTableTranslations = formatMessage => ({
    previousText: formatMessage({
        defaultMessage: 'Previous',
        id: 'table.previous',
    }),
    nextText: formatMessage({
        defaultMessage: 'Next',
        id: 'table.next',
    }),
    loadingText: formatMessage({
        defaultMessage: 'Loading...',
        id: 'table.loading',
    }),
    noDataText: formatMessage({
        defaultMessage: 'No result',
        id: 'table.noResult',
    }),
    pageText: formatMessage({
        defaultMessage: 'Page',
        id: 'table.page',
    }),
    ofText: formatMessage({
        defaultMessage: 'of',
        id: 'table.of',
    }),
    rowsText: formatMessage({
        defaultMessage: 'results',
        id: 'table.results',
    }),
}
);
export default customTableTranslations;
