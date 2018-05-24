const customTableTranslations = formatMessage => ({
    previousText: formatMessage({
        defaultMessage: 'Précédent',
        id: 'table.previous',
    }),
    nextText: formatMessage({
        defaultMessage: 'Suivant',
        id: 'table.next',
    }),
    loadingText: formatMessage({
        defaultMessage: 'Chargement...',
        id: 'table.loading',
    }),
    noDataText: formatMessage({
        defaultMessage: 'Aucun résultat',
        id: 'table.noResult',
    }),
    pageText: formatMessage({
        defaultMessage: 'Page',
        id: 'table.page',
    }),
    ofText: formatMessage({
        defaultMessage: 'de',
        id: 'table.of',
    }),
    rowsText: formatMessage({
        defaultMessage: 'résultats',
        id: 'table.results',
    }),
}
);
export default customTableTranslations;
