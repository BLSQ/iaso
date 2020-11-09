import {
    SET_COMPLETENESS,
    START_FETCHING_COMPLETENESS,
    STOP_FETCHING_COMPLETENESS,
} from './actions';

export const completenessInitialState = {
    fetching: false,
    list: [],
};

export const reducer = (state = completenessInitialState, action = {}) => {
    switch (action.type) {
        case SET_COMPLETENESS:
            return { ...state, list: action.payload };
        case START_FETCHING_COMPLETENESS:
            return { ...state, fetching: true };
        case STOP_FETCHING_COMPLETENESS:
            return { ...state, fetching: false };
        default:
            return state;
    }
};
