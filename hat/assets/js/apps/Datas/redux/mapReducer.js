/*
 * Includes the actions and state necessary to display the map view
 */

export const UNKNOWN = 'hat/leaflet/action/UNKNWON';
export const BASE_LAYER_CHANGE = 'hat/leaflet/base-layer/CHANGE';
export const SET_CASES_LIST = 'hat/leaflet/base-layer/SET_CASES_LIST';

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

const extendCases = (cases) => {
    const tempCases = [...cases];
    tempCases.forEach((c, caseIndex) => {
        if (c.location.normalized.village) {
            tempCases[caseIndex].location.normalized.village.displayed = true;
        }
        c.tests.forEach((t, testIndex) => {
            tempCases[caseIndex].tests[testIndex].displayed = true;
            if (t.village) {
                tempCases[caseIndex].tests[testIndex].village.displayed = true;
            }
        });
    });
    return tempCases;
};

export const setCaseslist = cases => ({
    type: SET_CASES_LIST,
    payload: cases,
});

export const setMappedCaseslist = cases => ({
    type: SET_CASES_LIST,
    payload: extendCases(cases),
});

export const mapActions = {
    changeLayer,
    setCaseslist,
    setMappedCaseslist,
};

export const mapInitialState = {
    baseLayer: 'arcgis-topo',
    cases: [],
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
        case SET_CASES_LIST: {
            const cases = [...action.payload];
            return { ...state, cases };
        }

        default:
            return state;
    }
};
