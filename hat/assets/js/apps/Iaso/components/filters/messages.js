import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    sources: {
        id: 'iaso.label.sources',
        defaultMessage: 'Sources',
    },
    noSources: {
        id: 'iaso.orgUnits.sources.noData',
        defaultMessage: 'No source',
    },
    addSource: {
        id: 'iaso.orgUnits.addSource',
        defaultMessage: 'Add source',
    },
    from: {
        id: 'iaso.label.dateFrom',
        defaultMessage: 'Start date',
    },
    to: {
        id: 'iaso.label.dateTo',
        defaultMessage: 'End date',
    },
    clear: {
        id: 'iaso.label.clear',
        defaultMessage: 'Clear',
    },
    forbiddenChars: {
        id: 'iaso.label.forbiddenChars',
        defaultMessage: 'Forbidden characters: "&", "/","?"," "" " and "%"',
    },
    textSearch: {
        id: 'iaso.forms.textSearch',
        defaultMessage: 'Text search',
    },
});

export default MESSAGES;
