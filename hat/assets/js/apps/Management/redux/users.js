
import { push } from 'react-router-redux';
import { loadActions } from '../../../redux/load';
import { createUrl } from '../../../utils/fetchData';

export const FETCH_ACTION = 'hat/management/users/FETCH_ACTION';
export const SET_USERS = 'hat/management/users/SET_USERS';
export const USER_UPDATED = 'hat/management/users/USER_UPDATED';
export const SET_INSTITUTIONS = 'hat/management/users/SET_INSTITUTIONS';

const req = require('superagent');

export const setUsers = payload => ({
    type: SET_USERS,
    payload,
});

export const setInstitutions = payload => ({
    type: SET_INSTITUTIONS,
    payload,
});

export const userUpdated = () => ({
    type: USER_UPDATED,
});


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
        type: FETCH_ACTION,
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
};

export const userActions = {
    updateUser,
    setUsers,
    userUpdated,
    deleteUser,
    createUser,
    fetchInstitutions,
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

        case SET_INSTITUTIONS: {
            const institutions = action.payload;
            return {
                ...state,
                institutions,
            };
        }

        default:
            return state;
    }
};
