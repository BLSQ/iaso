import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    searchPlaceholder: {
        defaultMessage: 'Tap here to search into all villages',
        id: 'search.placeholder.all',
    },
    searchNoResult: {
        defaultMessage: 'No village found',
        id: 'search.result.none',
    },
    searchResult: {
        defaultMessage: 'result(s)',
        id: 'search.result',
    },
    searchMinChar: {
        defaultMessage: 'At least 2 characters',
        id: 'search.result.minChar',
    },
    villageNameLabel: {
        defaultMessage: 'Name',
        id: 'main.label.name',
    },
    populationLabel: {
        defaultMessage: 'Pop.',
        id: 'search.result.populationLabel',
    },
    provinceLabel: {
        defaultMessage: 'Prov.',
        id: 'search.result.provinceLabel',
    },
    zsLabel: {
        defaultMessage: 'Zs',
        id: 'search.result.zsLabel',
    },
    asLabel: {
        defaultMessage: 'As',
        id: 'search.result.asLabel',
    },
});

export default MESSAGES;
