import { SET_FORMS, SET_CURRENT_FORM, SET_IS_LOADING_FORM } from './actions';

export const formsInitialState = {
    current: null,
    isLoading: false,
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

        case SET_CURRENT_FORM: {
            const current = action.payload;
            return { ...state, current };
        }
        case SET_IS_LOADING_FORM: {
            const isLoading = action.payload;
            return { ...state, isLoading };
        }
        default:
            return state;
    }
};
