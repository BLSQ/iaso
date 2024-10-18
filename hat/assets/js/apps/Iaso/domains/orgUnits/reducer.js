import { RESET_ORG_UNITS, SET_ORG_UNIT_TYPES, SET_SOURCES } from './actions';

export const orgUnitsInitialState = {
    orgUnitTypes: [],
    sources: null,
    orgUnitLevel: [],
    filtersUpdated: false,
    groups: [],
};

export const orgUnitsReducer = (state = orgUnitsInitialState, action = {}) => {
    switch (action.type) {
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

        default:
            return state;
    }
};
