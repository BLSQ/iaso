export const RESET_ORG_UNITS = 'RESET_ORG_UNITS';
export const SET_ORG_UNIT_TYPES = 'SET_ORG_UNIT_TYPES';
export const SET_SOURCES = 'SET_SOURCES';

export const resetOrgUnits = () => ({
    type: RESET_ORG_UNITS,
});

export const setOrgUnitTypes = orgUnitTypes => ({
    type: SET_ORG_UNIT_TYPES,
    payload: orgUnitTypes,
});
