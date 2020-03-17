import { bindActionCreators } from 'redux';

import { loadActions } from '../redux/load';
import { enqueueSnackbar } from '../redux/snackBarsReducer';
import { errorSnackBar, succesfullSnackBar } from './constants/snackBars';

const MESSAGES = {
    error: {
        id: 'main.snackBar.error',
        defaultMessage: 'An error occured',
    },
    success: {
        id: 'main.snackBar.successful',
        defaultMessage: 'Saved successfully',
    },
};

const returnSuccess = (
    dispatch,
    result,
    action,
    toggleLoad,
    displaySnackBar,
    successMessage,
) => {
    if (toggleLoad) {
        dispatch(loadActions.successLoadingNoData());
    }
    const reduxAction = action(result.body);
    dispatch(reduxAction);
    if (displaySnackBar) {
        dispatch(enqueueSnackbar(succesfullSnackBar(null, successMessage || MESSAGES.success)));
    }
    return result.body;
};

const returnError = (dispatch, err, action) => {
    let message = MESSAGES.error;
    const reduxAction = action(null);
    if (reduxAction.errorMessage) {
        message = reduxAction.errorMessage;
    }
    dispatch(enqueueSnackbar(errorSnackBar(null, message)));
    console.error(`${message}: ${err}`);
    return err;
};

const req = require('superagent');

/**
 * This function make an async call to the given url and dispatch an action when done
 * Trigger aslo snackbars
 *
 * @param {String} url
 * @param {Function} setAction
 * @param {Boolean} toggleLoad
 * @return {Promise}
 */
export const fetchRequest = (
    url,
    setAction,
    toggleLoad = true,
) => (dispatch) => {
    if (toggleLoad) {
        dispatch(loadActions.startLoading());
    }
    return req
        .get(url)
        .then(result => returnSuccess(dispatch, result, setAction, toggleLoad, false))
        .catch(err => returnError(dispatch, err, setAction));
};

/**
 * This function is chaining mutliple async call to multiple urls
 *
 * @param {Array} urls
 * @param {Array} actions
 * @param {Function} dispatch
 * @return {Promise}
 */

export const fetchMutliRequests = requestsList => (dispatch) => {
    const dispatchFetchRequest = bindActionCreators(fetchRequest, dispatch);
    const promisesArray = [];
    requestsList.forEach((request) => {
        promisesArray.push(
            dispatchFetchRequest(
                request.url,
                request.action,
                false,
            ),
        );
    });
    dispatch(loadActions.startLoading());
    return Promise.all(promisesArray).then(() => {
        dispatch(loadActions.successLoadingNoData());
    });
};

/**
 * This function make an async put call to the given url and dispatch an action when done
 * Trigger aslo snackbars
 *
 * @param {String} url
 * @param {Object} data
 * @param {Function} putAction
 * @param {Boolean} toggleLoad
 * @return {Promise}
 */
export const putRequest = (
    url,
    data,
    putAction,
    toggleLoad = true,
) => (dispatch) => {
    if (toggleLoad) {
        dispatch(loadActions.startLoading());
    }
    return req
        .put(url)
        .set('Content-Type', 'application/json')
        .send(data)
        .then(result => returnSuccess(dispatch, result, putAction, toggleLoad, true))
        .catch(err => returnError(dispatch, err, putAction));
};


/**
 * This function make an async post call to the given url and dispatch an action when done
 * Trigger aslo snackbars
 *
 * @param {String} url
 * @param {Object} data
 * @param {Function} postAction
 * @param {Boolean} toggleLoad
 * @return {Promise}
 */
export const postRequest = (
    url,
    data,
    postAction,
    toggleLoad = true,
) => (dispatch) => {
    if (toggleLoad) {
        dispatch(loadActions.startLoading());
    }
    return req
        .post(url)
        .set('Content-Type', 'application/json')
        .send(data)
        .then(result => returnSuccess(dispatch, result, postAction, toggleLoad, true))
        .catch(err => returnError(dispatch, err, postAction));
};


/**
 * This function make an async post call to the given url and dispatch an action when done
 * Trigger aslo snackbars
 *
 * @param {String} url
 * @param {Object} data
 * @param {Function} patchAction
 * @param {Boolean} toggleLoad
 * @return {Promise}
 */
export const patchRequest = (
    url,
    data,
    patchAction,
    toggleLoad = true,
) => (dispatch) => {
    if (toggleLoad) {
        dispatch(loadActions.startLoading());
    }
    return req
        .patch(url)
        .set('Content-Type', 'application/json')
        .send(data)
        .then(result => returnSuccess(dispatch, result, patchAction, toggleLoad, true))
        .catch(err => returnError(dispatch, err, patchAction));
};
