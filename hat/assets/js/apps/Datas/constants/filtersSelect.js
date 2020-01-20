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
    screeningType,
    stage,
    showDeleted,
    showUnDeleted,
} from '../../../utils/constants/filters';

// CASES
const filtersCases = (formatMessage, devices) => (
    [
        testType(formatMessage),
        screeningResult(formatMessage),
        confirmationResult(formatMessage),
        source(formatMessage),
        device(devices),
        stage(formatMessage),
    ]
);

const filtersCases2 = (
    formatMessage,
    coordinationsList,
    teamsList,
    displayDeleteFilters,
) => {
    let tempFilter = [
        coordinations(coordinationsList),
        teams(teamsList),
        located(formatMessage),
        testerType(formatMessage),
        screeningType(formatMessage),
    ];
    if (displayDeleteFilters) {
        tempFilter = tempFilter.concat([
            showDeleted(),
            showUnDeleted(),
        ]);
    }
    return tempFilter;
};

const filtersCasesGeo = (
    provincesList,
    zoneslist,
    areasList,
    villagesList,
    props,
    urlKey,
) => (
    [
        provinces(provincesList, props, urlKey),
        zones(zoneslist, props, urlKey),
        aires(areasList, props, urlKey),
        villages(villagesList, Boolean(props.params.as_id && areasList.length > 0)),
    ]
);


// PATIENTS

const filtersPatients = formatMessage => (
    [
        testType(formatMessage),
        screeningResult(formatMessage),
        confirmationResult(formatMessage),
    ]
);

const filtersPatients2 = formatMessage => (
    [
        testType(formatMessage),
        screeningResult(formatMessage),
        confirmationResult(formatMessage),
        stage(formatMessage),
        images(formatMessage),
        videos(formatMessage),
    ]
);

const filtersPatientsTreatments = (teamsList, formatMessage) => (
    [
        teams(teamsList),
        medecine(formatMessage),
        testerType(formatMessage),
        screeningType(formatMessage),
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

const filtersCasesSearch = (formatMessage, component) => (
    [
        searchLastname(component),
        searchName(component),
        searchPrename(component),
        searchMotherName(component),
        images(formatMessage),
        videos(formatMessage),
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
    provincesList,
    zoneslist,
    areasList,
    villagesList,
    props,
    urlKey,
    coordinationsList = null,
) => {
    const geoFiltersArray = [
        provinces(provincesList, props, urlKey),
        zones(zoneslist, props, urlKey),
        aires(areasList, props, urlKey),
        villages(villagesList, Boolean(props.params.as_id && areasList.length > 0)),
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
