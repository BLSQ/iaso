import { fetchAction } from '../../redux/actions/formsActions';

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
