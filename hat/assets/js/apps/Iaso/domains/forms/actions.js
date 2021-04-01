import { getRequest } from '../../libs/Api';
import { enqueueSnackbar } from '../../redux/snackBarsReducer';
import { errorSnackBar } from '../../constants/snackBars';

export const SET_FORMS = 'SET_FORMS';
export const SET_CURRENT_FORM = 'SET_CURRENT_FORM';
export const SET_IS_LOADING_FORM = 'SET_IS_LOADING_FORM';

export const setForms = (list, count, pages) => ({
    type: SET_FORMS,
    payload: {
        list,
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

export const fetchFormDetail = formId => dispatch => {
    dispatch(setIsLoadingForm(true));
    return getRequest(`/api/forms/${formId}/`)
        .then(res => {
            dispatch(setCurrentForm(res));
            return res;
        })
        .catch(err =>
            dispatch(
                enqueueSnackbar(errorSnackBar('fetchFormError', null, err)),
            ),
        )
        .then(() => {
            dispatch(setIsLoadingForm(false));
        });
};
