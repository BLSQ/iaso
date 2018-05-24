
import { loadActions } from '../../../redux/load';
import { locatorActions, FETCH_ACTION } from './locator';

export const LOAD_PROVINCES = 'hat/locator/locator/LOAD_PROVINCES';

const req = require('superagent');

export const loadProvinces = payload => ({
    type: LOAD_PROVINCES,
    payload,
});

export const fetchProvinces = (dispatch) => {
    req
        .get('/api/provinces/')
        .then((result) => {
            dispatch(loadProvinces(result.body));
        })
        .catch(err => (console.error(`Error while fetching plannings ${err}`)));
    return ({
        type: FETCH_ACTION,
    });
};

export const selectProvince = (provinceId, dispatch) => {
    req
        .get(`/api/zs/?province_id=${provinceId}`)
        .then((result) => {
            dispatch(loadActions.successLoadingNoData());
            const payload = { zones: result.body, provinceId };
            dispatch(locatorActions.loadZones(payload));
        })
        .catch((err) => {
            dispatch(loadActions.errorLoading(err));
            console.error(`Error while fetching zones: ${err}`);
        });
    return ({
        type: FETCH_ACTION,
    });
};

export const provinceActions = {
    loadProvinces,
    fetchProvinces,
    selectProvince,
};
