/*
 * Includes the actions and state necessary for the casesList process
 */
import { loadActions } from './load';

export const FETCH_ACTION = 'hat/geo/FETCH_ACTION';
export const LOAD_AREAS = 'hat/geo/LOAD_AREAS';
export const LOAD_ZONES = 'hat/geo/LOAD_ZONES';
export const LOAD_PROVINCES = 'hat/geo/LOAD_PROVINCES';
export const LOAD_VILLAGES = 'hat/geo/LOAD_VILLAGES';
export const RESET_FILTERS = 'hat/geo/RESET_FILTERS';
export const EMPTY_VILLAGES = 'hat/geo/EMPTY_VILLAGES';
export const EMPTY_ZONES = 'hat/geo/EMPTY_ZONES';
export const EMPTY_AREAS = 'hat/geo/EMPTY_AREAS';
export const EMPTY_ZONE_ID = 'hat/geo/list/EMPTY_ZONE_ID';
export const EMPTY_AREA_ID = 'hat/geo/list/EMPTY_AREA_ID';
export const EMPTY_VILLAGE_ID = 'hat/geo/list/EMPTY_VILLAGE_ID';
export const EMPTY_PROVINCE_ID = 'hat/geo/list/EMPTY_PROVINCE_ID';
export const SELECT_VILLAGE = 'hat/geo/SELECT_VILLAGE';

export const geoInitialState = {
    provinceId: null,
    zoneId: null,
    areaId: null,
    villageId: null,
    provinces: [],
    zones: [],
    areas: [],
    villages: [],
};

const req = require('superagent');

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

export const deleteZone = () => ({
    type: EMPTY_ZONE_ID,
});

export const deleteArea = () => ({
    type: EMPTY_AREA_ID,
});

export const deleteVillage = () => ({
    type: EMPTY_VILLAGE_ID,
});

export const deleteProvince = () => ({
    type: EMPTY_PROVINCE_ID,
});

export const selectVillage = villageId => ({
    type: SELECT_VILLAGE,
    payload: villageId,
});


const getVillages = (
    dispatch,
    areaId = null,
    zoneId = null,
    villageId = null,
    types = null,
) => {
    let url = '/api/villages/?as_list=true';
    if (zoneId) {
        url += `&zs_id=${zoneId}`;
    }
    if (areaId) {
        url += `&as_id=${areaId}`;
    }
    if (types) {
        url += `&types=${types}&include_unlocated=true`;
    }
    req
        .get(url)
        .then((result) => {
            const payload = { villages: result.body, areaId };
            dispatch(loadVillages(payload));
            if (villageId) {
                dispatch(selectVillage(villageId));
            }
            dispatch(loadActions.successLoadingNoData());
        })
        .catch((err) => {
            dispatch(loadActions.errorLoading(err));
            console.error(`Error while fetching Villages: ${err}`);
        });
};


export const selectArea = (
    areaId,
    dispatch,
    displayVillage = true,
    zoneId = null,
    villageId = null,
    removeLoading = true,
    villagesTypes = null,
) => {
    if (areaId) {
        if (displayVillage) {
            getVillages(dispatch, areaId, zoneId, villageId, villagesTypes);
        } else if (removeLoading) {
            dispatch(loadActions.successLoadingNoData());
        }
    } else {
        dispatch(deleteArea());
        dispatch(selectZone(zoneId, dispatch, displayVillage, null, null)); // eslint-disable-line
    }
    return ({
        type: FETCH_ACTION,
    });
};


