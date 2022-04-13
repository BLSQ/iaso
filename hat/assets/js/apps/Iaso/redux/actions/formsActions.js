import {
    getRequest,
    patchRequest,
    postRequest,
    putRequest,
    deleteRequest,
} from 'Iaso/libs/Api';
import { enqueueSnackbar } from '../snackBarsReducer';
import { errorSnackBar, succesfullSnackBar } from '../../constants/snackBars';

/**
 * Fetch action to get a list of items
 * @param {Function} dispatch Redux function to trigger an action
 * @param {String} apiPath The endpoint path used
 * @param {Function} setAction Set action to put the list in redux
 * @param {String} errorKeyMessage The key of the error message used by the snackbar
 * @param {String} resultKey The key of the list returned by the api ({ groups: [...], ...})
 * @param {Object} params Url params used for the pagination
 * @param {Function} setIsLoading The loading action to display the loading state
 */
export const fetchAction = (
    dispatch,
    apiPath,
    setAction,
    errorKeyMessage,
    resultKey = null,
    params = null,
    setIsLoading = null,
) => {
    let url = `/api/${apiPath}/`;
    if (params) {
        url += `?order=${params.order}&limit=${params.pageSize}&page=${params.page}`;
        if (params.search) {
            url += `&search=${params.search}`;
        }

        if (setIsLoading !== null) {
            dispatch(setIsLoading(true));
        }
    }
    return getRequest(url)
        .then(res => {
            const result = resultKey ? res[resultKey] : res;
            return dispatch(
                setAction(
                    result,
                    params
                        ? { count: res.count, pages: res.pages }
                        : { count: result.length, pages: 1 },
                ),
            );
        })
        .catch(err =>
            dispatch(
                enqueueSnackbar(errorSnackBar(errorKeyMessage, null, err)),
            ),
        )
        .then(() => {
            if (params && setIsLoading !== null) {
                dispatch(setIsLoading(false));
            }
        });
};

/**
 * Fetch action to get a list of items
 * @param {Function} dispatch Redux function to trigger an action
 * @param {String} apiPath The endpoint path used
 * @param {Number|String} itemId The resource id (or a string in very specific cases, such as "me")
 * @param {Function} setAction Set action to put the list in redux
 * @param {String} errorKeyMessage The key of the error message used by the snackbar
 * @param {Function} setIsLoading The loading action to display the loading state
 */
export const retrieveAction = (
    dispatch,
    apiPath,
    itemId,
    setAction,
    errorKeyMessage,
    setIsLoading = null,
) => {
    const url = `/api/${apiPath}/${itemId}/`;
    if (setIsLoading !== null) {
        dispatch(setIsLoading(true));
    }

    return getRequest(url)
        .then(res => dispatch(setAction(res)))
        .catch(err =>
            dispatch(
                enqueueSnackbar(errorSnackBar(errorKeyMessage, null, err)),
            ),
        )
        .then(() => {
            if (setIsLoading !== null) {
                dispatch(setIsLoading(false));
            }
        });
};

/**
 * Save action to update one item
 * @param {Function} dispatch Redux function to trigger an action
 * @param {Object} item The item to save
 * @param {String} apiPath The endpoint path used
 * @param {String} successKeyMessage The key of the success message used by the snackbar
 * @param {String} errorKeyMessage The key of the error message used by the snackbar
 * @param {Function} setIsLoading The loading action to display the loading state
 * @param {Array} ignoredErrorCodes array of status error code to ignore while displaying snackbars
 */

export const updateAction = (
    dispatch,
    item,
    apiPath,
    successKeyMessage,
    errorKeyMessage,
    setIsLoading = null,
    ignoredErrorCodes,
) => {
    if (setIsLoading !== null) {
        dispatch(setIsLoading(true));
    }
    return putRequest(`/api/${apiPath}/${item.id}/`, item)
        .then(res => {
            dispatch(enqueueSnackbar(succesfullSnackBar(successKeyMessage)));
            return res;
        })
        .catch(err => {
            if (
                !ignoredErrorCodes ||
                (ignoredErrorCodes && !ignoredErrorCodes.includes(err.status))
            ) {
                dispatch(
                    enqueueSnackbar(errorSnackBar(errorKeyMessage, null, err)),
                );
            }
            throw err;
        })
        .finally(() => {
            if (setIsLoading !== null) {
                dispatch(setIsLoading(false));
            }
        });
};

