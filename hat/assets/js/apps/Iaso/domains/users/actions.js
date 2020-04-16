import { getRequest } from '../../libs/Api';
import { enqueueSnackbar } from '../../../../redux/snackBarsReducer';
import { errorSnackBar } from '../../../../utils/constants/snackBars';

export const SET_USERS_PROFILES = 'SET_USERS_PROFILES';
export const SET_CURRENT_USER = 'SET_CURRENT_USER';


export const setUsersProfiles = payload => ({
    type: SET_USERS_PROFILES,
    payload,
});

export const setCurrentUser = payload => ({
    type: SET_CURRENT_USER,
    payload,
});


export const fetchUsersProfiles = params => (dispatch) => {
    let url = '/api/profiles';
    if (params) {
        url += `?order=${params.order}&limit=${params.pageSize}&page=${params.page}`;
    }
    return getRequest(url)
        .then(res => dispatch(setUsersProfiles(res.profiles)))
        .catch(() => dispatch(enqueueSnackbar(errorSnackBar('fetchProfilesError'))));
};

export const fetchCurrentUser = () => dispatch => getRequest('/api/profiles/me')
    .then(res => dispatch(setCurrentUser(res)))
    .catch(() => dispatch(enqueueSnackbar(errorSnackBar('fetchCurrentUser'))));
