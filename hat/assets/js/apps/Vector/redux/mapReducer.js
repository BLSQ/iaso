/*
 * Includes the actions and state necessary to display the map view
 */

export const UNKNOWN = 'hat/microplanning/leaflet/action/UNKNWON';
export const BASE_LAYER_CHANGE = 'hat/microplanning/leaflet/base-layer/CHANGE';

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

export const mapActions = {
    changeLayer,
};

export const mapInitialState = {
    baseLayer: 'arcgis-topo',
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

        default:
            return state;
    }
};
