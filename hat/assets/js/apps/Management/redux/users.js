import { loadActions } from '../../../redux/load';

export const FETCH_ACTION = 'hat/management/users/FETCH_ACTION';
export const FETCH_ACTION_NO_UPDATE = 'hat/management/users/FETCH_ACTION_NO_UPDATE';
export const SET_USERS = 'hat/management/users/SET_USERS';
export const USER_UPDATED = 'hat/management/users/USER_UPDATED';
export const SET_INSTITUTIONS = 'hat/management/users/SET_INSTITUTIONS';
export const SET_PROVINCES = 'hat/management/users/SET_PROVINCES';
export const SET_ZONES = 'hat/management/users/SET_ZONES';
export const SET_AREAS = 'hat/management/users/SET_AREAS';
export const EMPTY_AREAS = 'hat/management/users/EMPTY_AREAS';
export const EMPTY_ZONES = 'hat/management/users/EMPTY_ZONES';
export const SELECT_USER = 'hat/management/users/SELECT_USER';
export const UPDATE_CURRENT_USER = 'hat/management/users/UPDATE_CURRENT_USER';
export const EMPTY_USER_ZONES = 'hat/management/users/EMPTY_USER_ZONES';
export const EMPTY_USER_AERAS = 'hat/management/users/EMPTY_USER_AERAS';

const req = require('superagent');

export const setUsers = payload => ({
    type: SET_USERS,
    payload,
});

export const setInstitutions = payload => ({
    type: SET_INSTITUTIONS,
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

export const userUpdated = () => ({
    type: USER_UPDATED,
});

export const emptyZones = () => ({
    type: EMPTY_ZONES,
});

export const emptyAreas = () => ({
    type: EMPTY_AREAS,
});

export const emptyUserZones = () => ({
    type: EMPTY_USER_ZONES,
});

export const emptyUserAeras = () => ({
    type: EMPTY_USER_AERAS,
});

export const selectUser = payload => ({
    type: SELECT_USER,
    payload,
});

export const updateCurrentUser = payload => ({
    type: UPDATE_CURRENT_USER,
    payload,
});

export const fetchProvinces = (dispatch) => {
    req
        .get('/api/provinces/')
        .then((result) => {
            dispatch(setProvinces(result.body));
        })
        .catch(err => (console.error(`Error while fetching plannings ${err}`)));
    return ({
        type: FETCH_ACTION_NO_UPDATE,
    });
};


export const selectProvince = (provinceIds, dispatch) => {
    dispatch(emptyZones());
    if (provinceIds[0]) {
        req
            .get(`/api/zs/?province_id=${provinceIds.toString()}`)
            .then((result) => {
                const payload = { zones: result.body, provinceIds };
                dispatch(setZones(payload));
            })
            .catch((err) => {
                dispatch(loadActions.errorLoading(err));
                console.error(`Error while fetching zones: ${err}`);
            });
    } else {
        // dispatch(emptyUserZones());
    }
    return ({
        type: FETCH_ACTION_NO_UPDATE,
    });
};


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
            });
    } else {
        dispatch(emptyUserAeras());
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

export const updateUser = (dispatch, user) => {
    dispatch(loadActions.startLoading());
    req
        .put(`/api/profiles/${user.id}/`)
        .set('Content-Type', 'application/json')
        .send(user)
        .then(() => {
            dispatch(loadActions.successLoadingNoData());
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
        .then(() => {
            dispatch(loadActions.successLoadingNoData());
        })
        .catch((err) => {
            dispatch(loadActions.errorLoading(err));
            console.error('Error when creating user', err);
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
    provinces: [],
    zones: [],
    areas: [],
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
    fetchProvinces,
    selectProvince,
    selectZone,
    updateCurrentUser,
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
            return {
                ...state,
                isUpdated: false,
            };
        }

        case FETCH_ACTION: {
            return {
                ...state,
                isUpdated: true,
            };
        }

        case FETCH_ACTION_NO_UPDATE: {
            return {
                ...state,
                isUpdated: false,
            };
        }

        case SET_INSTITUTIONS: {
            const institutions = action.payload;
            return {
                ...state,
                institutions,
            };
        }

        case SET_PROVINCES: {
            const provinces = action.payload;
            return {
                ...state,
                provinces,
            };
        }

        case SET_ZONES: {
            const { zones } = action.payload;
            const ZS = [];
            const AS = [];
            state.current.ZS.map((userZone) => {
                zones.map((zone) => {
                    if (zone.id === parseInt(userZone, 10)) {
                        ZS.push(userZone);
                    }
                    return null;
                });
                return null;
            });
            state.current.AS.map((userArea) => {
                state.areas.map((area) => {
                    if (area.id === parseInt(userArea, 10)) {
                        AS.push(userArea);
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
                    AS,
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

        case EMPTY_USER_ZONES: {
            return {
                ...state,
                current: {
                    ...state.current,
                    ZS: [],
                },
            };
        }

        case EMPTY_USER_AERAS: {
            return {
                ...state,
                current: {
                    ...state.current,
                    AS: [],
                },
            };
        }


        default:
            return state;
    }
};
