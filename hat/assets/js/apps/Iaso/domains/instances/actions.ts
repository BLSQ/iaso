import { postRequest } from 'Iaso/libs/Api';
import { openSnackBar } from '../../components/snackBars/EventDispatcher';
import { errorSnackBar, succesfullSnackBar } from '../../constants/snackBars';

/* Submission Creation workflow
 *  1. this function call backend create Instance in DB
 *  2. backend contact enketo to generate a Form page
 *  3. backend return an url to enketo
 *  4. this function redirect  to the Enketo service
 *  5. After submission Enketo/Backend redirect to the submission detail page
 *  See enketo/README.md for full details.
 */
export const createInstance = payload => {
    return postRequest('/api/enketo/create/', {
        org_unit_id: payload.org_unit,
        form_id: payload.currentInstance.id,
        period: payload.period,
    }).then(
        // Redirect the browser to Enketo
        createRequest => {
            window.location = createRequest.edit_url;
        },
        err => {
            openSnackBar(errorSnackBar(undefined, 'Enketo', err));
        },
    );
};

export const createExportRequest = (filterParams, selection) => {
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
        .then(_ => {
            openSnackBar(succesfullSnackBar('createExportRequestSuccess'));
        })
        .catch(err => {
            const key = err.details
                ? `createExportRequestError${err.details.code}`
                : 'createExportRequestError';
            openSnackBar(errorSnackBar(key, null, err));
        });
};

export const bulkDelete = (selection, filters, isUnDeleteAction, successFn) => {
    return postRequest('/api/instances/bulkdelete/', {
        select_all: selection.selectAll,
        selected_ids: selection.selectedItems.map(i => i.id),
        unselected_ids: selection.unSelectedItems.map(i => i.id),
        is_deletion: !isUnDeleteAction,
        ...filters,
    })
        .then(res => {
            openSnackBar(succesfullSnackBar('saveMultiEditOrgUnitsSuccesfull'));
            successFn();
            return res;
        })
        .catch(error => {
            openSnackBar(
                errorSnackBar('saveMultiEditOrgUnitsError', null, error),
            );
        });
};
