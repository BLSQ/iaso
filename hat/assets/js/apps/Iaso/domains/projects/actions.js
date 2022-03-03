import { fetchAction } from '../../redux/actions/formsActions';

export const SET_ALL_PROJECTS = 'PROJECTS/SET_ALL_PROJECTS';
export const SET_ALL_APPS = 'SET_ALL_APPS';
export const SET_IS_FETCHING_PROJECTS = 'SET_IS_FETCHING_PROJECTS';

export const setAllProjects = projects => ({
    type: SET_ALL_PROJECTS,
    payload: projects,
});

export const setAllApps = (list, { count, pages }) => ({
    type: SET_ALL_APPS,
    payload: {
        list,
        count,
        pages,
    },
});

export const setIsFetching = fetching => ({
    type: SET_IS_FETCHING_PROJECTS,
    payload: fetching,
});

const apiKey = 'projects';

export const fetchAllProjects = () => dispatch =>
    fetchAction(dispatch, apiKey, setAllProjects, 'fetchProjectsError', apiKey);
