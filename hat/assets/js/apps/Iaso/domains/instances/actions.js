import { getRequest } from '../../libs/Api';
import { enqueueSnackbar } from '../../../../redux/snackBarsReducer';
import { errorSnackBar } from '../../../../utils/constants/snackBars';

export const SET_INSTANCES = 'SET_INSTANCES';
export const SET_INSTANCES_SMALL_DICT = 'SET_INSTANCES_SMALL_DICT';
export const SET_INSTANCES_FETCHING = 'SET_INSTANCES_FETCHING';
export const SET_CURRENT_INSTANCE = 'SET_CURRENT_INSTANCE';
export const SET_INSTANCE_CURRENT_FORM = 'SET_INSTANCE_CURRENT_FORM';
export const RESET_INSTANCES = 'RESET_INSTANCES';


export const setInstances = (list, showPagination, params, count, pages) => ({
    type: SET_INSTANCES,
    payload: {
        list,
        showPagination,
        params,
        count,
        pages,
    },
});

export const setInstancesSmallDict = instances => ({
    type: SET_INSTANCES_SMALL_DICT,
    payload: instances,
});


export const setInstancesFetching = isFetching => ({
    type: SET_INSTANCES_FETCHING,
    payload: isFetching,
});

export const setCurrentInstance = instance => ({
    type: SET_CURRENT_INSTANCE,
    payload: instance,
});

export const setCurrentForm = form => ({
    type: SET_INSTANCE_CURRENT_FORM,
    payload: form,
});

export const resetInstances = () => ({
    type: RESET_INSTANCES,
});


export const fetchFormDetail = formId => (dispatch) => {
    dispatch(setInstancesFetching(true));
    return getRequest(`/api/forms/${formId}`)
        .then(res => dispatch(setCurrentForm(res)))
        .catch(() => dispatch(enqueueSnackbar(errorSnackBar('fetchFormError'))))
        .then(() => {
            dispatch(setInstancesFetching(false));
        });
};

export const fetchInstanceDetail = instanceId => (dispatch) => {
    dispatch(setInstancesFetching(true));
    return getRequest(`/api/instances/${instanceId}`)
        .then(res => dispatch(setCurrentInstance(res)))
        .catch(() => dispatch(enqueueSnackbar(errorSnackBar('fetchInstanceError'))))
        .then(() => {
            dispatch(setInstancesFetching(false));
        });
};
