/*
 * Includes the actions and state necessary for the villageFilters process
 */

export const LOAD_PROVINCES = 'hat/locator/villagefilters/LOAD_PROVINCES';
export const LOAD_AREAS = 'hat/locator/villagefilters/LOAD_AREAS';
export const LOAD_ZONES = 'hat/locator/villagefilters/LOAD_ZONES';
export const LOAD_VILLAGES = 'hat/locator/villagefilters/LOAD_VILLAGES';
export const SELECT_VILLAGE = 'hat/locator/villagefilters/SELECT_VILLAGE';
export const KEY_TYPED = 'hat/locator/villagefilters/KEY_TYPED';
export const KEY_DELETED = 'hat/locator/villagefilters/KEY_DELETED';
export const RESET_FILTERS = 'hat/locator/villagefilters/RESET_FILTERS';
export const SELECT_TYPE = 'hat/locator/villagefilters/SELECT_TYPE';

export const loadProvinces = payload => ({
    type: LOAD_PROVINCES,
    payload,
});

export const loadAreas = payload => ({
    type: LOAD_AREAS,
    payload,
});

export const loadZones = payload => ({
    type: LOAD_ZONES,
    payload,
});

export const loadVillages = payload => ({
    type: LOAD_VILLAGES,
    payload,
});

export const selectVillage = villageId => ({
    type: SELECT_VILLAGE,
    payload: villageId,
});

export const selectType = newType => ({
    type: SELECT_TYPE,
    payload: newType,
});

export const resetFilters = () => ({
    type: RESET_FILTERS,
});

export const villageFiltersActions = {
    loadProvinces,
    loadAreas,
    loadZones,
    loadVillages,
    selectVillage,
    selectType,
    resetFilters,
};

export const villageFiltersInitialState = {
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

export const villageFiltersReducer = (state = villageFiltersInitialState, action = {}) => {
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
            const newSate = villageFiltersInitialState;
            newSate.currentTypes = state.currentTypes;
            return newSate;
        }

        default:
            return state;
    }
};
