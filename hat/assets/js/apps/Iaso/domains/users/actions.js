import {
    fetchAction,
    saveAction,
    retrieveAction,
} from '../../redux/actions/formsActions';

export const SET_USERS_PROFILES = 'SET_USERS_PROFILES';
export const SET_CURRENT_USER = 'SET_CURRENT_USER';
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

const apiKey = 'profiles';
export const fetchCurrentUser = () => dispatch =>
    retrieveAction(
        dispatch,
        `${apiKey}`,
        'me',
        setCurrentUser,
        'fetchCurrentUser',
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
