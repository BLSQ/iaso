import {
    getRequest, patchRequest, postRequest, deleteRequest,
} from '../../../libs/Api';
import { enqueueSnackbar } from '../../../../../redux/snackBarsReducer';
import { errorSnackBar, succesfullSnackBar } from '../../../../../utils/constants/snackBars';

export const SET_GROUPS = 'SET_GROUPS';
export const SET_CURRENT_GROUP = 'SET_CURRENT_GROUP';
export const SET_IS_FETCHING_GROUPS = 'SET_IS_FETCHING_GROUPS';


export const setGroups = (list, { count, pages }) => ({
    type: SET_GROUPS,
    payload: {
        list,
        count,
        pages,
    },
});

export const setIsFetching = fetching => ({
    type: SET_IS_FETCHING_GROUPS,
    payload: fetching,
});


export const fetchGroups = params => (dispatch) => {
    let url = '/api/groups';
    if (params) {
        url += `?order=${params.order}&limit=${params.pageSize}&page=${params.page}`;
        if (params.search) {
            url += `&search=${params.search}`;
        }
        dispatch(setIsFetching(true));
    }
    return getRequest(url)
        .then(res => dispatch(setGroups(res.groups, params ? { count: res.count, pages: res.pages } : { count: res.groups.length, pages: 1 })))
        .catch(() => dispatch(enqueueSnackbar(errorSnackBar('fetchGroupsError'))))
        .then(() => {
            if (params) {
                dispatch(setIsFetching(false));
            }
        });
};

export const saveGroup = group => (dispatch) => {
    dispatch(setIsFetching(true));
    return (patchRequest(`/api/groups/${group.id}/`, group, true)
        .then((res) => {
            dispatch(enqueueSnackbar(succesfullSnackBar('saveGroupSuccesfull')));
            return res;
        })
        .catch((error) => {
            dispatch(enqueueSnackbar(errorSnackBar('saveGroupError')));
            dispatch(setIsFetching(false));
            throw error;
        }));
};

export const createGroup = group => (dispatch) => {
    dispatch(setIsFetching(true));
    return (postRequest('/api/groups/', group)
        .then((res) => {
            dispatch(enqueueSnackbar(succesfullSnackBar('saveGroupSuccesfull')));
            return res;
        })
        .catch((error) => {
            dispatch(enqueueSnackbar(errorSnackBar('saveGroupError')));
            dispatch(setIsFetching(false));
            throw error;
        }));
};

export const deleteGroup = (group, params) => (dispatch) => {
    dispatch(setIsFetching(true));
    return (deleteRequest(`/api/groups/${group.id}/`)
        .then((res) => {
            dispatch(enqueueSnackbar(succesfullSnackBar('deleteGroupSuccesfull')));
            dispatch(fetchGroups(params));
            return res;
        })
        .catch((error) => {
            dispatch(enqueueSnackbar(errorSnackBar('deleteGroupError')));
            dispatch(setIsFetching(false));
            throw error;
        }));
};
