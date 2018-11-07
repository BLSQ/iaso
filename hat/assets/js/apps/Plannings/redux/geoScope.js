/*
 * Includes the actions and state necessary to display the map view
 */

export const UNKNOWN = 'hat/microplanning/leaflet/geoscope/action/UNKNWON';
export const LEGEND_TOGGLE = 'hat/microplanning/leaflet/geoscope/legend/TOGGLE';
export const BASE_LAYER_CHANGE = 'hat/microplanning/leaflet/geoscope/base-layer/CHANGE';
export const OVERLAY_TOGGLE = 'hat/microplanning/leaftlet/geoscope/overlay/TOGGLE';
export const LEAFLET_MAP = 'hat/microplanning/leaflet/geoscope/MAP';

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
        case mapLayerTypes.legend:
            return {
                type: LEGEND_TOGGLE,
                payload,
            };

        case mapLayerTypes.baseLayer:
            return {
                type: BASE_LAYER_CHANGE,
                payload,
            };

        case mapLayerTypes.overlay:
            return {
                type: OVERLAY_TOGGLE,
                payload,
            };

        default:
            return { type: UNKNOWN };
    }
};

export const toggleLegend = legend => ({
    type: LEGEND_TOGGLE,
    payload: legend,
});

export const changeBaseLayer = baseLayer => ({
    type: BASE_LAYER_CHANGE,
    payload: baseLayer,
});

export const toggleOverlay = overlay => ({
    type: OVERLAY_TOGGLE,
    payload: overlay,
});
export const setLeafletMap = map => ({
    type: LEAFLET_MAP,
    payload: map,
});

export const geoScopeMapActions = {
    changeBaseLayer,
    changeLayer,
    setLeafletMap,
    toggleLegend,
    toggleOverlay,
};

export const geoScopeMapInitialState = {
    legend: {
        YES: true,
    },
    baseLayer: 'osm',
    overlays: {
    },
};

export const geoScopeMapReducer = (state = geoScopeMapInitialState, action = {}) => {
    switch (action.type) {
        case LEGEND_TOGGLE: {
            const { legend } = state;
            const option = action.payload;
            if (legend[option] === undefined) {
                return state;
            }

            return { ...state, legend: { ...legend, [option]: !legend[option] } };
        }

        case BASE_LAYER_CHANGE: {
            const baseLayer = action.payload;

            if (mapBaseLayers.indexOf(baseLayer) === -1) {
                return state;
            }
            return { ...state, baseLayer };
        }

        case OVERLAY_TOGGLE: {
            const { overlays } = state;
            const option = action.payload;

            if (overlays[option] === undefined) {
                return state;
            }

            return { ...state, overlays: { ...overlays, [option]: !overlays[option] } };
        }

        case LEAFLET_MAP:
            return { ...state, leafletMap: action.payload };

        default:
            return state;
    }
};
