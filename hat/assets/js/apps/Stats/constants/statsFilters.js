const filtersGeo = (
    provinces,
    zones,
    areas,
    component,
) => (
    [
        {
            name: 'province_id',
            urlKey: 'province_id',
            isMultiSelect: false,
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
            callback: value => component.paramChangeHandler('province_id', value),
        },
        {
            name: 'zs_id',
            urlKey: 'zs_id',
            hideEmpty: true,
            isMultiSelect: false,
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
            callback: value => component.paramChangeHandler('zs_id', value),
        },
        {
            name: 'as_id',
            urlKey: 'as_id',
            hideEmpty: true,
            isMultiSelect: false,
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
            callback: value => component.paramChangeHandler('as_id', value),
        },
    ]
);

export default filtersGeo;

