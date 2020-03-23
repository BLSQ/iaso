import { selectProvince, selectZone, selectArea } from '../../../utils/selectGeo';
import { getYears } from '../../../utils/index';

const MESSAGES = {
    positive: {
        defaultMessage: 'Positive',
        id: 'main.label.positive',
    },
    negative: {
        defaultMessage: 'Negative',
        id: 'main.label.negative',
    },
    YES: {
        defaultMessage: 'Official villages',
        id: 'village.type.official',
    },
    NO: {
        defaultMessage: 'Non official villages',
        id: 'village.type.notofficial',
    },
    OTHER: {
        defaultMessage: 'Villages found during campaign',
        id: 'village.type.campaign',
    },
    NA: {
        defaultMessage: 'Villages found from satellite',
        id: 'village.type.satellite',
    },
    populationOk: {
        defaultMessage: 'With',
        id: 'main.label.with',
    },
    populationNok: {
        defaultMessage: 'Without',
        id: 'village.type.satellite',
    },
    located: {
        defaultMessage: 'Located',
        id: 'main.label.villagelocated',
    },
    unlocated: {
        defaultMessage: 'Not located',
        id: 'village.type.satellite',
    },
};

const getMessage = (defineMessages, key) => defineMessages(MESSAGES[key]);

const filtersZone1 = (
    formatMessage,
    defineMessages,
    villageSources,
) => (
    [
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
                id: 'main.label.allMale',
                defaultMessage: 'All',
            },
            label: {
                id: 'management.village.label.village_official',
                defaultMessage: 'Official village',
            },
            type: 'select',
        },
        {
            name: 'village_source',
            urlKey: 'village_source',
            isMultiSelect: true,
            isClearable: true,
            options: villageSources.map(v => ({ label: v[1], value: v[0] })),
            placeholder: {
                id: 'main.label.allMale',
                defaultMessage: 'All',
            },
            label: {
                id: 'management.village.label.village_source',
                defaultMessage: 'Village source',
            },
            type: 'select',
        },
    ]
);

const filtersZone2 = (
    formatMessage,
    defineMessages,
    resultValue,
) => {
    const years = getYears(10);
    return [
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
                id: 'main.label.allMale',
                defaultMessage: 'Tous',
            },
            label: {
                id: 'management.village.label.results',
                defaultMessage: 'Cass',
            },
            type: 'select',
        },
        {
            isDisabled: !resultValue,
            name: 'years',
            urlKey: 'years',
            isMultiSelect: true,
            isClearable: true,
            options: years.map(y => ({
                label: y,
                value: y,
            })),
            placeholder: {
                id: 'main.label.all',
                defaultMessage: 'All',
            },
            label: {
                id: 'main.label.years',
                defaultMessage: 'Years',
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
                defaultMessage: 'All',
            },
            label: {
                id: 'main.label.location',
                defaultMessage: 'Location',
            },
            type: 'select',
        },
    ];
};

const filtersSearch = (
    formatMessage,
    defineMessages,
    component,
) => (
    [
        {
            name: 'search',
            urlKey: 'search',
            allowEmptySearch: true,
            showResetSearch: true,
            displayResults: false,
            displayIcon: false,
            placeholder: {
                id: 'main.label.search',
                defaultMessage: 'Search',
            },
            label: {
                id: 'main.label.textSearch',
                defaultMessage: 'Text search',
            },
            type: 'search',
            onKeyPressed: () => component.onSearch(),
        },
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
                id: 'main.label.all',
                defaultMessage: 'All',
            },
            label: {
                id: 'main.label.population',
                defaultMessage: 'Population',
            },
            type: 'select',
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
                defaultMessage: 'All',
            },
            label: {
                id: 'main.label.provinces',
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
                defaultMessage: 'All',
            },
            label: {
                id: 'main.label.zones',
                defaultMessage: 'Health zones',
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
                defaultMessage: 'All',
            },
            label: {
                id: 'main.label.area',
                defaultMessage: 'Health areas',
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
