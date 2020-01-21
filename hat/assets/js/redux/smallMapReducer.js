
/*
 * Includes the actions and state necessary to display the map view
 */

export const UNKNOWN = 'hat/smallMap/UNKNWON';
export const BASE_LAYER_CHANGE = 'hat/smallMap/BASE_LAYER_CHANGE';
export const SET_GEO_PROVINCES = 'hat/smallMap/SET_GEO_PROVINCES';
export const SET_GEO_ZONES = 'hat/smallMap/SET_GEO_ZONES';
export const SET_GEO_AREAS = 'hat/smallMap/SET_GEO_AREAS';
export const FETCH_ACTION = 'hat/smallMap/FETCH_ACTION';
export const SET_IS_LOADING_SHAPES = 'hat/smallMap/SET_IS_LOADING_SHAPES';

const req = require('superagent');

export const smallMapLayerTypes = {
    legend: 1,
    baseLayer: 2,
    overlay: 3,
};

export const smallMapBaseLayers = [
    'blank',
    'osm',
    'arcgis-street',
    'arcgis-satellite',
    'arcgis-topo',
];

export const changeLayer = (layerType, payload) => {
    switch (layerType) {
        case smallMapLayerTypes.baseLayer:
            return {
                type: BASE_LAYER_CHANGE,
                payload,
            };

        default:
            return { type: UNKNOWN };
    }
};

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

export const setIsLoadingShapes = payload => ({
    type: SET_IS_LOADING_SHAPES,
    payload,
});


export const fetchGeoDatas = (
    dispatch,
    fetchProvinces = true,
    fetchZone = true,
    fetchAreas = true,
) => {
    const promisesList = [];
    dispatch(setIsLoadingShapes(true));
    if (fetchProvinces) {
        promisesList.push(
            req
                .get('/api/provinces/?geojson=true')
                .set('Content-Type', 'application/json')
                .then((res) => {
                    dispatch(setGeoProvinces(res.body));
                })
                .catch((err) => {
                    console.error('Error while loading provinces shape', err);
                }),
        );
    }
    if (fetchZone) {
        promisesList.push(
            req
                .get('/api/zs/?geojson=true')
                .set('Content-Type', 'application/json')
                .then((res) => {
                    dispatch(setGeoZones(res.body));
                })
                .catch((err) => {
                    console.error('Error while loading zones shape', err);
                }),
        );
    }

    if (fetchAreas) {
        promisesList.push(
            req
                .get('/api/as/?geojson=true')
                .set('Content-Type', 'application/json')
                .then((res) => {
                    dispatch(setGeoAreas(res.body));
                })
                .catch((err) => {
                    console.error('Error while loading areas shape', err);
                }),
        );
    }

    Promise.all(promisesList).then(() => {
        dispatch(setIsLoadingShapes(false));
    });
    return ({
        type: FETCH_ACTION,
    });
};


export const smallMapActions = {
    changeLayer,
    fetchGeoDatas,
};

export const smallMapInitialState = {
    baseLayer: 'arcgis-topo',
    geoProvinces: {},
    geoZones: {},
    geoAreas: {},
    isLoadingShape: false,
};

export const smallMapReducer = (state = smallMapInitialState, action = {}) => {
    switch (action.type) {
        case BASE_LAYER_CHANGE: {
            const baseLayer = action.payload;

            if (smallMapBaseLayers.indexOf(baseLayer) === -1) {
                return state;
            }
            return { ...state, baseLayer };
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

        case SET_IS_LOADING_SHAPES: {
            const isLoadingShape = action.payload;
            return {
                ...state,
                isLoadingShape,
            };
        }

        default:
            return state;
    }
};
