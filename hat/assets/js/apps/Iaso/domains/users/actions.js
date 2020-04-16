import { getRequest } from '../../libs/Api';
import { enqueueSnackbar } from '../../../../redux/snackBarsReducer';
import { errorSnackBar } from '../../../../utils/constants/snackBars';

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


export const fetchUsersProfiles = params => (dispatch) => {
    let url = '/api/profiles';
    if (params) {
        url += `?order=${params.order}&limit=${params.pageSize}&page=${params.page}`;
        dispatch(setIsFetching(true));
    }
    return getRequest(url)
        .then(res => dispatch(setUsersProfiles(res.profiles, params ? { count: res.count, pages: res.pages } : null)))
        .catch(() => dispatch(enqueueSnackbar(errorSnackBar('fetchProfilesError'))))
        .then(() => {
            if (params) {
                dispatch(setIsFetching(false));
            }
        });
};

export const fetchCurrentUser = () => dispatch => getRequest('/api/profiles/me')
    .then(res => dispatch(setCurrentUser(res)))
    .catch(() => dispatch(enqueueSnackbar(errorSnackBar('fetchCurrentUser'))));
