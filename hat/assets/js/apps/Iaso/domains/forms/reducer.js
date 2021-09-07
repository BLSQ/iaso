import { SET_FORMS } from './actions';

export const formsInitialState = {
    formsPage: {
        list: null,
        count: 0,
        pages: 0,
    },
};

export const formsReducer = (state = formsInitialState, action = {}) => {
    switch (action.type) {
        case SET_FORMS: {
            const { list, count, pages } = action.payload;
            return {
                ...state,
                formsPage: {
                    list,
                    count,
                    pages,
                },
            };
        }
        default:
            return state;
    }
};
