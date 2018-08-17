
import { push } from 'react-router-redux';
import { loadActions } from '../../../redux/load';
import { createUrl } from '../../../utils/fetchData';

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
    dispatch(emptyAreas());
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
};

export const userActions = {
    updateUser,
    setUsers,
    userUpdated,
    deleteUser,
    createUser,
    fetchInstitutions,
    fetchProvinces,
    selectProvince,
    selectZone,
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
            return {
                ...state,
                zones,
            };
        }

        case SET_AREAS: {
            const { areas } = action.payload;
            return {
                ...state,
                areas,
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
