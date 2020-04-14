import { getRequest } from '../../libs/Api';
import { enqueueSnackbar } from '../../../../redux/snackBarsReducer';
import { errorSnackBar } from '../../../../utils/constants/snackBars';

export const SET_USERS_PROFILES = 'SET_USERS_PROFILES';
export const SET_CURRENT_USER = 'SET_CURRENT_USER';
export const TOGGLE_FETCHING_CURRENT_USER = 'TOGGLE_FETCHING_CURRENT_USER';


const toggleFetchingCurrentUser = payload => ({
    type: TOGGLE_FETCHING_CURRENT_USER,
    payload,
});

export const setUsersProfiles = payload => ({
    type: SET_USERS_PROFILES,
    payload,
});

export const setCurrentUser = payload => ({
    type: SET_CURRENT_USER,
    payload,
});


export const fetchUsersProfiles = () => dispatch => getRequest('/api/profiles')
    .then(res => dispatch(setUsersProfiles(res.profiles)))
    .catch(() => dispatch(enqueueSnackbar(errorSnackBar('fetchProfilesError'))));

export const fetchCurrentUser = () => (dispatch) => {
    dispatch(toggleFetchingCurrentUser(true));
    return getRequest('/api/profiles/me')
        .then(res => dispatch(setCurrentUser(res)))
        .catch(() => dispatch(enqueueSnackbar(errorSnackBar('fetchCurrentUser'))))
        .then(() => {
            dispatch(toggleFetchingCurrentUser(false));
        });
};