export const saveAction = (
    dispatch,
    item,
    apiPath,
    successKeyMessage,
    errorKeyMessage,
    setIsLoading = null,
    ignoredErrorCodes,
    setResultFunction = null,
) => {
    if (setIsLoading !== null) {
        dispatch(setIsLoading(true));
    }
    return patchRequest(`/api/${apiPath}/${item.id}/`, item)
        .then(res => {
            dispatch(enqueueSnackbar(succesfullSnackBar(successKeyMessage)));
            return res;
        })
        .then(res => {
            if (setResultFunction) {
                dispatch(setResultFunction(res));
            }
            return res;
        })

        .catch(err => {
            if (
                !ignoredErrorCodes ||
                (ignoredErrorCodes && !ignoredErrorCodes.includes(err.status))
            ) {
                dispatch(
                    enqueueSnackbar(errorSnackBar(errorKeyMessage, null, err)),
                );
            }
            throw err;
        })
        .finally(() => {
            if (setIsLoading !== null) {
                dispatch(setIsLoading(false));
            }
        });
};

/**
 * Save action to create one item
 * @param {Function} dispatch Redux function to trigger an action
 * @param {Object} item The item to create
 * @param {String} apiPath The endpoint path used
 * @param {String} successKeyMessage The key of the success message used by the snackbar
 * @param {String} errorKeyMessage The key of the error message used by the snackbar
 * @param {Function} setIsLoading The loading action to display the loading state
 * @param {Array} ignoredErrorCodes array of status error code to ignore while displaying snackbars
 */
export const createAction = (
    dispatch,
    item,
    apiPath,
    successKeyMessage,
    errorKeyMessage,
    setIsLoading = null,
    ignoredErrorCodes,
) => {
    if (setIsLoading !== null) {
        dispatch(setIsLoading(true));
    }
    return postRequest(`/api/${apiPath}/`, item)
        .then(res => {
            dispatch(enqueueSnackbar(succesfullSnackBar(successKeyMessage)));
            return res;
        })
        .catch(err => {
            if (
                !ignoredErrorCodes ||
                (ignoredErrorCodes && !ignoredErrorCodes.includes(err.status))
            ) {
                dispatch(
                    enqueueSnackbar(errorSnackBar(errorKeyMessage, null, err)),
                );
            }
            throw err;
        })
        .finally(() => {
            if (setIsLoading !== null) {
                dispatch(setIsLoading(false));
            }
        });
};

/**
 * Delete action to delete one item
 * @param {Function} dispatch Redux function to trigger an action
 * @param {Object} item The item to delete
 * @param {String} apiPath The endpoint path used
 * @param {Function} setAction Set action to put the list in redux
 * @param {String} successKeyMessage The key of the success message used by the snackbar
 * @param {String} errorKeyMessage The key of the error message used by the snackbar
 * @param {String} resultKey The key of the list returned by the api ({ groups: [...], ...})
 * @param {Object} params Url params used for the pagination
 * @param {Function} setIsLoading The loading action to display the loading state
 */
export const deleteAction = (
    dispatch,
    item,
    apiPath,
    setAction,
    successKeyMessage,
    errorKeyMessage,
    resultKey = null,
    params = null,
    setIsLoading = null,
) => {
    if (setIsLoading !== null) {
        dispatch(setIsLoading(true));
    }
    return deleteRequest(`/api/${apiPath}/${item.id}/`)
        .then(res => {
            dispatch(enqueueSnackbar(succesfullSnackBar(successKeyMessage)));
            fetchAction(
                dispatch,
                apiPath,
                setAction,
                errorKeyMessage,
                resultKey,
                params,
                setIsLoading,
            );
            return res;
        })
        .catch(err => {
            dispatch(
                enqueueSnackbar(errorSnackBar(errorKeyMessage, null, err)),
            );
            if (setIsLoading !== null) {
                dispatch(setIsLoading(false));
            }
            throw err;
        });
};
