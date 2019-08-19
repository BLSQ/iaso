import { selectProvince } from '../../../utils/selectGeo';


const filtersSearch = component => (
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
    ]
);

const filtersShapes = formatMessage => (
    [
        {
            name: 'shapes',
            urlKey: 'shapes',
            hideEmpty: true,
            isMultiSelect: false,
            isClearable: true,
            options: [
                {
                    label: formatMessage({
                        defaultMessage: 'With',
                        id: 'main.label.with',
                    }),
                    value: 'with',
                },
                {
                    label: formatMessage({
                        defaultMessage: 'Without',
                        id: 'main.label.without',
                    }),
                    value: 'without',
                },
            ],
            placeholder: {
                id: 'main.label.allMale',
                defaultMessage: 'Tous',
            },
            label: {
                id: 'main.label.shapes',
                defaultMessage: 'Shapes',
            },
            type: 'select',
        },
    ]
);

const filtersGeo = (
    provinces,
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
                id: 'main.label.provinces',
                defaultMessage: 'Provinces',
            },
            type: 'select',
            callback: value => selectProvince(value, props, urlKey),
        },
    ]
);

export {
    filtersSearch,
    filtersGeo,
    filtersShapes,
};

