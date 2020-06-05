import {
    fetchAction, saveAction, createAction, deleteAction,
} from '../../../redux/actions/formsActions';

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

const apiEndPoint = 'groups';
export const fetchGroups = params => dispatch => fetchAction(
    dispatch,
    params,
    apiEndPoint,
    'groups',
    setIsFetching,
    setGroups,
    'fetchGroupsError',
);

export const saveGroup = group => dispatch => saveAction(
    dispatch,
    group,
    apiEndPoint,
    setIsFetching,
    'saveGroupSuccesfull',
    'saveGroupError',
);

export const createGroup = group => dispatch => createAction(
    dispatch,
    group,
    apiEndPoint,
    setIsFetching,
    'saveGroupSuccesfull',
    'saveGroupError',
);

export const deleteGroup = (group, params) => dispatch => deleteAction(
    dispatch,
    group,
    apiEndPoint,
    'groups',
    params,
    setIsFetching,
    setGroups,
    'deleteGroupSuccesfull',
    'deleteGroupError',
);
