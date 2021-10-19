import {
    SET_ORG_UNITS,
    SET_ORG_UNITS_LOCATIONS,
    RESET_ORG_UNITS,
    SET_ORG_UNIT,
    SET_FETCHING,
    SET_ORG_UNIT_TYPES,
    SET_SOURCES,
    SET_GROUPS,
    SET_ORG_UNITS_LIST_FETCHING,
    SET_SOURCES_SELECTED,
    SET_FETCHING_ORG_UNITS_TYPES,
    SET_FILTERS_UPDATED,
    SET_SUB_ORG_UNIT,
    SET_FETCHING_DETAIL,
} from './actions';

export const orgUnitsInitialState = {
    current: null,
    currentSubOrgUnit: null,
    currentSourcesSelected: undefined,
    fetchingList: false,
    fetchingDetail: true,
    fetchingOrgUnitTypes: true,
    orgUnitsPage: {
        list: [],
        showPagination: false,
        params: {},
        count: 0,
        pages: 0,
        counts: [],
    },
    orgUnitTypes: [],
    sources: null,
    orgUnitLevel: [],
    orgUnitsLocations: {
        locations: [],
        shapes: [],
    },
    filtersUpdated: true,
    groups: [],
};

export const orgUnitsReducer = (state = orgUnitsInitialState, action = {}) => {
    switch (action.type) {
        case SET_ORG_UNITS: {
            const { list, showPagination, params, count, pages, counts } =
                action.payload;
            return {
                ...state,
                orgUnitsPage: {
                    list,
                    showPagination,
                    params,
                    count,
                    pages,
                    counts,
                },
            };
        }

        case SET_ORG_UNIT: {
            const current = action.payload;
            return { ...state, current };
        }

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

        case SET_GROUPS: {
            const groups = action.payload;
            return { ...state, groups };
        }

        case RESET_ORG_UNITS: {
            return {
                ...state,
                orgUnitsPage: orgUnitsInitialState.orgUnitsPage,
                orgUnitsLocations: orgUnitsInitialState.orgUnitsLocations,
            };
        }

        case SET_ORG_UNITS_LIST_FETCHING: {
            const fetchingList = action.payload;
            return { ...state, fetchingList };
        }

        case SET_FETCHING: {
            const fetchingSubOrgUnits = action.payload;
            return { ...state, fetchingSubOrgUnits };
        }

        case SET_FETCHING_DETAIL: {
            const fetchingDetail = action.payload;
            return { ...state, fetchingDetail };
        }

        case SET_SOURCES_SELECTED: {
            const currentSourcesSelected = action.payload;
            return { ...state, currentSourcesSelected };
        }

        case SET_ORG_UNITS_LOCATIONS: {
            const orgUnitsLocations = action.payload;
            return { ...state, orgUnitsLocations };
        }

        case SET_FETCHING_ORG_UNITS_TYPES: {
            const fetchingOrgUnitTypes = action.payload;
            return { ...state, fetchingOrgUnitTypes };
        }

        case SET_FILTERS_UPDATED: {
            const filtersUpdated = action.payload;
            return { ...state, filtersUpdated };
        }
        default:
            return state;
    }
};
