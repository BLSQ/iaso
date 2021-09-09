export const SET_FORMS = 'SET_FORMS';
export const SET_IS_LOADING_DATA_SOURCE = 'SET_IS_LOADING_DATA_SOURCE';

export const setForms = (list, count, pages) => ({
    type: SET_FORMS,
    payload: {
        list,
        count,
        pages,
    },
});

export const setIsLoading = isLoading => ({
    type: SET_IS_LOADING_DATA_SOURCE,
    payload: isLoading,
});
