
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

export const selectProvince = (provinceId, dispatch, zoneId = null, areaId = null, villageId = null) => {
    dispatch(locatorActions.resetFilters());
    dispatch(locatorActions.emptyVillages());
    if (provinceId) {
        req
            .get(`/api/zs/?province_id=${provinceId}`)
            .then((result) => {
                const payload = { zones: result.body, provinceId };
                dispatch(locatorActions.loadZones(payload));
                if (zoneId) {
                    dispatch(locatorActions.selectZone(zoneId, undefined, dispatch, true, areaId, villageId));
                } else {
                    dispatch(loadActions.successLoadingNoData());
                }
            })
            .catch((err) => {
                dispatch(loadActions.errorLoading(err));
                console.error(`Error while fetching zones: ${err}`);
            });
    }
    return ({
        type: FETCH_ACTION,
    });
};

export const provinceActions = {
    loadProvinces,
    fetchProvinces,
    selectProvince,
};
