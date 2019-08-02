export const LOAD_LOG_DETAIL = 'hat/management/LOAD_LOG_DETAIL';
export const SET_LOGS_LIST = 'hat/management/SET_LOGS_LIST';

export const loadLogDetail = payload => ({
    type: LOAD_LOG_DETAIL,
    payload,
});

const setLogsList = (list, showPagination, params, count, pages) => ({
    type: SET_LOGS_LIST,
    payload: {
        list,
        showPagination,
        params,
        count,
        pages,
    },
});

export const logsActions = {
    loadLogDetail,
    setLogsList,
};

export const logsInitialState = {
    detail: null,
    reduxPage: {
        list: null,
        showPagination: false,
        params: {},
        count: 0,
        pages: 0,
    },
};

export const logsReducer = (state = logsInitialState, action = {}) => {
    switch (action.type) {

        case SET_LOGS_LIST: {
            const {
                list, showPagination, params, count, pages,
            } = action.payload;
            return {
                ...state,
                reduxPage: {
                    list,
                    showPagination,
                    params,
                    count,
                    pages,
                },
            };
        }
        case LOAD_LOG_DETAIL: {
            const detail = action.payload;
            return { ...state, detail };
        }
        default:
            return state;
    }
};
