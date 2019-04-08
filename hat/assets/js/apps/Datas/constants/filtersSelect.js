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
    testerType,
    device,
    images,
    videos,
} from '../../../utils/constants/filters';

// CASES
const filtersCases = (formatMessage, defineMessages, devices) => (
    [
        testType(formatMessage, defineMessages),
        screeningResult(formatMessage, defineMessages),
        confirmationResult(formatMessage, defineMessages),
        source(formatMessage, defineMessages),
        device(devices),
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
        testerType(formatMessage, defineMessages),
    ]
);

const filtersCasesSearch = (formatMessage, defineMessages, component) => (
    [
        searchLastname(component),
        searchName(component),
        searchPrename(component),
        images(formatMessage, defineMessages),
        videos(formatMessage, defineMessages),
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
        images(formatMessage, defineMessages),
        videos(formatMessage, defineMessages),
    ]
);

const filtersPatientsTreatments = (teamsList, formatMessage, defineMessages) => (
    [
        teams(teamsList),
        medecine(formatMessage),
        testerType(formatMessage, defineMessages),
        onlyTreatedPatients(),
        onlyDead(),
        onlyDupes(),
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

const filtersPatientsSearch = (devices, component) => (
    [
        searchLastname(component),
        searchName(component),
        searchPrename(component),
        searchMotherName(component),
        device(devices),
    ]
);
const filtersDuplicatesPatientsSearch = component => (
    [
        searchLastname(component),
        searchName(component),
        searchPrename(component),
        searchMotherName(component),
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
    filtersDuplicatesPatientsSearch,
};

