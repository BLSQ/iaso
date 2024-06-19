import { SET_CURRENT_USER } from './actions';

export const usersInitialState = {
    list: [],
    current: null,
    fetching: true,
    count: 0,
    pages: 1,
};

export const usersReducer = (state = usersInitialState, action = {}) => {
    switch (action.type) {
        case SET_CURRENT_USER: {
            const current = action.payload;
            return { ...state, current };
        }

        default:
            return state;
    }
};
