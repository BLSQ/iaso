import { getRequest, postRequest, putRequest } from 'Iaso/libs/Api.ts';
import { openSnackBar } from '../../components/snackBars/EventDispatcher.ts';
import { errorSnackBar, succesfullSnackBar } from '../../constants/snackBars';

export const SET_INSTANCES_FETCHING = 'SET_INSTANCES_FETCHING';
export const SET_CURRENT_INSTANCE = 'SET_CURRENT_INSTANCE';
export const SET_INSTANCES_FILTER_UDPATED = 'SET_INSTANCES_FILTER_UDPATED';

export const setInstancesFilterUpdated = isUpdated => ({
    type: SET_INSTANCES_FILTER_UDPATED,
    payload: isUpdated,
});

export const setInstancesFetching = isFetching => ({
    type: SET_INSTANCES_FETCHING,
    payload: isFetching,
});

export const fetchEditUrl = (currentInstance, location) => dispatch => {
    dispatch(setInstancesFetching(true));
    const url = `/api/enketo/edit/${currentInstance.uuid}?return_url=${location}`;
    return getRequest(url)
        .then(resp => {
            window.location.href = resp.edit_url;
        })
        .catch(err => {
            openSnackBar(errorSnackBar('fetchEnketoError', null, err));
        })
        .then(() => {
            dispatch(setInstancesFetching(false));
        });
};

/* Submission Creation workflow
 *  1. this function call backend create Instance in DB
 *  2. backend contact enketo to generate a Form page
 *  3. backend return an url to enketo
 *  4. this function redirect  to the Enketo service
 *  5. After submission Enketo/Backend redirect to the submission detail page
 *  See enketo/README.md for full details.
 */
export const createInstance = (currentForm, payload) => dispatch => {
    dispatch(setInstancesFetching(true));
    // if (!payload.period) delete payload.period;
    return postRequest('/api/enketo/create/', {
        org_unit_id: payload.org_unit,
        form_id: currentForm.id,
        period: payload.period,
    }).then(
        // Redirect the browser to Enketo
        createRequest => {
            window.location = createRequest.edit_url;
        },
        err => {
            openSnackBar(errorSnackBar(null, 'Enketo', err));
            dispatch(setInstancesFetching(false));
        },
    );
};

export const createExportRequest = (filterParams, selection) => dispatch => {
    dispatch(setInstancesFetching(true));
    const filters = {
        ...filterParams,
    };
    if (selection) {
        if (selection.selectedItems && selection.selectedItems.length > 0) {
            filters.selected_ids = selection.selectedItems.map(i => i.id);
        }
        if (selection.unSelectedItems && selection.unSelectedItems.length > 0) {
            filters.unselected_ids = selection.unSelectedItems.map(i => i.id);
        }
    }
    return postRequest('/api/exportrequests/', filters)
        .then(exportRequest => {
            putRequest(`/api/exportrequests/${exportRequest.id}/`);
            // fire and forget to run the export

            openSnackBar(succesfullSnackBar('createExportRequestSuccess'));
        })
        .catch(err => {
            const key = err.details
                ? `createExportRequestError${err.details.code}`
                : 'createExportRequestError';
            openSnackBar(errorSnackBar(key, null, err));
        })
        .then(() => dispatch(setInstancesFetching(false)));
};

export const bulkDelete =
    (selection, filters, isUnDeleteAction, successFn) => dispatch => {
        dispatch(setInstancesFetching(true));
        return postRequest('/api/instances/bulkdelete/', {
            select_all: selection.selectAll,
            selected_ids: selection.selectedItems.map(i => i.id),
            unselected_ids: selection.unSelectedItems.map(i => i.id),
            is_deletion: !isUnDeleteAction,
            ...filters,
        })
            .then(res => {
                openSnackBar(
                    succesfullSnackBar('saveMultiEditOrgUnitsSuccesfull'),
                );
                successFn();
                dispatch(setInstancesFetching(false));
                return res;
            })
            .catch(error => {
                openSnackBar(
                    errorSnackBar('saveMultiEditOrgUnitsError', null, error),
                );
                dispatch(setInstancesFetching(false));
            });
    };
