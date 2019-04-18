import {
    users,
    teams,
    habitats,
    provinces,
    zones,
    aires,
    onlySelectedTraps,
    onlyIgnoredTraps,
    onlyIgnoredTargets,
} from '../../../utils/constants/filters';

const filtersVectors = (formatMessage, messages, usersList, teamsList, habitatsList) => (
    [
        users(usersList),
        teams(teamsList),
        habitats(formatMessage, messages, habitatsList),
    ]
);
const filtersVectorsSync = usersList => (
    [
        users(usersList),
    ]
);

const filtersVectors2 = () => (
    [
        onlySelectedTraps(),
        onlyIgnoredTraps(),
        onlyIgnoredTargets(),
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
    filtersVectors2,
    filtersVectorsGeo,
    filtersVectorsSync,
};

