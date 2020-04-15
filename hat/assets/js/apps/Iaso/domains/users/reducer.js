import {
    SET_USERS_PROFILES,
    SET_CURRENT_USER,
} from './actions';


export const usersInitialState = {
    list: [],
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

        default:
            return state;
    }
};
