import {
    fetchAction,
    saveAction,
    createAction,
    deleteAction,
    retrieveAction,
} from '../../redux/actions/formsActions';

export const SET_USERS_PROFILES = 'SET_USERS_PROFILES';
export const SET_CURRENT_USER = 'SET_CURRENT_USER';
export const SET_PERMISSIONS = 'SET_PERMISSIONS';
export const SET_IS_FETCHING_USERS = 'SET_IS_FETCHING_USERS';

export const setUsersProfiles = (list, { count, pages }) => ({
    type: SET_USERS_PROFILES,
    payload: {
        list,
        count,
        pages,
    },
});

export const setCurrentUser = payload => ({
    type: SET_CURRENT_USER,
    payload,
});

export const setIsFetching = fetching => ({
    type: SET_IS_FETCHING_USERS,
    payload: fetching,
});

export const setPermissions = permissions => ({
    type: SET_PERMISSIONS,
    payload: permissions,
});

const apiKey = 'profiles';
export const fetchCurrentUser = () => dispatch =>
    retrieveAction(
        dispatch,
        `${apiKey}`,
        'me',
        setCurrentUser,
        'fetchCurrentUser',
    );

export const fetchPermissions = () => dispatch =>
    fetchAction(
        dispatch,
        'permissions',
        setPermissions,
        'fetchPermissions',
        'permissions',
    );

export const fetchUsersProfiles = params => dispatch =>
    fetchAction(
        dispatch,
        apiKey,
        setUsersProfiles,
        'fetchProfilesError',
        apiKey,
        params,
        setIsFetching,
    );

export const saveUserProFile = profile => dispatch =>
    saveAction(
        dispatch,
        profile,
        apiKey,
        'saveUserSuccessful',
        'saveUserError',
        setIsFetching,
    );

export const saveCurrentUserProFile = profile => dispatch =>
    saveAction(
        dispatch,
        { ...profile, id: 'me' },
        apiKey,
        'saveUserSuccessful',
        'saveUserError',
        setIsFetching,
        undefined,
        setCurrentUser,
    );

export const createUserProFile = profile => dispatch =>
    createAction(
        dispatch,
        profile,
        apiKey,
        'saveUserSuccessful',
        'saveUserError',
        setIsFetching,
    );

export const deleteUser = (profile, params) => dispatch =>
    deleteAction(
        dispatch,
        profile,
        apiKey,
        setUsersProfiles,
        'deleteUserSuccessful',
        'deleteUserError',
        apiKey,
        params,
        setIsFetching,
    );
