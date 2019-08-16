import { testTypeImage, testTypeVideo, users, onlyCheckedTests } from '../../../utils/constants/filters';
import { selectProvince, selectZone, selectArea } from '../../../utils/selectGeo';

const filtersTypes = () => (
    [
        testTypeImage(),
        testTypeVideo(),
    ]
);

const filtersUsers = (usersList, userTitle) => (
    [
        users(usersList, userTitle),
    ]
);

const filtersValidators = (usersList, userTitle) => (
    [
        users(usersList, userTitle, false, 'validatorId'),
    ]
);

const filtersChecked = () => (
    [
        onlyCheckedTests(),
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
    filtersTypes,
    filtersUsers,
    filtersGeo,
    filtersChecked,
    filtersValidators,
};
