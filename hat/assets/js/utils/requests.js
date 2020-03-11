import { bindActionCreators } from 'redux';

import { loadActions } from '../redux/load';
import { enqueueSnackbar } from '../redux/snackBarsReducer';
import { errorSnackBar, succesfullSnackBar } from './constants/snackBars';

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
        .then((result) => {
            if (toggleLoad) {
                dispatch(loadActions.successLoadingNoData());
            }
            const reduxAction = setAction(result.body);
            dispatch(reduxAction);
            return true;
        })
        .catch((err) => {
            const reduxAction = setAction(null);
            dispatch(enqueueSnackbar(errorSnackBar(null, reduxAction.errorMessage)));
            console.error(`${reduxAction.errorMessage}: ${err}`);
            return err;
        });
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
        .then((result) => {
            if (toggleLoad) {
                dispatch(loadActions.successLoadingNoData());
            }
            const reduxAction = putAction(result.body);
            dispatch(enqueueSnackbar(succesfullSnackBar(null, {
                id: 'main.snackBar.successful',
                defaultMessage: 'Saved successfully',
            })));
            dispatch(reduxAction);
            return true;
        })
        .catch((err) => {
            const reduxAction = putAction(null);
            dispatch(enqueueSnackbar(errorSnackBar(null, reduxAction.errorMessage)));
            console.error(`${reduxAction.errorMessage}: ${err}`);
            return err;
        });
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
        .then((result) => {
            if (toggleLoad) {
                dispatch(loadActions.successLoadingNoData());
            }
            const reduxAction = postAction(result.body);
            dispatch(enqueueSnackbar(succesfullSnackBar(null, {
                id: 'main.snackBar.successful',
                defaultMessage: 'Saved successfully',
            })));
            dispatch(reduxAction);
            return true;
        })
        .catch((err) => {
            const reduxAction = postAction(null);
            dispatch(enqueueSnackbar(errorSnackBar(null, reduxAction.errorMessage)));
            console.error(`${reduxAction.errorMessage}: ${err}`);
            return err;
        });
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
        .then((result) => {
            if (toggleLoad) {
                dispatch(loadActions.successLoadingNoData());
            }
            const reduxAction = patchAction(result.body);
            dispatch(enqueueSnackbar(succesfullSnackBar(null, {
                id: 'main.snackBar.successful',
                defaultMessage: 'Saved successfully',
            })));
            dispatch(reduxAction);
            return true;
        })
        .catch((err) => {
            const reduxAction = patchAction(null);
            dispatch(enqueueSnackbar(errorSnackBar(null, reduxAction.errorMessage)));
            console.error(`${reduxAction.errorMessage}: ${err}`);
            return err;
        });
};