export const selectZone = (
    zoneId,
    dispatch,
    displayVillage = true,
    areaId = null,
    villageId = null,
    removeLoading = true,
    villageTypes = null,
) => {
    if (zoneId) {
        req
            .get(`/api/as/?zs_id=${zoneId}`)
            .then((result) => {
                const payload = { areas: result.body, zoneId };
                dispatch(loadAreas(payload));
                if (areaId) {
                    dispatch(selectArea(areaId, dispatch, displayVillage, zoneId, villageId, removeLoading, villageTypes));
                } else if (displayVillage) {
                    getVillages(dispatch, null, zoneId);
                } else if (removeLoading) {
                    dispatch(loadActions.successLoadingNoData());
                }
            })
            .catch((err) => {
                if (removeLoading) {
                    dispatch(loadActions.errorLoading(err));
                }
                console.error(`Error while fetching Areas: ${err}`);
            });
    } else {
        dispatch(emptyAreas());
        dispatch(deleteZone());
        dispatch(emptyVillages());
    }
    return ({
        type: FETCH_ACTION,
    });
};

export const loadProvinces = payload => ({
    type: LOAD_PROVINCES,
    payload,
});

export const fetchProvinces = (dispatch) => {
    req
        .get('/api/provinces/')
        .then((result) => {
            dispatch(loadProvinces(result.body));
        })
        .catch(err => (console.error(`Error while fetching provinces ${err}`)));
    return ({
        type: FETCH_ACTION,
    });
};

export const selectProvince = (
    provinceId,
    dispatch,
    zoneId = null,
    areaId = null,
    villageId = null,
    displayVillage = true,
    removeLoading = true,
    villageTypes = null,
) => {
    if (provinceId) {
        req
            .get(`/api/zs/?province_id=${provinceId}`)
            .then((result) => {
                const payload = { zones: result.body, provinceId };
                dispatch(loadZones(payload));
                if (zoneId) {
                    dispatch(selectZone(zoneId, dispatch, displayVillage, areaId, villageId, removeLoading, villageTypes));
                } else if (removeLoading) {
                    dispatch(loadActions.successLoadingNoData());
                }
            })
            .catch((err) => {
                if (removeLoading) {
                    dispatch(loadActions.errorLoading(err));
                }
                console.error(`Error while fetching zones: ${err}`);
            });
    } else {
        dispatch(resetFilters());
        dispatch(emptyVillages());
    }
    return ({
        type: FETCH_ACTION,
    });
};

export const geoActions = {
    loadAreas,
    loadZones,
    resetFilters,
    selectProvince,
    selectZone,
    selectArea,
    emptyVillages,
    emptyAreas,
    emptyZones,
    deleteZone,
    deleteArea,
    deleteVillage,
    deleteProvince,
    fetchProvinces,
    selectVillage,
    loadProvinces,
};

export const geoReducer = (state = geoInitialState, action = {}) => {
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
            };
        }
        case EMPTY_ZONES: {
            return {
                ...state,
                zones: [],
                zoneId: null,
            };
        }

        case EMPTY_AREAS: {
            return {
                ...state,
                areas: [],
                areaId: null,
            };
        }

        case EMPTY_VILLAGES: {
            return {
                ...state,
                villages: [],
                villageId: null,
            };
        }

        case EMPTY_ZONE_ID: {
            return {
                ...state,
                zoneId: null,
                areaId: null,
            };
        }

        case EMPTY_AREA_ID: {
            return {
                ...state,
                areaId: null,
                villageId: null,
            };
        }

        case EMPTY_VILLAGE_ID: {
            return {
                ...state,
                villageId: null,
            };
        }

        case EMPTY_PROVINCE_ID: {
            return {
                ...state,
                provinceId: null,
                areaId: null,
                zoneId: null,
            };
        }

        case SELECT_VILLAGE: {
            const villageId = action.payload;
            return { ...state, villageId };
        }

        case RESET_FILTERS: {
            const newState = {
                ...state,
                provinceId: null,
                zoneId: null,
                areaId: null,
                villageId: null,
                provinces: state.provinces.length > 0 ? state.provinces : [],
                zones: [],
                areas: [],
                villages: [],
                profiles: [],
            };
            return newState;
        }
        default:
            return state;
    }
};
