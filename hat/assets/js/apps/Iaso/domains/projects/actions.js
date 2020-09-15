import { fetchAction } from '../../redux/actions/formsActions';

export const SET_ALL_PROJECTS = 'PROJECTS/SET_ALL_PROJECTS';

export const setAllProjects = projects => ({
    type: SET_ALL_PROJECTS,
    payload: projects,
});

const apiKey = 'projects';

export const fetchAllProjects = () => dispatch =>
    fetchAction(
        dispatch,
        apiKey,
        setAllProjects,
        'fetchProjectsError',
        'projects',
    );
