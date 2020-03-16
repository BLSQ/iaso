const filtersGeo = (
    provinces,
    zones,
    areas,
    component,
) => (
    [
        {
            name: 'AS__ZS__province_id',
            urlKey: 'AS__ZS__province_id',
            value: component.props.village.AS__ZS__province_id,
            isMultiSelect: false,
            isClearable: true,
            options: provinces,
            className: !component.props.village.AS__ZS__province_id ? 'form-error' : '',
            placeholder: {
                id: 'main.label.none',
                defaultMessage: 'Aucune',
            },
            label: {
                id: 'main.label.province',
                defaultMessage: 'Province',
            },
            type: 'select',
            callback: value => component.props.updateCurrentVillage({
                ...component.props.village,
                AS__ZS__province_id: value,
            }),
        },
        {
            name: 'AS__ZS_id',
            urlKey: 'AS__ZS_id',
            value: component.props.village.AS__ZS_id,
            hideEmpty: !component.props.village.AS__ZS_id,
            isMultiSelect: false,
            isClearable: true,
            options: zones,
            className: !component.props.village.AS__ZS_id ? 'form-error' : '',
            placeholder: {
                id: 'main.label.none',
                defaultMessage: 'Aucune',
            },
            label: {
                id: 'main.label.zone',
                defaultMessage: 'Zone de santé',
            },
            type: 'select',
            callback: value => component.props.updateCurrentVillage({
                ...component.props.village,
                AS__ZS_id: value,
            }),
        },
        {
            name: 'AS_id',
            urlKey: 'AS_id',
            value: component.props.village.AS_id,
            hideEmpty: !component.props.village.AS_id,
            isMultiSelect: false,
            isClearable: true,
            options: areas,
            className: !component.props.village.AS_id ? 'form-error' : '',
            placeholder: {
                id: 'main.label.none',
                defaultMessage: 'Aucune',
            },
            label: {
                id: 'main.label.area',
                defaultMessage: 'Aire de santé',
            },
            type: 'select',
            callback: value => component.props.updateCurrentVillage({
                ...component.props.village,
                AS_id: value,
            }),
        },
    ]
);

export default filtersGeo;

