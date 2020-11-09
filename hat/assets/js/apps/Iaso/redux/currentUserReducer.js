/*
 * Includes the actions and state necessary to display the map view
 */

const SET_CURRENT_USER = 'hat/SET_CURRENT_USER';
const SET_USER_PERMISSIONS = 'hat/SET_USER_PERMISSIONS';
const SET_IS_CONNECTED = 'hat/SET_IS_CONNECTED';
const FETCH_ACTION = 'hat/FETCH_ACTION';

const req = require('superagent');

const setCurrentUser = user => ({
    type: SET_CURRENT_USER,
    payload: user,
});

const setUserPermissions = permissions => ({
    type: SET_USER_PERMISSIONS,
    payload: permissions,
});

const setIsConnected = isConnected => ({
    type: SET_IS_CONNECTED,
    payload: isConnected,
});

const fetchCurrentUserInfos = dispatch => {
    req.get('/api/permissions/')
        .then(result => {
            dispatch(setUserPermissions(result.body));
            dispatch(setIsConnected(true));
            req.get('/api/currentuser/')
                .then(userResult => {
                    dispatch(setCurrentUser(userResult.body));
                })
                .catch(err =>
                    console.error(
                        `Error while fetching current user informations ${err}`,
                    ),
                );
        })
        .catch(err => {
            dispatch(setIsConnected(false));
            console.error(
                `Error while fetching current user permissions ${err}`,
            );
        });
    return {
        type: FETCH_ACTION,
    };
};

export const currentUserActions = {
    fetchCurrentUserInfos,
    setCurrentUser,
};

export const currentUserInitialState = {
    user: {},
    permissions: [],
    isConnected: undefined,
};

export const currentUserReducer = (
    state = currentUserInitialState,
    action = {},
) => {
    switch (action.type) {
        case SET_CURRENT_USER: {
            const user = action.payload;
            return { ...state, user };
        }
        case SET_USER_PERMISSIONS: {
            const permissions = action.payload;
            return { ...state, permissions };
        }
        case SET_IS_CONNECTED: {
            const isConnected = action.payload;
            return { ...state, isConnected };
        }

        default:
            return state;
    }
};
