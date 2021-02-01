import { fetchAction, retrieveAction } from '../../redux/actions/formsActions';

export const SET_CURRENT_TASK = 'SET_CURRENT_TASK';
export const SET_ALL_TASKS = 'SET_ALL_TASKS';
export const SET_IS_FETCHING_TASKS = 'SET_IS_FETCHING_TASKS';

export const setAllTasks = (list, { count, pages }) => ({
    type: SET_ALL_TASKS,
    payload: {
        list,
        count,
        pages,
    },
});

export const setCurrentTask = payload => ({
    type: SET_CURRENT_TASK,
    payload,
});

export const setIsFetching = fetching => ({
    type: SET_IS_FETCHING_TASKS,
    payload: fetching,
});

const apiKey = 'tasks';

export const fetchAllTasks = params => dispatch =>
    fetchAction(
        dispatch,
        apiKey,
        setAllTasks,
        'fetchTasksError',
        'tasks',
        params,
        setIsFetching,
    );

export const refreshTask = id => dispatch =>
    retrieveAction(
        dispatch,
        apiKey,
        id,
        setCurrentTask,
        'retrieveTaskError',
        setIsFetching,
    );
