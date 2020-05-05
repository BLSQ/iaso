import {
    getRequest, patchRequest, postRequest, deleteRequest,
} from '../../libs/Api';
import { enqueueSnackbar } from '../../../../redux/snackBarsReducer';
import { errorSnackBar, succesfullSnackBar } from '../../../../utils/constants/snackBars';

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


export const fetchUsersProfiles = params => (dispatch) => {
    let url = '/api/profiles';
    if (params) {
        url += `?order=${params.order}&limit=${params.pageSize}&page=${params.page}`;
        if (params.search) {
            url += `&search=${params.search}`;
        }
        dispatch(setIsFetching(true));
    }
    return getRequest(url)
        .then(res => dispatch(setUsersProfiles(res.profiles, params ? { count: res.count, pages: res.pages } : { count: res.profiles.length, pages: 1 })))
        .catch(() => dispatch(enqueueSnackbar(errorSnackBar('fetchProfilesError'))))
        .then(() => {
            if (params) {
                dispatch(setIsFetching(false));
            }
        });
};

export const fetchCurrentUser = () => dispatch => getRequest('/api/profiles/me')
    .then((res) => {
        dispatch(setCurrentUser(res));
        return res;
    })
    .catch(() => dispatch(enqueueSnackbar(errorSnackBar('fetchCurrentUser'))));

export const fetchPermissions = () => dispatch => getRequest('/api/permissions')
    .then(res => dispatch(setPermissions(res.permissions)))
    .catch(() => dispatch(enqueueSnackbar(errorSnackBar('fetchPermissions'))));

export const saveUserProFile = profile => (dispatch) => {
    dispatch(setIsFetching(true));
    return (patchRequest(`/api/profiles/${profile.id}/`, profile, true)
        .then((res) => {
            dispatch(enqueueSnackbar(succesfullSnackBar('saveUserSuccesfull')));
            return res;
        })
        .catch((error, res) => {
            dispatch(enqueueSnackbar(errorSnackBar('saveUserError')));
            dispatch(setIsFetching(false));
            throw error;
        }));
};

export const createUserProFile = profile => (dispatch) => {
    dispatch(setIsFetching(true));
    return (postRequest('/api/profiles/', profile)
        .then((res) => {
            dispatch(enqueueSnackbar(succesfullSnackBar('saveUserSuccesfull')));
            return res;
        })
        .catch((error) => {
            dispatch(enqueueSnackbar(errorSnackBar('saveUserError')));
            dispatch(setIsFetching(false));
            throw error;
        }));
};


export const deleteUser = (profile, params) => (dispatch) => {
    dispatch(setIsFetching(true));
    return (deleteRequest(`/api/profiles/${profile.id}/`)
        .then((res) => {
            dispatch(enqueueSnackbar(succesfullSnackBar('deleteUserSuccesfull')));
            dispatch(fetchUsersProfiles(params));
            return res;
        })
        .catch((error) => {
            dispatch(enqueueSnackbar(errorSnackBar('deleteUserError')));
            dispatch(setIsFetching(false));
            throw error;
        }));
};
