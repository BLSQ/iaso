import {
    SET_LINKS,
    SET_RUNS,
    SET_ALGO_LIST,
    SET_ALGO_RUNS_LIST,
    SET_IS_FETCHING,
} from './actions';

export const linksInitialState = {
    current: null,
    fetching: false,
    fetchingDetail: true,
    algorithmsList: [],
    algorithmRunsList: [],
    linksPage: {
        list: null,
        showPagination: false,
        params: {},
        count: 0,
        pages: 0,
    },
    runsPage: {
        list: null,
        showPagination: false,
        params: {},
        count: 0,
        pages: 0,
    },
};

export const linksReducer = (state = linksInitialState, action = {}) => {
    switch (action.type) {
        case SET_LINKS: {
            const {
                list,
                showPagination,
                params,
                count,
                pages,
            } = action.payload;
            return {
                ...state,
                linksPage: {
                    list,
                    showPagination,
                    params,
                    count,
                    pages,
                },
            };
        }
        case SET_RUNS: {
            const {
                list,
                showPagination,
                params,
                count,
                pages,
            } = action.payload;
            return {
                ...state,
                runsPage: {
                    list,
                    showPagination,
                    params,
                    count,
                    pages,
                },
            };
        }

        case SET_IS_FETCHING: {
            const fetching = action.payload;
            return { ...state, fetching };
        }

        case SET_ALGO_LIST: {
            const algorithmsList = action.payload;
            return { ...state, algorithmsList };
        }

        case SET_ALGO_RUNS_LIST: {
            const algorithmRunsList = action.payload;
            return { ...state, algorithmRunsList };
        }

        default:
            return state;
    }
};
