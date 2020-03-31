import {
    SET_MAPPINGS,
    SET_CURRENT_MAPPING,
    FETCHING_MAPPINGS,
} from './actions';

export const mappingsInitialState = {
    current: null,
    mappings: [],
    fetching: false,
    count: 0,
    pages: 1,
};

export const mappingReducer = (state = mappingsInitialState, action = {}) => {
    switch (action.type) {
        case SET_MAPPINGS: {
            const { mappings, count, pages } = action.payload;
            return {
                ...state,
                mappings,
                count,
                pages,
            };
        }

        case SET_CURRENT_MAPPING: {
            const current = action.payload;
            return { ...state, current };
        }

        case FETCHING_MAPPINGS: {
            const fetching = action.payload;
            return { ...state, fetching };
        }
        default:
            return state;
    }
};
