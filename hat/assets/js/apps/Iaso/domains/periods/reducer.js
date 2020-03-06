import { SET_PERIODS } from './actions';

export const periodsInitialState = {
    list: [],
};

export const periodsReducer = (state = periodsInitialState, action = {}) => {
    switch (action.type) {
        case SET_PERIODS: {
            const list = action.payload;
            return {
                ...state,
                list,
            };
        }

        default:
            return state;
    }
};
