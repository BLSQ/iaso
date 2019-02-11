import { mapCasesToVillages } from '../utils/mapUtils';
/*
 * Includes the actions and state necessary to display the map view
 */

export const UNKNOWN = 'hat/leaflet/action/UNKNWON';
export const BASE_LAYER_CHANGE = 'hat/leaflet/base-layer/CHANGE';
export const SET_VILLAGES_LIST = 'hat/leaflet/base-layer/SET_VILLAGES_LIST';

export const mapLayerTypes = {
    legend: 1,
    baseLayer: 2,
    overlay: 3,
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

export const setVillageslist = cases => ({
    type: SET_VILLAGES_LIST,
    payload: mapCasesToVillages(cases),
});

export const mapActions = {
    changeLayer,
    setVillageslist,
};

export const mapInitialState = {
    baseLayer: 'arcgis-topo',
    villages: [],
};

export const mapReducer = (state = mapInitialState, action = {}) => {
    switch (action.type) {
        case BASE_LAYER_CHANGE: {
            const baseLayer = action.payload;

            if (mapBaseLayers.indexOf(baseLayer) === -1) {
                return state;
            }
            return { ...state, baseLayer };
        }

        case SET_VILLAGES_LIST: {
            const villages = action.payload;
            return { ...state, villages };
        }

        default:
            return state;
    }
};
