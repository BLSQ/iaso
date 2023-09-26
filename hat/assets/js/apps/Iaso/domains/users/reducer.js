import {
    SET_USERS_PROFILES,
    SET_CURRENT_USER,
    SET_IS_FETCHING_USERS,
} from './actions';

export const usersInitialState = {
    list: [],
    current: null,
    fetching: true,
    count: 0,
    pages: 1,
};

export const usersReducer = (state = usersInitialState, action = {}) => {
    switch (action.type) {
        case SET_USERS_PROFILES: {
            const { list, count = 0, pages = 1 } = action.payload;
            return {
                ...state,
                list,
                count,
                pages,
            };
        }
        case SET_CURRENT_USER: {
            const current = action.payload;
            return { ...state, current };
        }
        case SET_IS_FETCHING_USERS: {
            const fetching = action.payload;
            return { ...state, fetching };
        }
        default:
            return state;
    }
};
