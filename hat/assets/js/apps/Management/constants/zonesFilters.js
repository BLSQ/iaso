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
                defaultMessage: 'Recherche',
            },
            label: {
                id: 'management.village.label.search',
                defaultMessage: 'Recherche textuelle',
            },
            type: 'search',
            onKeyPressed: () => component.onSearch(),
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
                id: 'cases.label.provinces',
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
};

