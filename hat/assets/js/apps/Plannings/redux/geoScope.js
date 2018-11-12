/*
 * Includes the actions and state necessary to display the map view
 */

export const UNKNOWN = 'hat/microplanning/leaflet/geoscope/action/UNKNWON';
export const BASE_LAYER_CHANGE = 'hat/microplanning/leaflet/geoscope/base-layer/CHANGE';
export const LEAFLET_MAP = 'hat/microplanning/leaflet/geoscope/MAP';
export const FETCH_ACTION = 'hat/microplanning/leaflet/FETCH_ACTION';
export const SHOW_COORDINATION_DETAIL = 'hat/microplanning/leaflet/SHOW_COORDINATION_DETAIL';


const req = require('superagent');

export const mapLayerTypes = {
    baseLayer: 2,
};

export const mapBaseLayers = [
    'blank',
    'osm',
    'arcgis-street',
    'arcgis-satellite',
    'arcgis-topo',
];

export const changeLayer = (layerType, payload) => {
    switch (layerType) {
        case mapLayerTypes.baseLayer:
            return {
                type: BASE_LAYER_CHANGE,
                payload,
            };

        default:
            return { type: UNKNOWN };
    }
};


export const changeBaseLayer = baseLayer => ({
    type: BASE_LAYER_CHANGE,
    payload: baseLayer,
});

export const showCoordinationsDetail = coordination => ({
    type: SHOW_COORDINATION_DETAIL,
    payload: coordination,
});

export const getShapes = (dispatch, coordinationId, workzoneId) => {
    req
        .get(`/api/coordinations/${coordinationId}?geojson=true&workzone_id=${workzoneId}`)
        .then((res) => {
            const newCoordination = res.body;
            dispatch(showCoordinationsDetail(newCoordination));
        })
        .catch(err => (console.error(`Error while fetching coordination detail ${err}`)));
    return ({
        type: FETCH_ACTION,
    });
};

export const geoScopeMapActions = {
    changeBaseLayer,
    changeLayer,
    getShapes,
};

export const geoScopeMapInitialState = {
    baseLayer: 'osm',
    overlays: {
    },
    currentCoordination: null,
};

export const geoScopeMapReducer = (state = geoScopeMapInitialState, action = {}) => {
    switch (action.type) {
        case BASE_LAYER_CHANGE: {
            const baseLayer = action.payload;

            if (mapBaseLayers.indexOf(baseLayer) === -1) {
                return state;
            }
            return { ...state, baseLayer };
        }
        case SHOW_COORDINATION_DETAIL: {
            const currentCoordination = action.payload;
            return { ...state, currentCoordination };
        }

        default:
            return state;
    }
};
