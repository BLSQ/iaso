import monitoringTabs from '../constants/monitoringTabs';

const SET_TABLE = 'hat/quality/monitoring/SET_TABLE';
const RESET_TABLE = 'hat/quality/monitoring/RESET_TABLE';

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

const resetTable = key => ({
    type: RESET_TABLE,
    key,
});

export const monitoringActions = {
    setTable,
    resetTable,
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

        default:
            return state;
    }
};
