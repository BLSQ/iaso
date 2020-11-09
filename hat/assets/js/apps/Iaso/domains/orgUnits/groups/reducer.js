import {
    SET_GROUPS,
    SET_CURRENT_GROUP,
    SET_IS_FETCHING_GROUPS,
} from './actions';

export const groupsInitialState = {
    list: [],
    current: null,
    fetching: false,
    count: 0,
    pages: 1,
};

export const reducer = (state = groupsInitialState, action = {}) => {
    switch (action.type) {
        case SET_GROUPS: {
            const { list, count = 0, pages = 1 } = action.payload;
            return {
                ...state,
                list,
                count,
                pages,
            };
        }
        case SET_CURRENT_GROUP: {
            const current = action.payload;
            return { ...state, current };
        }
        case SET_IS_FETCHING_GROUPS: {
            const fetching = action.payload;
            return { ...state, fetching };
        }

        default:
            return state;
    }
};
