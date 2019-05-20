import { loadActions } from '../../../redux/load';

export const FETCH_ACTION = 'hat/management/users/FETCH_ACTION';
export const FETCH_ACTION_NO_UPDATE = 'hat/management/users/FETCH_ACTION_NO_UPDATE';
export const SET_USERS = 'hat/management/users/SET_USERS';
export const USER_UPDATED = 'hat/management/users/USER_UPDATED';
export const SET_INSTITUTIONS = 'hat/management/users/SET_INSTITUTIONS';
export const SET_USER_TYPES = 'hat/management/users/SET_USER_TYPES';
export const SET_TESTER_TYPES = 'hat/management/users/SET_TESTER_TYPES';
export const SET_USER_LEVELS = 'hat/management/users/SET_USER_LEVELS';
export const SET_PERMISSIONS = 'hat/management/users/SET_PERMISSIONS';
export const SET_PROVINCES = 'hat/management/users/SET_PROVINCES';
export const SET_TEAMS = 'hat/management/users/SET_TEAMS';
export const SET_ZONES = 'hat/management/users/SET_ZONES';
export const SET_AREAS = 'hat/management/users/SET_AREAS';
export const EMPTY_AREAS = 'hat/management/users/EMPTY_AREAS';
export const EMPTY_ZONES = 'hat/management/users/EMPTY_ZONES';
export const SELECT_USER = 'hat/management/users/SELECT_USER';
export const UPDATE_CURRENT_USER = 'hat/management/users/UPDATE_CURRENT_USER';

const req = require('superagent');

export const setUsers = payload => ({
    type: SET_USERS,
    payload,
});

export const setInstitutions = payload => ({
    type: SET_INSTITUTIONS,
    payload,
});

export const setUserTypes = payload => ({
    type: SET_USER_TYPES,
    payload,
});

export const setTesterTypes = payload => ({
    type: SET_TESTER_TYPES,
    payload,
});

export const setUserLevels = payload => ({
    type: SET_USER_LEVELS,
    payload,
});

export const setPermissions = payload => ({
    type: SET_PERMISSIONS,
    payload,
});

export const setAreas = payload => ({
    type: SET_AREAS,
    payload,
});

export const setZones = payload => ({
    type: SET_ZONES,
    payload,
});

export const setProvinces = payload => ({
    type: SET_PROVINCES,
    payload,
});

export const setTeams = payload => ({
    type: SET_TEAMS,
    payload,
});


export const userUpdated = payload => ({
    type: USER_UPDATED,
    payload,
});


export const emptyZones = () => ({
    type: EMPTY_ZONES,
});

export const emptyAreas = () => ({
    type: EMPTY_AREAS,
});

export const updateCurrentUser = payload => ({
    type: UPDATE_CURRENT_USER,
    payload,
});


export const fetchProvinces = (dispatch, removeLoader = false) => {
    req
        .get('/api/provinces/')
        .then((result) => {
            dispatch(setProvinces(result.body));
            if (removeLoader) {
                dispatch(loadActions.successLoadingNoData());
            }
        })
        .catch((err) => {
            if (removeLoader) {
                dispatch(loadActions.errorLoading(err));
            }
            console.error(`Error while fetching plannings ${err}`);
        });
    return ({
        type: FETCH_ACTION_NO_UPDATE,
    });
};

export const fetchPermissions = (dispatch) => {
    req
        .get('/api/permissions/')
        .then((result) => {
            dispatch(setPermissions(result.body));
        })
        .catch((err) => {
            dispatch(loadActions.errorLoading(err));
            console.error('Error while fetching permissions', err);
        });
    return ({
        type: FETCH_ACTION_NO_UPDATE,
    });
};


export const selectUser = payload => ({
    type: SELECT_USER,
    payload,
});

