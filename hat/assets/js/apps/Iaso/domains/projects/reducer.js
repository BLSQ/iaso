import { SET_ALL_PROJECTS } from './actions';

export const projectsInitialState = {
    allProjects: [],
};

export const projectsReducer = (state = projectsInitialState, action = {}) => {
    switch (action.type) {
        case SET_ALL_PROJECTS: {
            return {
                ...state,
                allProjects: action.payload,
            };
        }
        default:
            return state;
    }
};
