export const SET_CASES_LIST = 'hat/patient/detail/SET_CASES_LIST';

export const setCasesList = (list, showPagination, params, count, pages) => ({
    type: SET_CASES_LIST,
    payload: {
        list,
        showPagination,
        params,
        count,
        pages,
    },
});

export const casesActions = {
    setCasesList,
};

export const casesInitialState = {
    casesPage: {
        list: null,
        showPagination: false,
        params: {},
        count: 0,
        pages: 0,
    },
};

export const casesReducer = (state = casesInitialState, action = {}) => {
    switch (action.type) {
        case SET_CASES_LIST: {
            const {
                list, showPagination, params, count, pages,
            } = action.payload;
            return {
                ...state,
                casesPage: {
                    list,
                    showPagination,
                    params,
                    count,
                    pages,
                },
            };
        }
        default:
            return state;
    }
};
