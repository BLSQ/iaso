import {
    getRequest, postRequest, putRequest, patchRequest, deleteRequest,
} from '../../libs/Api';
import { enqueueSnackbar } from '../../../../redux/snackBarsReducer';
import { errorSnackBar, succesfullSnackBar } from '../../../../utils/constants/snackBars';

export const SET_INSTANCES = 'SET_INSTANCES';
export const SET_INSTANCES_SMALL_DICT = 'SET_INSTANCES_SMALL_DICT';
export const SET_INSTANCES_FETCHING = 'SET_INSTANCES_FETCHING';
export const SET_CURRENT_INSTANCE = 'SET_CURRENT_INSTANCE';
export const SET_INSTANCE_CURRENT_FORM = 'SET_INSTANCE_CURRENT_FORM';
export const SET_INSTANCES_FILTER_UDPATED = 'SET_INSTANCES_FILTER_UDPATED';
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

export const setInstancesFilterUpdated = isUpdated => ({
    type: SET_INSTANCES_FILTER_UDPATED,
    payload: isUpdated,
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

export const fetchEditUrl = (currentInstance, location) => (dispatch) => {
    dispatch(setInstancesFetching(true));
    const url = `/api/enketo/edit/${currentInstance.uuid}?return_url=${location}`;
    return getRequest(url)
        .then((resp) => {
            window.location.href = resp.edit_url;
        })
        .catch((err) => {
            console.log(err);
            dispatch(enqueueSnackbar(errorSnackBar('fetchEnketoError')));
        })
        .then(() => {
            dispatch(setInstancesFetching(false));
        });
};

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

export const softDeleteInstance = currentInstance => (dispatch) => {
    dispatch(setInstancesFetching(true));
    deleteRequest(`/api/instances/${currentInstance.id}`)
        .then((res) => {
            dispatch(fetchInstanceDetail(currentInstance.id));
        })
        .catch(() => dispatch(enqueueSnackbar(errorSnackBar('fetchInstanceError'))))
        .then(() => {
            dispatch(setInstancesFetching(false));
        });
};

export const reAssignInstance = (currentInstance, payload) => (dispatch) => {
    dispatch(setInstancesFetching(true));
    patchRequest(`/api/instances/${currentInstance.id}/`, payload)
        .then((res) => {
            dispatch(fetchInstanceDetail(currentInstance.id));
        })
        .catch(() => dispatch(enqueueSnackbar(errorSnackBar('fetchInstanceError'))))
        .then(() => {
            dispatch(setInstancesFetching(false));
        });
};

export const createExportRequest = filterParams => (dispatch) => {
    dispatch(setInstancesFetching(true));
    return postRequest('/api/exportrequests/', filterParams)
        .then((exportRequest) => {
            putRequest(`/api/exportrequests/${exportRequest.id}/`);
            // fire and forget to run the export
            return dispatch(enqueueSnackbar(succesfullSnackBar('createExportRequestSuccess')));
        })
        .catch((err) => {
            const key = err.details ? `createExportRequestError${err.details.code}` : 'createExportRequestError';
            return dispatch(enqueueSnackbar(errorSnackBar(key)));
        })
        .then(() => dispatch(setInstancesFetching(false)));
};
