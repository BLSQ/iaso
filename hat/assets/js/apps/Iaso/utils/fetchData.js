import { push } from 'react-router-redux';
import request from './request';
import {
    LOAD,
    LOAD_SUCCESS,
    LOAD_SUCCESS_NO_DATA,
    LOAD_ERROR,
} from '../redux/load';

const req = require('superagent');

export function createUrl(params, url = '/charts') {
    // Create a url from an params object
    // e.g.: `{foo: 11, bar: 22} => '/foo/11/bar/22'`
    Object.keys(params).forEach(key => {
        const value = params[key];
        if (value) {
            url += `/${key}/${value}`; // eslint-disable-line
        }
    });
    return url;
}

export function checkLocation(params, results, dispatch) {
    // Check if we have data for the selected location,
    // if not, redirect
    const selectedLocation =
        params.location && decodeURIComponent(params.location);
    const validLocation = results.locations.some(
        location => location === selectedLocation,
    );
    if (selectedLocation && !validLocation) {
        // No data for this location, redirect to all
        dispatch(push(createUrl({ ...params, location: '' })));
        return false;
    }
    return true;
}

export function fetchUrls(urls, params, oldParams, dispatch, checkResults) {
    dispatch({
        type: LOAD,
    });

    const promises = urls.map(config => {
        const ps = { ...config.defaultParams, ...params };
        if (config.paramsToRemove) {
            delete ps[config.paramsToRemove];
        }
        let { url } = config;
        if (typeof config.id !== 'undefined' && ps[config.id]) {
            url = `${config.url}${ps[config.id]}`;
        }
        return request([
            ['get', url],
            ['set', 'accept', 'application/json'],
            ['query', ps],
        ]);
    });
    return Promise.all(promises)
        .then(results => {
            // Create a payload object where the key is the name defined for
            // the url and the value is the response content.
            const payload = results.reduce((payload, result, i) => {
                // eslint-disable-line
                payload[urls[i].name] = result; // eslint-disable-line
                return payload;
            }, {});
            // Call `checkResults` which can abort and takeover here
            if (checkResults && !checkResults(params, payload, dispatch)) {
                return;
            }
            // Collect all responses in one action
            dispatch({
                type: LOAD_SUCCESS,
                payload,
            });
        })
        .catch(err => {
            dispatch({
                type: LOAD_ERROR,
                payload: err,
            });
        });
}

export function launchAlgo(algoParams, dispatch) {
    dispatch({
        type: LOAD,
    });
    return req
        .put('/api/algo/1/')
        .set('Content-Type', 'application/json')
        .send(algoParams)
        .then(result => {
            dispatch({
                type: LOAD_SUCCESS_NO_DATA,
            });
            return result.body;
        })
        .catch(err => {
            dispatch({
                type: LOAD_ERROR,
                payload: err,
            });
        });
}

export function getRequest(url, dispatch, key = null, displayLoader = true) {
    if (displayLoader) {
        dispatch({
            type: LOAD,
        });
    }
    return req
        .get(url)
        .then(result => {
            if (displayLoader) {
                dispatch({
                    type: LOAD_SUCCESS_NO_DATA,
                });
            }
            let tempResult = {};
            if (key !== null) {
                tempResult[key] = result.body;
            } else {
                tempResult = result.body;
            }
            return tempResult;
        })
        .catch(err => {
            if (displayLoader) {
                dispatch({
                    type: LOAD_ERROR,
                    payload: err,
                });
            }
        });
}
