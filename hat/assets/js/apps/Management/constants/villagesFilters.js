import { selectProvince, selectZone, selectArea } from '../../../utils/selectGeo';

const MESSAGES = {
    positive: {
        defaultMessage: 'Positif',
        id: 'main.label.postive',
    },
    negative: {
        defaultMessage: 'Négatif',
        id: 'main.label.negative',
    },
    YES: {
        defaultMessage: 'Villages officiels',
        id: 'village.type.official',
    },
    NO: {
        defaultMessage: 'Villages non officiels',
        id: 'village.type.notofficial',
    },
    OTHER: {
        defaultMessage: 'Villages trouvés lors de campagne',
        id: 'village.type.campaign',
    },
    NA: {
        defaultMessage: 'Villages issus d\'images satellite',
        id: 'village.type.satellite',
    },
    populationOk: {
        defaultMessage: 'Avec',
        id: 'village.type.satellite',
    },
    populationNok: {
        defaultMessage: 'Sans',
        id: 'village.type.satellite',
    },
    located: {
        defaultMessage: 'Localisés',
        id: 'village.type.located',
    },
    unlocated: {
        defaultMessage: 'Non Localisés',
        id: 'village.type.satellite',
    },
};

const getMessage = (defineMessages, key) => defineMessages(MESSAGES[key]);

const filtersZone1 = (
    formatMessage,
    defineMessages,
) => (
    [
        {
            name: 'population',
            urlKey: 'population',
            isMultiSelect: false,
            isClearable: true,
            options: [
                {
                    label: formatMessage(getMessage(defineMessages, 'populationOk')),
                    value: 'populationOk',
                },
                {
                    label: formatMessage(getMessage(defineMessages, 'populationNok')),
                    value: 'populationNok',
                },
            ],
            placeholder: {
                id: 'management.label.all',
                defaultMessage: 'Toutes',
            },
            label: {
                id: 'management.village.label.population',
                defaultMessage: 'Population',
            },
            type: 'select',
        },
        {
            name: 'village_official',
            urlKey: 'village_official',
            isMultiSelect: true,
            isClearable: true,
            options: [
                {
                    label: formatMessage(getMessage(defineMessages, 'YES')),
                    value: 'YES',
                },
                {
                    label: formatMessage(getMessage(defineMessages, 'NO')),
                    value: 'NO',
                },
                {
                    label: formatMessage(getMessage(defineMessages, 'OTHER')),
                    value: 'OTHER',
                },
                {
                    label: formatMessage(getMessage(defineMessages, 'NA')),
                    value: 'NA',
                },
            ],
            placeholder: {
                id: 'management.label.allMasc',
                defaultMessage: 'Tous',
            },
            label: {
                id: 'management.village.label.village_official',
                defaultMessage: 'Village Officiel',
            },
            type: 'select',
        },
    ]
);

const filtersZone2 = (
    formatMessage,
    defineMessages,
) => (
    [
        {
            name: 'results',
            urlKey: 'results',
            isMultiSelect: false,
            isClearable: true,
            options: [
                {
                    label: formatMessage(getMessage(defineMessages, 'positive')),
                    value: 'positive',
                },
                {
                    label: formatMessage(getMessage(defineMessages, 'negative')),
                    value: 'negative',
                },
            ],
            placeholder: {
                id: 'main.label.allMasc',
                defaultMessage: 'Tous',
            },
            label: {
                id: 'management.village.label.results',
                defaultMessage: 'Cas',
            },
            type: 'select',
        },
        {
            name: 'unlocated',
            urlKey: 'unlocated',
            isMultiSelect: false,
            isClearable: true,
            options: [
                {
                    label: formatMessage(getMessage(defineMessages, 'located')),
                    value: 'located',
                },
                {
                    label: formatMessage(getMessage(defineMessages, 'unlocated')),
                    value: 'unlocated',
                },
            ],
            placeholder: {
                id: 'main.label.all',
                defaultMessage: 'Toutes',
            },
            label: {
                id: 'management.village.label.located',
                defaultMessage: 'Localisation',
            },
            type: 'select',
        },
    ]
);

const filtersSearch = () => (
    [
        {
            name: 'search',
            urlKey: 'search',
            allowEmptySearch: true,
            showResetSearch: true,
            displayResults: false,
            placeholder: {
                id: 'main.label.search',
                defaultMessage: 'Recherche',
            },
            label: {
                id: 'management.village.label.search',
                defaultMessage: 'Recherche textuelle',
            },
            type: 'search',
        },
    ]
);

const filtersGeo = (
    provinces,
    zones,
    areas,
    props,
    urlKey,
) => (
    [
        {
            name: 'province_id',
            urlKey: 'province_id',
            isMultiSelect: true,
            isClearable: true,
            options: provinces,
            placeholder: {
                id: 'main.label.all',
                defaultMessage: 'Toutes',
            },
            label: {
                id: 'cases.label.provinces',
                defaultMessage: 'Provinces',
            },
            type: 'select',
            callback: value => selectProvince(value, props, urlKey),
        },
        {
            name: 'zs_id',
            urlKey: 'zs_id',
            hideEmpty: true,
            isMultiSelect: true,
            isClearable: true,
            options: zones,
            placeholder: {
                id: 'main.label.all',
                defaultMessage: 'Toutes',
            },
            label: {
                id: 'cases.label.zones',
                defaultMessage: 'Zones de santé',
            },
            type: 'select',
            callback: value => selectZone(value, props, urlKey),
        },
        {
            name: 'as_id',
            urlKey: 'as_id',
            hideEmpty: true,
            isMultiSelect: true,
            isClearable: true,
            options: areas,
            placeholder: {
                id: 'main.label.all',
                defaultMessage: 'Toutes',
            },
            label: {
                id: 'cases.label.areas',
                defaultMessage: 'Aire de santé',
            },
            type: 'select',
            callback: value => selectArea(value, props, urlKey),
        },
    ]
);

export {
    filtersZone1,
    filtersZone2,
    filtersSearch,
    filtersGeo,
};

