const SET_ORG_UNITS = 'SET_ORG_UNITS';
const SET_ORG_UNITS_LOCATIONS = 'SET_ORG_UNITS_LOCATIONS';
const RESET_ORG_UNITS = 'RESET_ORG_UNITS';
const SET_ORG_UNIT = 'SET_ORG_UNIT';
const SET_SUB_ORG_UNIT = 'SET_SUB_ORG_UNIT';
const SET_FETCHING = 'SET_FETCHING';
const SET_ORG_UNIT_TYPES = 'SET_ORG_UNIT_TYPES';
const SET_SOURCE_TYPES = 'SET_SOURCE_TYPES';
const SET_SOURCES = 'SET_SOURCES';
const SET_ORG_UNITS_LIST_FETCHING = 'SET_ORG_UNITS_LIST_FETCHING';
const SET_SUB_ORG_UNITS_TYPES_SELECTED = 'SET_SUB_ORG_UNITS_TYPES_SELETED';
const SET_SOURCES_SELECTED = 'SET_SOURCES_SELECTED';
const SET_FORMS_SELECTED = 'SET_FORMS_SELECTED';
const SET_CURRENT_FORMS = 'SET_CURRENT_FORMS';
const SET_FETCHING_ORG_UNITS_TYPES = 'SET_FETCHING_ORG_UNITS_TYPES';

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

export const setOrgUnitsLocations = orgUnitsLocations => ({
    type: SET_ORG_UNITS_LOCATIONS,
    payload: orgUnitsLocations,
});


export const resetOrgUnits = () => ({
    type: RESET_ORG_UNITS,
});


export const setCurrentOrgUnit = orgUnit => ({
    type: SET_ORG_UNIT,
    payload: orgUnit,
});

export const setCurrentSubOrgUnit = orgUnit => ({
    type: SET_SUB_ORG_UNIT,
    payload: orgUnit,
});

export const setOrgUnitTypes = orgUnitTypes => ({
    type: SET_ORG_UNIT_TYPES,
    payload: orgUnitTypes,
});

export const setCurrentForms = currentForms => ({
    type: SET_CURRENT_FORMS,
    payload: currentForms,
});

export const setSourceTypes = sourceTypes => ({
    type: SET_SOURCE_TYPES,
    payload: sourceTypes,
});

export const setSources = sources => ({
    type: SET_SOURCES,
    payload: sources,
});


export const setOrgUnitsListFetching = currentSubOrgUnit => ({
    type: SET_ORG_UNITS_LIST_FETCHING,
    payload: currentSubOrgUnit,
});

export const setSourcesSelected = currentSourcesSelected => ({
    type: SET_SOURCES_SELECTED,
    payload: currentSourcesSelected,
});

export const setFormsSelected = currentFormsSelected => ({
    type: SET_FORMS_SELECTED,
    payload: currentFormsSelected,
});

export const setCurrentSubOrgUnitTypesSelected = currentSubOrgUnitsTypesSelected => ({
    type: SET_SUB_ORG_UNITS_TYPES_SELECTED,
    payload: currentSubOrgUnitsTypesSelected,
});

export const setFetching = fetching => ({
    type: SET_FETCHING,
    payload: fetching,
});

export const setFetchingOrgUnitTypes = fetching => ({
    type: SET_FETCHING_ORG_UNITS_TYPES,
    payload: fetching,
});

export const orgUnitsInitialState = {
    current: null,
    currentSubOrgUnit: null,
    currentSubOrgUnitsTypesSelected: [],
    currentForms: null,
    currentFormsSelected: [],
    currentSourcesSelected: [],
    fetchingList: false,
    fetchingDetail: true,
    fetchingSubOrgUnits: false,
    fetchingOrgUnitTypes: true,
    orgUnitsPage: {
        list: null,
        showPagination: false,
        params: {},
        count: 0,
        pages: 0,
    },
    orgUnitTypes: [],
    sourceTypes: [],
    sources: null,
    orgUnitLevel: [],
    orgUnitsLocations: {
        locations: [],
        shapes: [],
    },
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

        case SET_ORG_UNIT: {
            const current = action.payload;
            return { ...state, current, fetchingDetail: false };
        }

        case SET_SUB_ORG_UNIT: {
            const currentSubOrgUnit = action.payload;
            return { ...state, currentSubOrgUnit };
        }

        case SET_ORG_UNIT_TYPES: {
            const orgUnitTypes = action.payload;
            return { ...state, orgUnitTypes };
        }

        case SET_CURRENT_FORMS: {
            const currentForms = action.payload;
            return { ...state, currentForms };
        }

        case SET_SOURCE_TYPES: {
            const sourceTypes = action.payload;
            return { ...state, sourceTypes };
        }

        case SET_SOURCES: {
            const sources = action.payload;
            return { ...state, sources, orgUnitLevel: [] };
        }

        case RESET_ORG_UNITS: {
            return { ...state, orgUnitsPage: orgUnitsInitialState.orgUnitsPage };
        }

        case SET_ORG_UNITS_LIST_FETCHING: {
            const fetchingList = action.payload;
            return { ...state, fetchingList };
        }

        case SET_FETCHING: {
            const fetchingSubOrgUnits = action.payload;
            return { ...state, fetchingSubOrgUnits };
        }

        case SET_SUB_ORG_UNITS_TYPES_SELECTED: {
            const currentSubOrgUnitsTypesSelected = action.payload;
            return { ...state, currentSubOrgUnitsTypesSelected };
        }

        case SET_FORMS_SELECTED: {
            const currentFormsSelected = action.payload;
            return { ...state, currentFormsSelected };
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
        default:
            return state;
    }
};
