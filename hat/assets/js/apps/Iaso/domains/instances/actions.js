import {
    getRequest,
    postRequest,
    putRequest,
    patchRequest,
    deleteRequest,
} from '../../libs/Api';
import { enqueueSnackbar } from '../../redux/snackBarsReducer';
import { errorSnackBar, succesfullSnackBar } from '../../constants/snackBars';

export const SET_INSTANCES = 'SET_INSTANCES';
export const SET_INSTANCES_SMALL_DICT = 'SET_INSTANCES_SMALL_DICT';
export const SET_INSTANCES_FETCHING = 'SET_INSTANCES_FETCHING';
export const SET_CURRENT_INSTANCE = 'SET_CURRENT_INSTANCE';
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

export const resetInstances = () => ({
    type: RESET_INSTANCES,
});

export const fetchEditUrl = (currentInstance, location) => dispatch => {
    dispatch(setInstancesFetching(true));
    const url = `/api/enketo/edit/${currentInstance.uuid}?return_url=${location}`;
    return getRequest(url)
        .then(resp => {
            window.location.href = resp.edit_url;
        })
        .catch(err => {
            console.log(err);
            dispatch(
                enqueueSnackbar(errorSnackBar('fetchEnketoError', null, err)),
            );
        })
        .then(() => {
            dispatch(setInstancesFetching(false));
        });
};

export const fetchInstanceDetail = instanceId => dispatch => {
    dispatch(setInstancesFetching(true));
    return getRequest(`/api/instances/${instanceId}/`)
        .then(res => dispatch(setCurrentInstance(res)))
        .catch(err =>
            dispatch(
                enqueueSnackbar(errorSnackBar('fetchInstanceError', null, err)),
            ),
        )
        .then(() => {
            dispatch(setInstancesFetching(false));
        });
};

export const softDeleteInstance = currentInstance => dispatch => {
    dispatch(setInstancesFetching(true));
    deleteRequest(`/api/instances/${currentInstance.id}`)
        .then(res => {
            dispatch(fetchInstanceDetail(currentInstance.id));
        })
        .catch(err =>
            dispatch(
                enqueueSnackbar(errorSnackBar('fetchInstanceError', null, err)),
            ),
        )
        .then(() => {
            dispatch(setInstancesFetching(false));
        });
};

export const restoreInstance = currentInstance => dispatch => {
    dispatch(setInstancesFetching(true));
    patchRequest(`/api/instances/${currentInstance.id}/`, { deleted: false })
        .then(res => {
            dispatch(fetchInstanceDetail(currentInstance.id));
        })
        .catch(err =>
            dispatch(
                enqueueSnackbar(
                    errorSnackBar('restoreInstanceError', null, err),
                ),
            ),
        )
        .then(() => {
            dispatch(setInstancesFetching(false));
        });
};

export const reAssignInstance = (currentInstance, payload) => dispatch => {
    dispatch(setInstancesFetching(true));

    if (!payload.period) delete payload.period;
    patchRequest(`/api/instances/${currentInstance.id}/`, payload)
        .then(res => {
            dispatch(fetchInstanceDetail(currentInstance.id));
        })
        .catch(err =>
            dispatch(
                enqueueSnackbar(
                    errorSnackBar('assignInstanceError', null, err),
                ),
            ),
        )
        .then(() => {
            dispatch(setInstancesFetching(false));
        });
};

export const createInstance = (currentForm, payload) => dispatch => {
    dispatch(setInstancesFetching(true));
    // if (!payload.period) delete payload.period;
    return postRequest('/api/enketo/create/', {
        org_unit_id: payload.org_unit,
        form_id: currentForm.id,
        period: payload.period,
    }).then(createRequest => {
        window.location = createRequest.edit_url;
    });
};

export const createExportRequest = filterParams => dispatch => {
    dispatch(setInstancesFetching(true));
    return postRequest('/api/exportrequests/', filterParams)
        .then(exportRequest => {
            putRequest(`/api/exportrequests/${exportRequest.id}/`);
            // fire and forget to run the export
            return dispatch(
                enqueueSnackbar(
                    succesfullSnackBar('createExportRequestSuccess'),
                ),
            );
        })
        .catch(err => {
            const key = err.details
                ? `createExportRequestError${err.details.code}`
                : 'createExportRequestError';
            return dispatch(enqueueSnackbar(errorSnackBar(key, null, err)));
        })
        .then(() => dispatch(setInstancesFetching(false)));
};

export const bulkDelete = (
    selection,
    filters,
    isUnDeleteAction,
    successFn,
) => dispatch => {
    dispatch(setInstancesFetching(true));
    return postRequest('/api/instances/bulkdelete/', {
        select_all: selection.selectAll,
        selected_ids: selection.selectedItems.map(i => i.id),
        unselected_ids: selection.unSelectedItems.map(i => i.id),
        is_deletion: !isUnDeleteAction,
        ...filters,
    })
        .then(res => {
            dispatch(
                enqueueSnackbar(
                    succesfullSnackBar('saveMultiEditOrgUnitsSuccesfull'),
                ),
            );
            successFn();
            dispatch(setInstancesFetching(false));
            return res;
        })
        .catch(error => {
            dispatch(
                enqueueSnackbar(
                    errorSnackBar('saveMultiEditOrgUnitsError', null, error),
                ),
            );
            dispatch(setInstancesFetching(false));
            throw error;
        });
};
