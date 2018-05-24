/*
 * Includes the actions and state necessary for the locator process
 */
import { loadActions } from '../../../redux/load';
import { LOAD_PROVINCES } from '../redux/province';
import { LOAD_VILLAGES, SELECT_VILLAGE, villageActions } from '../redux/village';

export const FETCH_ACTION = 'hat/locator/locator/FETCH_ACTION';
export const LOAD_AREAS = 'hat/locator/locator/LOAD_AREAS';
export const LOAD_ZONES = 'hat/locator/locator/LOAD_ZONES';
export const KEY_TYPED = 'hat/locator/locator/KEY_TYPED';
export const KEY_DELETED = 'hat/locator/locator/KEY_DELETED';
export const RESET_FILTERS = 'hat/locator/locator/RESET_FILTERS';
export const SELECT_TYPE = 'hat/locator/locator/SELECT_TYPE';

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
    req
        .get(`/api/villages/?as_list=true&as_id=${areaId}&types=${currentTypes.toString()}`)
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
};

export const locatorInitialState = {
    provinceId: null,
    zoneId: null,
    areaId: null,
    villageId: null,
    key: null,
    currentTypes: ['YES'],
    selectedVillage: null,
    provinces: [],
    zones: [],
    areas: [],
    villages: [],
};

export const locatorReducer = (state = locatorInitialState, action = {}) => {
    switch (action.type) {
        case LOAD_PROVINCES: {
            const provinces = action.payload;
            return {
                ...state,
                provinces,
                zones: [],
                areas: [],
                villages: [],
                areaId: null,
                villageId: null,
                zoneId: null,
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
                areas: [],
                villages: [],
                areaId: null,
                villageId: null,
                zoneId: null,
            };
        }
        case LOAD_AREAS: {
            const { areas, zoneId } = action.payload;
            return {
                ...state,
                areas,
                zoneId,
                villages: [],
                selectedVillage: null,
                areaId: null,
                villageId: null,
            };
        }
        case LOAD_VILLAGES: {
            const { villages, areaId } = action.payload;
            return {
                ...state, villages, areaId, selectedVillage: null, villageId: null,
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
            const newSate = locatorInitialState;
            newSate.currentTypes = state.currentTypes;
            return newSate;
        }

        default:
            return state;
    }
};
