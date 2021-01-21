import { SET_ALL_SOURCES, SET_IS_FETCHING_SOURCES } from './actions';

export const dataSourcesInitialState = {
    list: [],
    fetching: true,
    count: 0,
    pages: 1,
};

export const dataSourcesReducer = (
    state = dataSourcesInitialState,
    action = {},
) => {
    switch (action.type) {
        case SET_ALL_SOURCES: {
            const { list, count = 0, pages = 1 } = action.payload;
            return {
                ...state,
                list,
                count,
                pages,
            };
        }
        case SET_IS_FETCHING_SOURCES: {
            const fetching = action.payload;
            return { ...state, fetching };
        }
        default:
            return state;
    }
};
