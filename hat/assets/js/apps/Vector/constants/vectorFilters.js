import {
    users,
    habitats,
    provinces,
    zones,
    aires,
    onlyReferenceSites,
} from '../../../utils/constants/filters';

const filtersVectors = (formatMessage, messages, usersList, habitatsList) => (
    [
        users(usersList),
        habitats(formatMessage, messages, habitatsList),
        onlyReferenceSites(),
    ]
);
const filtersVectorsGeo = (
    provincesList,
    zoneslist,
    areasList,
    props,
    urlKey,
) => (
    [
        provinces(provincesList, props, urlKey),
        zones(zoneslist, props, urlKey),
        aires(areasList, props, urlKey),
    ]
);

export {
    filtersVectors,
    filtersVectorsGeo,
};

