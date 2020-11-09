export const SET_FORMS = 'SET_FORMS';
export const SET_CURRENT_FORM = 'SET_CURRENT_FORM';
export const SET_IS_LOADING_FORM = 'SET_IS_LOADING_FORM';

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

export const setIsLoadingForm = isLoading => ({
    type: SET_IS_LOADING_FORM,
    payload: isLoading,
});
