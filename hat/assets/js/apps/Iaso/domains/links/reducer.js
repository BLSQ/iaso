import { SET_ALGO_LIST, SET_ALGO_RUNS_LIST } from './actions';

export const linksInitialState = {
    current: null,
    fetchingDetail: true,
    algorithmsList: [],
    algorithmRunsList: [],
};

export const linksReducer = (state = linksInitialState, action = {}) => {
    switch (action.type) {
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
