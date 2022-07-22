import {
    RESET_ORG_UNITS,
    SET_ORG_UNIT_TYPES,
    SET_SOURCES,
    SET_FETCHING_ORG_UNITS_TYPES,
    SET_SUB_ORG_UNIT,
} from './actions';

export const orgUnitsInitialState = {
    currentSubOrgUnit: null,
    fetchingOrgUnitTypes: true,
    orgUnitTypes: [],
    sources: null,
    orgUnitLevel: [],
    filtersUpdated: false,
    groups: [],
};

export const orgUnitsReducer = (state = orgUnitsInitialState, action = {}) => {
    switch (action.type) {
        case SET_SUB_ORG_UNIT: {
            const currentSubOrgUnit = action.payload;
            return { ...state, currentSubOrgUnit };
        }

        case SET_ORG_UNIT_TYPES: {
            const orgUnitTypes = action.payload;
            return { ...state, orgUnitTypes };
        }
        case SET_SOURCES: {
            const sources = action.payload;
            return { ...state, sources, orgUnitLevel: [] };
        }

        case RESET_ORG_UNITS: {
            return {
                ...state,
                orgUnitsPage: orgUnitsInitialState.orgUnitsPage,
                orgUnitsLocations: orgUnitsInitialState.orgUnitsLocations,
            };
        }

        case SET_FETCHING_ORG_UNITS_TYPES: {
            const fetchingOrgUnitTypes = action.payload;
            return { ...state, fetchingOrgUnitTypes };
        }

        default:
            return state;
    }
};
