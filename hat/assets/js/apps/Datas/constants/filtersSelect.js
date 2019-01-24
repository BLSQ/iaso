import {
    testType,
    screeningResult,
    confirmationResult,
    source,
    coordinations,
    teams,
    located,
    searchLastname,
    searchName,
    searchPrename,
    workZones,
    provinces,
    zones,
    aires,
    villages,
    searchMotherName,
    onlyDupes,
    medecine,
    onlyTreatedPatients,
    onlyDead,
} from '../../../utils/constants/filters';

// CASES
const filtersCases = (formatMessage, defineMessages) => (
    [
        testType(formatMessage, defineMessages),
        screeningResult(formatMessage, defineMessages),
        confirmationResult(formatMessage, defineMessages),
        source(formatMessage, defineMessages),
    ]
);

const filtersCases2 = (
    formatMessage,
    defineMessages,
    coordinationsList,
    teamsList,
) => (
    [
        coordinations(coordinationsList),
        teams(teamsList),
        located(formatMessage, defineMessages),
    ]
);

const filtersCasesSearch = () => (
    [
        searchLastname(),
        searchName(),
        searchPrename(),
    ]
);

const filtersCasesGeo = (
    workzonesList,
    provincesList,
    zoneslist,
    areasList,
    villagesList,
    props,
    urlKey,
) => (
    [
        workZones(workzonesList, props, urlKey),
        provinces(provincesList, props, urlKey),
        zones(zoneslist, props, urlKey),
        aires(areasList, props, urlKey),
        villages(villagesList),
    ]
);


// PATIENTS

const filtersPatients = (formatMessage, defineMessages) => (
    [
        testType(formatMessage, defineMessages),
        screeningResult(formatMessage, defineMessages),
        confirmationResult(formatMessage, defineMessages),
    ]
);

const filtersPatients2 = (
    formatMessage,
    defineMessages,
) => (
    [
        testType(formatMessage, defineMessages),
        screeningResult(formatMessage, defineMessages),
        confirmationResult(formatMessage, defineMessages),
        onlyDupes(),
    ]
);

const filtersPatientsTreatments = (teamsList, formatMessage) => (
    [
        teams(teamsList),
        medecine(formatMessage),
        onlyTreatedPatients(),
        onlyDead(),
    ]
);

const filtersPatientsDuplicates = (
    coordinationsList,
    teamsList,
) => (
    [
        coordinations(coordinationsList),
        teams(teamsList),
    ]
);

const filtersPatientsSearch = () => (
    [
        searchLastname(),
        searchName(),
        searchPrename(),
        searchMotherName(),
    ]
);

const filtersPatientsGeo = (
    workzonesList,
    provincesList,
    zoneslist,
    areasList,
    villagesList,
    props,
    urlKey,
    coordinationsList = null,
) => {
    const geoFiltersArray =
    [
        workZones(workzonesList, props, urlKey),
        provinces(provincesList, props, urlKey),
        zones(zoneslist, props, urlKey),
        aires(areasList, props, urlKey),
        villages(villagesList),
    ];
    if (coordinationsList) {
        geoFiltersArray.unshift(coordinations(coordinationsList));
    }
    return geoFiltersArray;
};
export {
    filtersCases,
    filtersCases2,
    filtersCasesSearch,
    filtersCasesGeo,
    filtersPatients,
    filtersPatients2,
    filtersPatientsSearch,
    filtersPatientsGeo,
    filtersPatientsDuplicates,
    filtersPatientsTreatments,
};

