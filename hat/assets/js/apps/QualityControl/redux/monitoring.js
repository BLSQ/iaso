import monitoringTabs from '../constants/monitoringTabs';

const SET_TABLE = 'hat/quality/monitoring/SET_TABLE';
const RESET_TABLE = 'hat/quality/monitoring/RESET_TABLE';
const LOAD_VALIDATORS = 'hat/quality/LOAD_VALIDATORS';
const FETCH_ACTION = 'hat/quality/FETCH_ACTION';

const req = require('superagent');

const setTable = (
    key,
    list,
    showPagination,
    params,
    count,
    pages,
) => ({
    type: SET_TABLE,
    key,
    payload: {
        list,
        showPagination,
        params,
        count,
        pages,
    },
});

const loadValidators = payload => ({
    type: LOAD_VALIDATORS,
    payload,
});

const resetTable = key => ({
    type: RESET_TABLE,
    key,
});


const fetchValidators = (dispatch) => {
    req
        .get('/api/profiles?as_list=True&is_validator=True&team_type=all')
        .then((result) => {
            dispatch(loadValidators(result.body));
        })
        .catch(err => (console.error(`Error while fetching validators ${err}`)));
    return ({
        type: FETCH_ACTION,
    });
};

export const monitoringActions = {
    setTable,
    resetTable,
    fetchValidators,
};

const tableInitialState = {
    list: null,
    showPagination: false,
    params: {},
    count: 0,
    pages: 0,
};

export const monitoringInitialState = () => {
    const state = {
        tables: {},
        profiles: [],
    };
    monitoringTabs.forEach((tab) => {
        state.tables[tab.key] = tableInitialState;
    });
    return state;
};

export const monitoringReducer = (state = monitoringInitialState, action = {}) => {
    switch (action.type) {
        case SET_TABLE: {
            const {
                list, showPagination, params, count, pages,
            } = action.payload;
            const { key } = action;
            const newState = {
                ...state,
            };
            newState.tables[key] = {
                list,
                showPagination,
                params,
                count,
                pages,
            };
            return newState;
        }

        case RESET_TABLE: {
            const { key } = action;
            const newState = {
                ...state,
            };
            newState.tables[key] = tableInitialState;
            return newState;
        }

        case LOAD_VALIDATORS: {
            const profiles = action.payload;
            return { ...state, profiles };
        }

        default:
            return state;
    }
};
