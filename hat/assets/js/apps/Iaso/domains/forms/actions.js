export const SET_FORMS = 'SET_FORMS';
export const SET_CURRENT_FORM = 'SET_CURRENT_FORM';

export const setForms = (list, count = 0, pages = 0) => ({
    type: SET_FORMS,
    payload: {
        list,
        count,
        pages,
    },
});
