/*
 * Includes the actions and state necessary for the locator process
 */
import { loadActions } from '../../../redux/load';
import { LOAD_PROVINCES } from '../redux/province';
import { LOAD_VILLAGES, SELECT_VILLAGE, villageActions } from '../redux/village';

export const FETCH_ACTION = 'hat/locator/locator/FETCH_ACTION';
export const LOAD_AREAS = 'hat/locator/locator/LOAD_AREAS';
export const LOAD_ZONES = 'hat/locator/locator/LOAD_ZONES';
export const LOAD_SEARCH_RESULTS = 'hat/locator/locator/LOAD_SEARCH_RESULTS';
export const RESET_FILTERS = 'hat/locator/locator/RESET_FILTERS';
export const SELECT_TYPE = 'hat/locator/locator/SELECT_TYPE';
export const EMPTY_VILLAGES = 'hat/locator/locator/EMPTY_VILLAGES';
export const EMPTY_ZONES = 'hat/locator/locator/EMPTY_ZONES';
export const EMPTY_AREAS = 'hat/locator/locator/EMPTY_AREAS';
export const SHOW_TEAMS = 'hat/locator/list/SHOW_TEAMS';
export const EMPTY_ZONE_ID = 'hat/locator/list/EMPTY_ZONE_ID';
export const EMPTY_AREA_ID = 'hat/locator/list/EMPTY_AREA_ID';
export const EMPTY_VILLAGE_ID = 'hat/locator/list/EMPTY_VILLAGE_ID';
export const EMPTY_PROVINCE_ID = 'hat/locator/list/EMPTY_PROVINCE_ID';
export const START_SEARCH = 'hat/locator/START_SEARCH';
export const EMPTY_SEARCH = 'hat/locator/EMPTY_SEARCH';

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
    teams: [],
    searchResults: [],
    searchLoading: false,
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

export const loadSearchResults = payload => ({
    type: LOAD_SEARCH_RESULTS,
    payload,
});

export const startSearch = () => ({
    type: START_SEARCH,
});

export const resetSearch = () => ({
    type: EMPTY_SEARCH,
});


const getVillages = (
    currentTypes,
    dispatch,
    areaId = null,
    zoneId = null,
    villageId = null,
) => {
    let theTypes = currentTypes;
    if (!theTypes) {
        theTypes = locatorInitialState.currentTypes;
    }
    let url = `/api/villages/?as_list=true&types=${theTypes.toString()}`;
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
            dispatch(villageActions.loadVillages(payload));
            if (villageId) {
                dispatch(villageActions.selectVillage(villageId));
            } else {
                dispatch(loadActions.successLoadingNoData());
            }
        })
        .catch((err) => {
            dispatch(loadActions.errorLoading(err));
            console.error(`Error while fetching Villages: ${err}`);
        });
};

export const searchVillage = (
    search,
    dispatch,
    provinceId = null,
    zoneId = null,
    areaId = null,
) => {
    dispatch(startSearch());
    let url = '/api/villages/?as_list=true&limit=500&include_unlocated=true';
    if (provinceId) {
        url += `&province_id=${provinceId}`;
    }
    if (zoneId) {
        url += `&zs_id=${zoneId}`;
    }
    if (areaId) {
        url += `&as_id=${areaId}`;
    }
    if (search) {
        url += `&search=${search}`;
    }
    req
        .get(url)
        .then((result) => {
            dispatch(loadSearchResults(result.body));
        })
        .catch((err) => {
            console.error(`Error while fetching Villages: ${err}`);
        });
    return ({
        type: FETCH_ACTION,
    });
};


export const selectArea = (
    areaId,
    currentTypes,
    dispatch,
    displayVillage = true,
    zoneId = null,
    villageId = null,
) => {
    dispatch(emptyVillages());
    if (areaId) {
        dispatch(loadActions.successLoadingNoData());
        if (displayVillage) {
            getVillages(currentTypes, dispatch, areaId, zoneId, villageId);
        }
    } else {
        dispatch(deleteArea());
        if (zoneId) {
            getVillages(currentTypes, dispatch, null, zoneId);
        }
    }
    return ({
        type: FETCH_ACTION,
    });
};


export const selectZone = (
    zoneId,
    currentTypes,
    dispatch,
    displayVillage = true,
    areaId = null,
    villageId = null,
) => {
    dispatch(emptyVillages());
    dispatch(emptyAreas());
    if (zoneId) {
        req
            .get(`/api/as/?zs_id=${zoneId}`)
            .then((result) => {
                const payload = { areas: result.body, zoneId };
                dispatch(loadAreas(payload));
                if (displayVillage) {
                    if (areaId) {
                        dispatch(selectArea(areaId, undefined, dispatch, true, zoneId, villageId));
                    } else {
                        getVillages(currentTypes, dispatch, null, zoneId);
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
        dispatch(deleteZone());
    }
    return ({
        type: FETCH_ACTION,
    });
};

export const selectType = (newType, zoneId, areaId, currentTypes, dispatch) => {
    if (currentTypes.indexOf(newType) > -1) {
        currentTypes.splice(currentTypes.indexOf(newType), 1);
    } else {
        currentTypes.push(newType);
    }
    if (areaId) {
        dispatch(selectArea(areaId, currentTypes, dispatch));
    } else if (zoneId) {
        getVillages(currentTypes, dispatch, null, zoneId);
    }
    return ({
        type: SELECT_TYPE,
        payload: currentTypes,
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
            dispatch(showTeams(result.body));
        })
        .catch(err => (console.error(`Error while fetching teams ${err}`)));
    return ({
        type: FETCH_ACTION,
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
    fetchTeams,
    deleteZone,
    deleteArea,
    deleteVillage,
    deleteProvince,
    searchVillage,
    startSearch,
    resetSearch,
    loadSearchResults,
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

        case LOAD_SEARCH_RESULTS: {
            const searchResults = action.payload;
            return {
                ...state,
                searchResults,
                searchLoading: false,
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
            const newState = {
                ...state,
                provinceId: null,
                zoneId: null,
                areaId: null,
                villageId: null,
                key: null,
                currentTypes: state.currentTypes,
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

        case START_SEARCH: {
            return {
                ...state,
                searchLoading: true,
            };
        }

        case EMPTY_SEARCH: {
            return {
                ...state,
                searchResults: [],
            };
        }

        default:
            return state;
    }
};
