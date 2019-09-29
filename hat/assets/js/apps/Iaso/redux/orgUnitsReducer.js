const SET_ORG_UNITS = 'SET_ORG_UNITS';
const RESET_ORG_UNITS = 'RESET_ORG_UNITS';
const SET_CURRENT_ORG_UNIT = 'SET_CURRENT_ORG_UNIT';
const SET_ORG_UNIT_TYPES = 'SET_ORG_UNIT_TYPES';
const SET_SOURCE_TYPES = 'SET_SOURCE_TYPES';
const SET_SOURCES = 'SET_SOURCES';
const SET_ORG_UNITS_LIST_FETCHING = 'SET_ORG_UNITS_LIST_FETCHING';


export const setOrgUnits = (list, showPagination, params, count, pages) => ({
    type: SET_ORG_UNITS,
    payload: {
        list,
        showPagination,
        params,
        count,
        pages,
    },
});

export const resetOrgUnits = () => ({
    type: RESET_ORG_UNITS,
});


export const setCurrentOrgUnit = orgUnit => ({
    type: SET_CURRENT_ORG_UNIT,
    payload: orgUnit,
});

export const setOrgUnitTypes = orgUnitTypes => ({
    type: SET_ORG_UNIT_TYPES,
    payload: orgUnitTypes,
});

export const setSourceTypes = sourceTypes => ({
    type: SET_SOURCE_TYPES,
    payload: sourceTypes,
});

export const setSources = sources => ({
    type: SET_SOURCES,
    payload: sources,
});


export const setOrgUnitsListFetching = isFetching => ({
    type: SET_ORG_UNITS_LIST_FETCHING,
    payload: isFetching,
});


export const orgUnitsInitialState = {
    current: null,
    fetchingList: false,
    fetchingDetail: true,
    orgUnitsPage: {
        list: null,
        showPagination: false,
        params: {},
        count: 0,
        pages: 0,
    },
    orgUnitTypes: [],
    sourceTypes: [],
    sources: [],
    orgUnitLevel: [],
};

export const orgUnitsReducer = (state = orgUnitsInitialState, action = {}) => {
    switch (action.type) {
        case SET_ORG_UNITS: {
            const {
                list, showPagination, params, count, pages,
            } = action.payload;
            return {
                ...state,
                orgUnitsPage: {
                    list,
                    showPagination,
                    params,
                    count,
                    pages,
                },
            };
        }

        case SET_CURRENT_ORG_UNIT: {
            const current = action.payload;
            return { ...state, current, fetchingDetail: false };
        }

        case SET_ORG_UNIT_TYPES: {
            const orgUnitTypes = action.payload;
            return { ...state, orgUnitTypes };
        }

        case SET_SOURCE_TYPES: {
            const sourceTypes = action.payload;
            return { ...state, sourceTypes };
        }

        case SET_SOURCES: {
            const sources = action.payload;
            return { ...state, sources };
        }

        case RESET_ORG_UNITS: {
            return { ...state, orgUnitsPage: orgUnitsInitialState.orgUnitsPage };
        }

        case SET_ORG_UNITS_LIST_FETCHING: {
            const fetchingList = action.payload;
            return { ...state, fetchingList };
        }

        default:
            return state;
    }
};