export const selectZone = (
    zoneIds,
    dispatch,
) => {
    dispatch(emptyAreas());
    if (zoneIds[0]) {
        req
            .get(`/api/as/?zs_id=${zoneIds.toString()}`)
            .then((result) => {
                const payload = { areas: result.body, zoneIds };
                dispatch(setAreas(payload));
            })
            .catch((err) => {
                dispatch(loadActions.errorLoading(err));
                console.error(`Error while fetching Areas: ${err}`);
                setTimeout(() => {
                    dispatch(loadActions.errorLoading(null));
                }, 10000);
            });
    }
    return ({
        type: FETCH_ACTION_NO_UPDATE,
    });
};

export const selectProvince = (provinceIds, dispatch, zoneIds = null) => {
    dispatch(emptyZones());
    if (provinceIds[0]) {
        req
            .get(`/api/zs/?province_id=${provinceIds.toString()}`)
            .then((result) => {
                const payload = { zones: result.body, provinceIds };
                dispatch(setZones(payload));
                if (zoneIds) {
                    dispatch(selectZone(zoneIds, dispatch));
                }
            })
            .catch((err) => {
                dispatch(loadActions.errorLoading(err));
                console.error(`Error while fetching zones: ${err}`);
            });
    }
    return ({
        type: FETCH_ACTION_NO_UPDATE,
    });
};

export const fetchInstitutions = (dispatch) => {
    req
        .get('/api/institutions/')
        .then((result) => {
            dispatch(setInstitutions(result.body));
        })
        .catch((err) => {
            dispatch(loadActions.errorLoading(err));
            console.error('Error when fetching institutions', err);
        });
    return ({
        type: FETCH_ACTION_NO_UPDATE,
    });
};

export const fetchUserTypes = (dispatch) => {
    req
        .get('/api/usertypes/')
        .then((result) => {
            dispatch(setUserTypes(result.body));
        })
        .catch((err) => {
            dispatch(loadActions.errorLoading(err));
            console.error('Error when fetching user types', err);
        });
    return ({
        type: FETCH_ACTION_NO_UPDATE,
    });
};

export const fetchTesterTypes = (dispatch) => {
    req
        .get('/api/testertypes/')
        .then((result) => {
            dispatch(setTesterTypes(result.body));
        })
        .catch((err) => {
            dispatch(loadActions.errorLoading(err));
            console.error('Error when fetching tester types', err);
        });
    return ({
        type: FETCH_ACTION_NO_UPDATE,
    });
};

export const fetchUserLevels = (dispatch) => {
    req
        .get('/api/userlevels/')
        .then((result) => {
            dispatch(setUserLevels(result.body));
        })
        .catch((err) => {
            dispatch(loadActions.errorLoading(err));
            console.error('Error when fetching user levels', err);
        });
    return ({
        type: FETCH_ACTION_NO_UPDATE,
    });
};

export const fetchTeams = (dispatch) => {
    req
        .get('/api/teams?team_type=all')
        .then((result) => {
            dispatch(setTeams(result.body));
        })
        .catch((err) => {
            dispatch(loadActions.errorLoading(err));
            console.error('Error when fetching institutions', err);
        });
    return ({
        type: FETCH_ACTION_NO_UPDATE,
    });
};


export const updateUser = (dispatch, user) => {
    dispatch(loadActions.startLoading());
    req
        .patch(`/api/profiles/${user.id}/`)
        .set('Content-Type', 'application/json')
        .send(user)
        .then(() => {
            dispatch(userUpdated(true));
            dispatch(fetchProvinces(dispatch, true));
        })
        .catch((err) => {
            dispatch(loadActions.errorLoading(err));
            console.error('Error when saving user', err);
        });
    return ({
        type: FETCH_ACTION,
    });
};

