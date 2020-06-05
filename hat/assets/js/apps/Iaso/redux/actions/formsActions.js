import {
    getRequest, patchRequest, postRequest, deleteRequest,
} from '../../libs/Api';
import { enqueueSnackbar } from '../../../../redux/snackBarsReducer';
import { errorSnackBar, succesfullSnackBar } from '../../../../utils/constants/snackBars';

/**
* Fetch action to get a list of items
* @param {Function} dispatch Redux function to trigger an action
* @param {Object} params Url params used for the pagination
* @param {String} apiKey The endpoint key used
* @param {String} resultKey The key of the list returned by the api ({ groups: [...], ...})
* @param {Function} setIsFetching The loading action to display the loading state
* @param {Function} setAction Set action to put the list in redux
* @param {String} errorKeyMessage The key of the error message used by the snackbar
*/
export const fetchAction = (
    dispatch,
    params,
    apiKey,
    resultKey,
    setIsFetching,
    setAction,
    errorKeyMessage,
) => {
    let url = `/api/${apiKey}`;
    if (params) {
        url += `?order=${params.order}&limit=${params.pageSize}&page=${params.page}`;
        if (params.search) {
            url += `&search=${params.search}`;
        }
        dispatch(setIsFetching(true));
    }
    return getRequest(url)
        .then(res => dispatch(
            setAction(res[resultKey], params
                ? { count: res.count, pages: res.pages } : { count: res[resultKey].length, pages: 1 }),
        ))
        .catch(() => dispatch(enqueueSnackbar(errorSnackBar(errorKeyMessage))))
        .then(() => {
            if (params) {
                dispatch(setIsFetching(false));
            }
        });
};

/**
* Save action to update one item
* @param {Function} dispatch Redux function to trigger an action
* @param {Object} item The item to save
* @param {String} apiKey The endpoint key used
* @param {Function} setIsFetching The loading action to display the loading state
* @param {String} successKeyMessage The key of the success message used by the snackbar
* @param {String} errorKeyMessage The key of the error message used by the snackbar
*/
export const saveAction = (
    dispatch,
    item,
    apiKey,
    setIsFetching,
    successKeyMessage,
    errorKeyMessage,
) => {
    dispatch(setIsFetching(true));
    return (patchRequest(`/api/${apiKey}/${item.id}/`, item, true)
        .then((res) => {
            dispatch(enqueueSnackbar(succesfullSnackBar(successKeyMessage)));
            return res;
        })
        .catch((error) => {
            dispatch(enqueueSnackbar(errorSnackBar(errorKeyMessage)));
            dispatch(setIsFetching(false));
            throw error;
        }));
};

/**
* Save action to create one item
* @param {Function} dispatch Redux function to trigger an action
* @param {Object} item The item to create
* @param {String} apiKey The endpoint key used
* @param {Function} setIsFetching The loading action to display the loading state
* @param {String} successKeyMessage The key of the success message used by the snackbar
* @param {String} errorKeyMessage The key of the error message used by the snackbar
*/
export const createAction = (
    dispatch,
    item,
    apiKey,
    setIsFetching,
    successKeyMessage,
    errorKeyMessage,
) => {
    dispatch(setIsFetching(true));
    return (postRequest(`/api/${apiKey}/`, item)
        .then((res) => {
            dispatch(enqueueSnackbar(succesfullSnackBar(successKeyMessage)));
            return res;
        })
        .catch((error) => {
            dispatch(enqueueSnackbar(errorSnackBar(errorKeyMessage)));
            dispatch(setIsFetching(false));
            throw error;
        }));
};

/**
* Delete action to delete one item
* @param {Function} dispatch Redux function to trigger an action
* @param {Object} item The item to delete
* @param {String} apiKey The endpoint key used
* @param {Object} params Url params used for the pagination
* @param {Function} setIsFetching The loading action to display the loading state
* @param {String} resultKey The key of the list returned by the api ({ groups: [...], ...})
* @param {Function} setAction Set action to put the list in redux
* @param {String} successKeyMessage The key of the success message used by the snackbar
* @param {String} errorKeyMessage The key of the error message used by the snackbar
*/
export const deleteAction = (
    dispatch,
    item,
    apiKey,
    resultKey,
    params,
    setIsFetching,
    setAction,
    successKeyMessage,
    errorKeyMessage,
) => {
    dispatch(setIsFetching(true));
    return (deleteRequest(`/api/${apiKey}/${item.id}/`)
        .then((res) => {
            dispatch(enqueueSnackbar(succesfullSnackBar(successKeyMessage)));
            dispatch(fetchAction(
                params,
                apiKey,
                resultKey,
                setIsFetching,
                setAction,
                errorKeyMessage,
            ));
            return res;
        })
        .catch((error) => {
            dispatch(enqueueSnackbar(errorSnackBar(errorKeyMessage)));
            dispatch(setIsFetching(false));
            throw error;
        }));
};
