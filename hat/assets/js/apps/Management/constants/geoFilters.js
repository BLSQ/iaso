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
            value: component.props.village.province_id,
            isMultiSelect: false,
            isClearable: true,
            options: provinces,
            placeholder: {
                id: 'main.label.none',
                defaultMessage: 'Aucune',
            },
            label: {
                id: 'main.label.province',
                defaultMessage: 'Province',
            },
            type: 'select',
            callback: value => component.updateVillageField('province_id', value),
        },
        {
            name: 'zs_id',
            urlKey: 'zs_id',
            value: component.props.village.ZS_id,
            hideEmpty: !component.props.village.ZS_id,
            isMultiSelect: false,
            isClearable: true,
            options: zones,
            placeholder: {
                id: 'main.label.none',
                defaultMessage: 'Aucune',
            },
            label: {
                id: 'main.label.zone',
                defaultMessage: 'Zone de santé',
            },
            type: 'select',
            callback: value => component.updateVillageField('ZS_id', value),
        },
        {
            name: 'as_id',
            urlKey: 'as_id',
            value: component.props.village.AS_id,
            hideEmpty: !component.props.village.AS_id,
            isMultiSelect: false,
            isClearable: true,
            options: areas,
            placeholder: {
                id: 'main.label.none',
                defaultMessage: 'Aucune',
            },
            label: {
                id: 'main.label.area',
                defaultMessage: 'Aire de santé',
            },
            type: 'select',
            callback: value => component.updateVillageField('AS_id', value),
        },
    ]
);

export default filtersGeo;

