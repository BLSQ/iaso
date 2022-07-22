export const RESET_ORG_UNITS = 'RESET_ORG_UNITS';
export const SET_SUB_ORG_UNIT = 'SET_SUB_ORG_UNIT';
export const SET_ORG_UNIT_TYPES = 'SET_ORG_UNIT_TYPES';
export const SET_SOURCES = 'SET_SOURCES';
export const SET_FETCHING_ORG_UNITS_TYPES = 'SET_FETCHING_ORG_UNITS_TYPES';

export const resetOrgUnits = () => ({
    type: RESET_ORG_UNITS,
});

export const setCurrentSubOrgUnit = orgUnit => ({
    type: SET_SUB_ORG_UNIT,
    payload: orgUnit,
});

export const setOrgUnitTypes = orgUnitTypes => ({
    type: SET_ORG_UNIT_TYPES,
    payload: orgUnitTypes,
});

export const setSources = sources => ({
    type: SET_SOURCES,
    payload: sources,
});

export const setFetchingOrgUnitTypes = fetching => ({
    type: SET_FETCHING_ORG_UNITS_TYPES,
    payload: fetching,
});
