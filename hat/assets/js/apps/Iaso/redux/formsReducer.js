const SET_FORMS = 'SET_FORMS';
const SET_CURRENT_FORM = 'SET_CURRENT_FORM';


export const setForms = (list, showPagination, params, count, pages) => ({
    type: SET_FORMS,
    payload: {
        list,
        showPagination,
        params,
        count,
        pages,
    },
});

export const setCurrentForm = form => ({
    type: SET_CURRENT_FORM,
    payload: form,
});


export const formsInitialState = {
    current: null,
    formsPage: {
        list: null,
        showPagination: false,
        params: {},
        count: 0,
        pages: 0,
    },
};

export const formsReducer = (state = formsInitialState, action = {}) => {
    switch (action.type) {
        case SET_FORMS: {
            const {
                list, showPagination, params, count, pages,
            } = action.payload;
            return {
                ...state,
                formsPage: {
                    list,
                    showPagination,
                    params,
                    count,
                    pages,
                },
            };
        }

        case SET_CURRENT_FORM: {
            const current = action.payload;
            return { ...state, current };
        }
        default:
            return state;
    }
};
