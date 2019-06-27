import { loadActions } from '../../../redux/load';

export const FETCH_ACTION = 'hat/management/zones/FETCH_ACTION';
export const FETCH_ACTION_NO_UPDATE = 'hat/management/zones/FETCH_ACTION_NO_UPDATE';
export const SET_ZONES = 'hat/management/zones/SET_ZONES';
export const ZONE_UPDATED = 'hat/management/zones/ZONE_UPDATED';
export const SELECT_ZONE = 'hat/management/zones/SELECT_ZONE';
export const UPDATE_CURRENT_ZONE = 'hat/management/zones/UPDATE_CURRENT_ZONE';
export const SET_GEO_PROVINCES = 'hat/management/zones/SET_GEO_PROVINCES';
export const SET_GEO_ZONES = 'hat/management/zones/SET_GEO_ZONES';
export const SET_GEO_AREAS = 'hat/management/zones/SET_GEO_AREAS';

const req = require('superagent');

export const setZones = payload => ({
    type: SET_ZONES,
    payload,
});


export const zoneUpdated = payload => ({
    type: ZONE_UPDATED,
    payload,
});

export const updateCurrentZone = payload => ({
    type: UPDATE_CURRENT_ZONE,
    payload,
});


export const selectZone = payload => ({
    type: SELECT_ZONE,
    payload,
});

export const setGeoProvinces = payload => ({
    type: SET_GEO_PROVINCES,
    payload,
});


export const setGeoZones = payload => ({
    type: SET_GEO_ZONES,
    payload,
});


export const setGeoAreas = payload => ({
    type: SET_GEO_AREAS,
    payload,
});

export const updateZone = (dispatch, zone) => {
    dispatch(loadActions.startLoading());
    req
        .patch(`/api/zs/${zone.id}/`) // partial_update
        .set('Content-Type', 'application/json')
        .send(zone)
        .then(() => {
            dispatch(zoneUpdated(true));
            dispatch(loadActions.successLoadingNoData());
        })
        .catch((err) => {
            dispatch(loadActions.errorLoading(err));
        });
    return ({
        type: FETCH_ACTION,
    });
};

// Delete action will only mark it as erased

export const deleteZone = (dispatch, zone) => {
    const erasedZone = {
        ...zone,
        is_erased: true,
    };
    dispatch(loadActions.startLoading());
    req
        .patch(`/api/zs/${zone.id}/`) // partial_update
        .set('Content-Type', 'application/json')
        .send(erasedZone)
        .then(() => {
            dispatch(zoneUpdated(true));
            dispatch(loadActions.successLoadingNoData());
        })
        .catch((err) => {
            dispatch(loadActions.errorLoading(err));
            console.error('Error when deleting zone', err);
        });
    return ({
        type: FETCH_ACTION,
    });
};


export const fetchGeoDatas = (dispatch) => {
    req
        .get('/api/provinces/?geojson=true')
        .set('Content-Type', 'application/json')
        .then((res) => {
            dispatch(setGeoProvinces(res.body));
        })
        .catch((err) => {
            dispatch(loadActions.errorLoading(err));
        });
    req
        .get('/api/zs/?geojson=true')
        .set('Content-Type', 'application/json')
        .then((res) => {
            dispatch(setGeoZones(res.body));
        })
        .catch((err) => {
            dispatch(loadActions.errorLoading(err));
        });
    req
        .get('/api/as/?geojson=true')
        .set('Content-Type', 'application/json')
        .then((res) => {
            dispatch(setGeoAreas(res.body));
        })
        .catch((err) => {
            dispatch(loadActions.errorLoading(err));
        });
    return ({
        type: FETCH_ACTION,
    });
};

export const zonesInitialState = {
    isUpdated: false,
    list: [],
    current: null,
    geoProvinces: {},
    geoZones: {},
    geoAreas: {},
};

export const zoneActions = {
    updateZone,
    setZones,
    zoneUpdated,
    deleteZone,
    selectZone,
    updateCurrentZone,
    fetchGeoDatas,
};


export const zoneReducer = (state = zonesInitialState, action = {}) => {
    switch (action.type) {
        case SET_ZONES: {
            const list = action.payload;
            return {
                ...state,
                list,
            };
        }

        case SELECT_ZONE: {
            const current = action.payload;
            return {
                ...state,
                current,
            };
        }

        case ZONE_UPDATED: {
            const isUpdated = action.payload;
            return {
                ...state,
                isUpdated,
            };
        }

        case FETCH_ACTION: {
            return {
                ...state,
            };
        }

        case FETCH_ACTION_NO_UPDATE: {
            return {
                ...state,
            };
        }

        case UPDATE_CURRENT_ZONE: {
            const current = action.payload;
            return {
                ...state,
                current,
            };
        }

        case SET_GEO_PROVINCES: {
            const geoProvinces = action.payload;
            return {
                ...state,
                geoProvinces,
            };
        }

        case SET_GEO_ZONES: {
            const geoZones = action.payload;
            return {
                ...state,
                geoZones,
            };
        }

        case SET_GEO_AREAS: {
            const geoAreas = action.payload;
            return {
                ...state,
                geoAreas,
            };
        }

        default:
            return state;
    }
};
