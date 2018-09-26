/*
 * Includes the actions and state necessary for the casesList process
 */
import { loadActions } from './load';

export const FETCH_ACTION = 'hat/casesList/FETCH_ACTION';
export const LOAD_AREAS = 'hat/casesList/LOAD_AREAS';
export const LOAD_ZONES = 'hat/casesList/LOAD_ZONES';
export const LOAD_PROVINCES = 'hat/casesList/LOAD_PROVINCES';
export const LOAD_VILLAGES = 'hat/casesList/LOAD_VILLAGES';
export const RESET_FILTERS = 'hat/casesList/RESET_FILTERS';
export const EMPTY_VILLAGES = 'hat/casesList/EMPTY_VILLAGES';
export const EMPTY_ZONES = 'hat/casesList/EMPTY_ZONES';
export const EMPTY_AREAS = 'hat/casesList/EMPTY_AREAS';
export const EMPTY_ZONE_ID = 'hat/casesList/list/EMPTY_ZONE_ID';
export const EMPTY_AREA_ID = 'hat/casesList/list/EMPTY_AREA_ID';
export const EMPTY_VILLAGE_ID = 'hat/casesList/list/EMPTY_VILLAGE_ID';
export const EMPTY_PROVINCE_ID = 'hat/casesList/list/EMPTY_PROVINCE_ID';
export const SELECT_VILLAGE = 'hat/casesList/SELECT_VILLAGE';
export const SHOW_TEAMS = 'hat/casesList/SHOW_TEAMS';
export const SHOW_COORDINATIONS = 'hat/casesList/SHOW_COORDINATIONS';

export const filtersInitialState = {
    provinceId: null,
    zoneId: null,
    areaId: null,
    villageId: null,
    provinces: [],
    zones: [],
    areas: [],
    villages: [],
    teams: [],
    coordinations: [],
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

const getVillages = (
    dispatch,
    areaId = null,
    zoneId = null,
) => {
    let url = '/api/villages/?as_list=true';
    if (zoneId) {
        url += `&zs_id=${zoneId}`;
    }
    if (areaId) {
        url += `&as_id=${areaId}`;
    }
    req
        .get(url)
        .then((result) => {
            const payload = { villages: result.body, areaId };
            dispatch(loadVillages(payload));
            dispatch(loadActions.successLoadingNoData());
        })
        .catch((err) => {
            dispatch(loadActions.errorLoading(err));
            console.error(`Error while fetching Villages: ${err}`);
        });
};


export const selectVillage = villageId => ({
    type: SELECT_VILLAGE,
    payload: villageId,
});

export const selectArea = (
    areaId,
    dispatch,
    displayVillage = true,
    zoneId = null,
    villageId = null,
) => {
    if (areaId) {
        dispatch(loadActions.successLoadingNoData());
        if (villageId) {
            dispatch(selectVillage(villageId));
        }
        if (displayVillage) {
            getVillages(dispatch, areaId, zoneId, villageId);
        }
    } else {
        dispatch(deleteArea());
        dispatch(emptyVillages());
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
) => {
    if (zoneId) {
        req
            .get(`/api/as/?zs_id=${zoneId}`)
            .then((result) => {
                const payload = { areas: result.body, zoneId };
                dispatch(loadAreas(payload));
                if (displayVillage) {
                    if (areaId) {
                        dispatch(selectArea(areaId, dispatch, true, zoneId, villageId));
                    } else {
                        getVillages(dispatch, null, zoneId);
                    }
                } else {
                    dispatch(loadActions.successLoadingNoData());
                }
            })
            .catch((err) => {
                dispatch(loadActions.errorLoading(err));
                console.error(`Error while fetching Areas: ${err}`);
            });
    } else {
        dispatch(emptyAreas());
        dispatch(deleteZone());
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
        .catch(err => (console.error(`Error while fetching plannings ${err}`)));
    return ({
        type: FETCH_ACTION,
    });
};

export const selectProvince = (provinceId, dispatch, zoneId = null, areaId = null, villageId = null) => {
    if (provinceId) {
        req
            .get(`/api/zs/?province_id=${provinceId}`)
            .then((result) => {
                const payload = { zones: result.body, provinceId };
                dispatch(loadZones(payload));
                if (zoneId) {
                    dispatch(selectZone(zoneId, dispatch, true, areaId, villageId));
                } else {
                    dispatch(loadActions.successLoadingNoData());
                }
            })
            .catch((err) => {
                dispatch(loadActions.errorLoading(err));
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

export const showTeams = teams => ({
    type: SHOW_TEAMS,
    payload: teams,
});

export const fetchTeams = (dispatch) => {
    req
        .get('/api/teams/')
        .then((result) => {
            console.log(result);
            dispatch(showTeams(result.body));
        })
        .catch(err => (console.error(`Error while fetching teams ${err}`)));
    return ({
        type: FETCH_ACTION,
    });
};

export const showCoordinations = coordinations => ({
    type: SHOW_COORDINATIONS,
    payload: coordinations,
});

export const fetchCoordinations = (dispatch) => {
    req
        .get('/api/coordinations/')
        .then((result) => {
            console.log(result);
            dispatch(showCoordinations(result.body));
        })
        .catch(err => (console.error(`Error while fetching coordinations ${err}`)));
    return ({
        type: FETCH_ACTION,
    });
};

export const filterActions = {
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
    fetchTeams,
    fetchCoordinations,
};

export const filtersReducer = (state = filtersInitialState, action = {}) => {
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
            };
            return newState;
        }

        case SHOW_TEAMS: {
            const teams = action.payload;
            return { ...state, teams };
        }
        case SHOW_COORDINATIONS: {
            const coordinations = action.payload;
            return { ...state, coordinations };
        }
        default:
            return state;
    }
};
