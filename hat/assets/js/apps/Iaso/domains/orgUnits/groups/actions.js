import {
    fetchAction,
    saveAction,
    createAction,
    deleteAction,
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

const apiKey = 'groups';
export const fetchGroups = params => dispatch =>
    fetchAction(
        dispatch,
        apiKey,
        setGroups,
        'fetchGroupsError',
        'groups',
        params,
        setIsFetching,
    );

export const saveGroup = group => dispatch =>
    saveAction(
        dispatch,
        group,
        apiKey,
        'saveGroupSuccesfull',
        'saveGroupError',
        setIsFetching,
    );

export const createGroup = group => dispatch =>
    createAction(
        dispatch,
        group,
        apiKey,
        'saveGroupSuccesfull',
        'saveGroupError',
        setIsFetching,
    );

export const deleteGroup = (group, params) => dispatch =>
    deleteAction(
        dispatch,
        group,
        apiKey,
        setGroups,
        'deleteGroupSuccesfull',
        'deleteGroupError',
        'groups',
        params,
        setIsFetching,
    );
