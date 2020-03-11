import { bindActionCreators } from 'redux';

import { loadActions } from '../redux/load';
import { enqueueSnackbar } from '../redux/snackBarsReducer';
import { errorSnackBar } from './constants/snackBars';

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
            console.error(`Error while fetching ${reduxAction.errorLabel}: ${err}`);
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
