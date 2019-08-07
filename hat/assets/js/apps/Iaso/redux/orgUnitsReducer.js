const SET_ORG_UNITS = 'SET_ORG_UNITS';
const SET_CURRENT_ORG_UNIT = 'SET_CURRENT_ORG_UNIT';
const SET_ORG_UNIT_TYPES = 'SET_ORG_UNIT_TYPES';


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

export const setCurrentOrgUnit = orgUnit => ({
    type: SET_CURRENT_ORG_UNIT,
    payload: orgUnit,
});

export const setOrgUnitTypes = orgUnitTypes => ({
    type: SET_ORG_UNIT_TYPES,
    payload: orgUnitTypes,
});


export const orgUnitsInitialState = {
    current: null,
    fetchingDetail: true,
    orgUnitsPage: {
        list: null,
        showPagination: false,
        params: {},
        count: 0,
        pages: 0,
    },
    orgUnitTypes: [],
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
        default:
            return state;
    }
};