export const createUser = (dispatch, user) => {
    dispatch(loadActions.startLoading());
    req
        .post('/api/profiles/')
        .set('Content-Type', 'application/json')
        .send(user)
        .then((res) => {
            dispatch(userUpdated(true));
            dispatch(selectUser(res.body));
            dispatch(loadActions.successLoadingNoData());
        })
        .catch((error) => {
            dispatch(loadActions.errorLoading(error.response.body));
            console.error('Error when creating user', error.response.body.message || error);
        });
    return ({
        type: FETCH_ACTION,
    });
};


export const deleteUser = (dispatch, user) => {
    dispatch(loadActions.startLoading());
    req
        .delete(`/api/profiles/${user.id}/`)
        .set('Content-Type', 'application/json')
        .then(() => {
            dispatch(userUpdated(true));
            dispatch(loadActions.successLoadingNoData());
        })
        .catch((err) => {
            dispatch(loadActions.errorLoading(err));
            console.error('Error when deleting user', err);
        });
    return ({
        type: FETCH_ACTION,
    });
};


export const usersInitialState = {
    isUpdated: false,
    list: [],
    institutions: [],
    userTypes: [],
    testerTypes: [],
    userLevels: [],
    permissions: [],
    provinces: [],
    zones: [],
    areas: [],
    teams: [],
    current: null,
};

export const userActions = {
    updateUser,
    setUsers,
    userUpdated,
    deleteUser,
    createUser,
    selectUser,
    fetchInstitutions,
    fetchPermissions,
    fetchProvinces,
    selectProvince,
    selectZone,
    updateCurrentUser,
    fetchUserTypes,
    fetchTeams,
    fetchTesterTypes,
    fetchUserLevels,
};


export const userReducer = (state = usersInitialState, action = {}) => {
    switch (action.type) {
        case SET_USERS: {
            const list = action.payload;
            return {
                ...state,
                list,
            };
        }

        case SELECT_USER: {
            const current = action.payload;
            return {
                ...state,
                current,
            };
        }

        case USER_UPDATED: {
            const isUpdated = action.payload;
            return {
                ...state,
                isUpdated,
            };
        }

        case FETCH_ACTION: {
            return {
                ...state,
            };
        }

        case FETCH_ACTION_NO_UPDATE: {
            return {
                ...state,
            };
        }

        case SET_INSTITUTIONS: {
            const institutions = action.payload;
            return {
                ...state,
                institutions,
            };
        }

        case SET_USER_TYPES: {
            const userTypes = action.payload;
            return {
                ...state,
                userTypes,
            };
        }

        case SET_USER_LEVELS: {
            const userLevels = action.payload;
            return {
                ...state,
                userLevels,
            };
        }

        case SET_TESTER_TYPES: {
            const testerTypes = action.payload;
            return {
                ...state,
                testerTypes,
            };
        }

        case SET_PERMISSIONS: {
            const permissions = action.payload;
            return {
                ...state,
                permissions,
            };
        }

        case SET_PROVINCES: {
            const provinces = action.payload;
            return {
                ...state,
                provinces,
            };
        }

        case SET_TEAMS: {
            const teams = action.payload;
            return {
                ...state,
                teams,
            };
        }

        case SET_ZONES: {
            const { zones } = action.payload;
            const ZS = [];
            state.current.ZS.map((userZone) => {
                zones.map((zone) => {
                    if (zone.id === parseInt(userZone, 10)) {
                        ZS.push(userZone);
                    }
                    return null;
                });
                return null;
            });
            return {
                ...state,
                zones,
                current: {
                    ...state.current,
                    ZS,
                },
            };
        }

        case SET_AREAS: {
            const { areas } = action.payload;
            const AS = [];
            state.current.AS.map((userArea) => {
                areas.map((area) => {
                    if (area.id === parseInt(userArea, 10)) {
                        AS.push(userArea);
                    }
                    return null;
                });
                return null;
            });
            return {
                ...state,
                areas,
                current: {
                    ...state.current,
                    AS,
                },
            };
        }

        case UPDATE_CURRENT_USER: {
            const current = action.payload;
            return {
                ...state,
                current,
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


        default:
            return state;
    }
};
