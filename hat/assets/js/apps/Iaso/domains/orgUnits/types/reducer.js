import {
    SET_ORG_UNIT_TYPES,
    SET_ALL_ORG_UNIT_TYPES,
    SET_IS_FETCHING_ORG_UNIT_TYPES,
} from './actions';

export const orgUnitsTypesInitialState = {
    list: [],
    current: null,
    fetching: false,
    count: 0,
    pages: 1,
    allTypes: undefined,
};

export const reducer = (state = orgUnitsTypesInitialState, action = {}) => {
    switch (action.type) {
        case SET_ORG_UNIT_TYPES: {
            const { list, count = 0, pages = 1 } = action.payload;
            return {
                ...state,
                list,
                count,
                pages,
            };
        }
        case SET_ALL_ORG_UNIT_TYPES: {
            const allTypes = action.payload;
            return {
                ...state,
                allTypes,
            };
        }
        case SET_IS_FETCHING_ORG_UNIT_TYPES: {
            const fetching = action.payload;
            return { ...state, fetching };
        }

        default:
            return state;
    }
};
