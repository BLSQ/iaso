import {
    SET_ORG_UNIT_TYPES,
    SET_CURRENT_ORG_UNIT_TYPE,
    SET_IS_FETCHING_ORG_UNIT_TYPES,
} from './actions';

export const orgUnitsTypesInitialState = {
    list: [],
    current: null,
    fetching: false,
    count: 0,
    pages: 1,
};

export const reducer = (state = orgUnitsTypesInitialState, action = {}) => {
    switch (action.type) {
        case SET_ORG_UNIT_TYPES: {
            const { list, count = 0, pages = 1 } = action.payload;
            return {
                ...state, list, count, pages,
            };
        }
        case SET_CURRENT_ORG_UNIT_TYPE: {
            const current = action.payload;
            return { ...state, current };
        }
        case SET_IS_FETCHING_ORG_UNIT_TYPES: {
            const fetching = action.payload;
            return { ...state, fetching };
        }

        default:
            return state;
    }
};
