import { loadActions } from '../../../redux/load';

export const FETCH_ACTION = 'hat/management/areas/FETCH_ACTION';
export const FETCH_ACTION_NO_UPDATE = 'hat/management/areas/FETCH_ACTION_NO_UPDATE';
export const SET_AREAS = 'hat/management/areas/SET_AREAS';
export const AREA_UPDATED = 'hat/management/areas/AREA_UPDATED';
export const SELECT_AREA = 'hat/management/areas/SELECT_AREA';
export const UPDATE_CURRENT_AREA = 'hat/management/areas/UPDATE_CURRENT_AREA';
export const SET_GEO_PROVINCES = 'hat/management/areas/SET_GEO_PROVINCES';
export const SET_GEO_ZONES = 'hat/management/areas/SET_GEO_ZONES';
export const SET_GEO_AREAS = 'hat/management/areas/SET_GEO_AREAS';

const req = require('superagent');

export const setAreas = payload => ({
    type: SET_AREAS,
    payload,
});


export const areaUpdated = payload => ({
    type: AREA_UPDATED,
    payload,
});

export const updateCurrentArea = payload => ({
    type: UPDATE_CURRENT_AREA,
    payload,
});


export const selectArea = payload => ({
    type: SELECT_AREA,
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

export const updateArea = (dispatch, area) => {
    dispatch(loadActions.startLoading());
    req
        .patch(`/api/as/${area.id}/`) // partial_update
        .set('Content-Type', 'application/json')
        .send(area)
        .then(() => {
            dispatch(areaUpdated(true));
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

export const deleteArea = (dispatch, area) => {
    const erasedArea = {
        ...area,
        is_erased: true,
    };
    dispatch(loadActions.startLoading());
    req
        .patch(`/api/as/${area.id}/`) // partial_update
        .set('Content-Type', 'application/json')
        .send(erasedArea)
        .then(() => {
            dispatch(areaUpdated(true));
            dispatch(loadActions.successLoadingNoData());
        })
        .catch((err) => {
            dispatch(loadActions.errorLoading(err));
            console.error('Error when deleting area', err);
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
            dispatch(setGeoAreas(res.body));
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

export const areasInitialState = {
    isUpdated: false,
    list: [],
    current: null,
    geoProvinces: {},
    geoZones: {},
    geoAreas: {},
};

export const areaActions = {
    updateArea,
    setAreas,
    areaUpdated,
    deleteArea,
    selectArea,
    updateCurrentArea,
    fetchGeoDatas,
};


export const areaReducer = (state = areasInitialState, action = {}) => {
    switch (action.type) {
        case SET_AREAS: {
            const list = action.payload;
            return {
                ...state,
                list,
            };
        }

        case SELECT_AREA: {
            const current = action.payload;
            return {
                ...state,
                current,
            };
        }

        case AREA_UPDATED: {
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

        case UPDATE_CURRENT_AREA: {
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
