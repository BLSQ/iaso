import {
    SET_USERS_PROFILES,
    SET_CURRENT_USER,
    TOGGLE_FETCHING_CURRENT_USER,
} from './actions';


export const usersInitialState = {
    list: [],
    fetching: false,
    current: null,
};


export const usersReducer = (state = usersInitialState, action = {}) => {
    switch (action.type) {
        case SET_USERS_PROFILES: {
            const list = action.payload;
            return { ...state, list };
        }
        case SET_CURRENT_USER: {
            const current = action.payload;
            return { ...state, current };
        }
        case TOGGLE_FETCHING_CURRENT_USER: {
            const fetching = action.payload;
            return { ...state, fetching };
        }

        default:
            return state;
    }
};
