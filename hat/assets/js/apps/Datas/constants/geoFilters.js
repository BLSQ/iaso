export const filtersProvinces = (
    provinces,
    component,
) => (
    [
        {
            name: 'prov_id',
            urlKey: 'prov_id',
            value: component.props.params.prov_id,
            isMultiSelect: false,
            isClearable: true,
            options: provinces,
            className: !component.props.params.prov_id ? 'form-error' : '',
            placeholder: {
                id: 'main.label.none',
                defaultMessage: 'Aucune',
            },
            label: {
                id: 'main.label.province',
                defaultMessage: 'Province',
            },
            type: 'select',
            callback: value => component.updatePatientGeoField('prov_id', value),
        },
    ]
);

export const filtersZones = (
    zones,
    component,
) => (
    [
        {
            name: 'ZS_id',
            urlKey: 'ZS_id',
            value: component.props.params.ZS_id,
            isMultiSelect: false,
            isClearable: true,
            options: zones,
            className: !component.props.params.ZS_id ? 'form-error' : '',
            placeholder: {
                id: 'main.label.none',
                defaultMessage: 'Aucune',
            },
            label: {
                id: 'main.label.zone',
                defaultMessage: 'Zone de santé',
            },
            type: 'select',
            callback: value => component.updatePatientGeoField('ZS_id', value),
        },
    ]
);

export const filtersAreas = (
    areas,
    component,
) => (
    [
        {
            name: 'AS_id',
            urlKey: 'AS_id',
            value: component.props.params.AS_id,
            isMultiSelect: false,
            isClearable: true,
            options: areas,
            className: !component.props.params.AS_id ? 'form-error' : '',
            placeholder: {
                id: 'main.label.none',
                defaultMessage: 'Aucune',
            },
            label: {
                id: 'main.label.area',
                defaultMessage: 'Aire de santé',
            },
            type: 'select',
            callback: value => component.updatePatientGeoField('AS_id', value),
        },
    ]
);

export const filtersVillage = (
    villages,
    component,
) => (
    [
        {
            name: 'vil_id',
            urlKey: 'vil_id',
            value: component.props.params.vil_id,
            isMultiSelect: false,
            isClearable: true,
            options: villages,
            className: !component.props.params.vil_id ? 'form-error' : '',
            placeholder: {
                id: 'main.label.none',
                defaultMessage: 'None',
            },
            label: {
                id: 'main.label.village',
                defaultMessage: 'Village',
            },
            type: 'select',
            callback: value => component.updatePatientGeoField('vil_id', value),
        },
    ]
);
