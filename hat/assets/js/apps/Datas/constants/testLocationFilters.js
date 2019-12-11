const testLocationFilters = (
    provinces,
    zones,
    areas,
    component,
) => (
    [
        {
            name: 'province_id',
            urlKey: 'province_id',
            value: component.props.currentTest.province_id,
            isMultiSelect: false,
            isClearable: true,
            options: provinces,
            className: !component.props.currentTest.province_id ? 'form-error' : '',
            placeholder: {
                id: 'main.label.none',
                defaultMessage: 'Aucune',
            },
            label: {
                id: 'main.label.province',
                defaultMessage: 'Province',
            },
            type: 'select',
            callback: value => component.onChange('province_id', value, 'currentTest'),
        },
        {
            name: 'ZS_id',
            urlKey: 'ZS_id',
            value: component.props.currentTest.ZS_id,
            hideEmpty: !component.props.currentTest.ZS_id,
            isMultiSelect: false,
            isClearable: true,
            options: zones,
            className: !component.props.currentTest.ZS_id ? 'form-error' : '',
            placeholder: {
                id: 'main.label.none',
                defaultMessage: 'Aucune',
            },
            label: {
                id: 'main.label.zone',
                defaultMessage: 'Zone de santé',
            },
            type: 'select',
            callback: value => component.onChange('ZS_id', value, 'currentTest'),
        },
        {
            name: 'AS_id',
            urlKey: 'AS_id',
            value: component.props.currentTest.AS_id,
            hideEmpty: !component.props.currentTest.AS_id,
            isMultiSelect: false,
            isClearable: true,
            options: areas,
            className: !component.props.currentTest.AS_id ? 'form-error' : '',
            placeholder: {
                id: 'main.label.none',
                defaultMessage: 'Aucune',
            },
            label: {
                id: 'main.label.area',
                defaultMessage: 'Aire de santé',
            },
            type: 'select',
            callback: value => component.onChange('AS_id', value, 'currentTest'),
        },
    ]
);

export default testLocationFilters;
