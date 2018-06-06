/*
 * Includes the actions and state necessary for the locator process
 */
import { loadActions } from '../../../redux/load';
import { LOAD_PROVINCES } from '../redux/province';
import { LOAD_VILLAGES, SELECT_VILLAGE, villageActions } from '../redux/village';

export const FETCH_ACTION = 'hat/locator/locator/FETCH_ACTION';
export const LOAD_AREAS = 'hat/locator/locator/LOAD_AREAS';
export const LOAD_ZONES = 'hat/locator/locator/LOAD_ZONES';
export const RESET_FILTERS = 'hat/locator/locator/RESET_FILTERS';
export const SELECT_TYPE = 'hat/locator/locator/SELECT_TYPE';
export const EMPTY_VILLAGES = 'hat/locator/locator/EMPTY_VILLAGES';
export const EMPTY_ZONES = 'hat/locator/locator/EMPTY_ZONES';
export const EMPTY_AREAS = 'hat/locator/locator/EMPTY_AREAS';


const req = require('superagent');

export const loadAreas = payload => ({
    type: LOAD_AREAS,
    payload,
});

export const loadZones = payload => ({
    type: LOAD_ZONES,
    payload,
});

export const resetFilters = () => ({
    type: RESET_FILTERS,
});

export const emptyVillages = () => ({
    type: EMPTY_VILLAGES,
});

export const emptyAreas = () => ({
    type: EMPTY_AREAS,
});

export const emptyZones = () => ({
    type: EMPTY_ZONES,
});

export const locatorInitialState = {
    provinceId: null,
    zoneId: null,
    areaId: null,
    villageId: null,
    key: null,
    currentTypes: ['YES'],
    provinces: [],
    zones: [],
    areas: [],
    villages: [],
};

export const selectZone = (zoneId, dispatch) => {
    req
        .get(`/api/as/?zs_id=${zoneId}`)
        .then((result) => {
            dispatch(loadActions.successLoadingNoData());
            const payload = { areas: result.body, zoneId };
            dispatch(loadAreas(payload));
        })
        .catch((err) => {
            dispatch(loadActions.errorLoading(err));
            console.error(`Error while fetching Areas: ${err}`);
        });
    return ({
        type: FETCH_ACTION,
    });
};

export const selectArea = (areaId, currentTypes, dispatch) => {
    let theTypes = currentTypes;
    if (!theTypes) {
        theTypes = locatorInitialState.currentTypes;
    }
    req
        .get(`/api/villages/?as_list=true&as_id=${areaId}&types=${theTypes.toString()}`)
        .then((result) => {
            dispatch(loadActions.successLoadingNoData());
            const payload = { villages: result.body, areaId };
            dispatch(villageActions.loadVillages(payload));
        })
        .catch((err) => {
            dispatch(loadActions.errorLoading(err));
            console.error(`Error while fetching Villages: ${err}`);
        });
    return ({
        type: FETCH_ACTION,
    });
};


export const selectType = (newType, areaId, currentTypes, dispatch) => {
    if (currentTypes.indexOf(newType) > -1) {
        currentTypes.splice(currentTypes.indexOf(newType), 1);
    } else {
        currentTypes.push(newType);
    }
    dispatch(selectArea(areaId, currentTypes, dispatch));
    return ({
        type: SELECT_TYPE,
        payload: currentTypes,
    });
};

export const locatorActions = {
    loadAreas,
    loadZones,
    selectType,
    resetFilters,
    selectZone,
    selectArea,
    emptyVillages,
    emptyAreas,
    emptyZones,
};

export const locatorReducer = (state = locatorInitialState, action = {}) => {
    switch (action.type) {
        case LOAD_PROVINCES: {
            const provinces = action.payload;
            return {
                ...state,
                provinces,
            };
        }
        case FETCH_ACTION: {
            return state;
        }
        case LOAD_ZONES: {
            const { zones, provinceId } = action.payload;
            return {
                ...state,
                zones,
                provinceId,
            };
        }
        case LOAD_AREAS: {
            const { areas, zoneId } = action.payload;
            return {
                ...state,
                areas,
                zoneId,
            };
        }
        case LOAD_VILLAGES: {
            const { villages, areaId } = action.payload;
            return {
                ...state,
                villages,
                areaId,
                villageId: null,
            };
        }
        case EMPTY_ZONES: {
            return {
                ...state,
                zones: [],
            };
        }

        case EMPTY_AREAS: {
            return {
                ...state,
                areas: [],
            };
        }

        case EMPTY_VILLAGES: {
            return {
                ...state,
                villages: [],
            };
        }

        case SELECT_VILLAGE: {
            const villageId = action.payload;
            return { ...state, villageId };
        }
        case SELECT_TYPE: {
            const currentTypes = action.payload;
            return { ...state, currentTypes };
        }
        case RESET_FILTERS: {
            const { provinces } = state;
            const newState = locatorInitialState;
            if (provinces.length > 0) {
                newState.provinces = provinces;
            }
            newState.currentTypes = state.currentTypes;
            return newState;
        }

        default:
            return state;
    }
};
