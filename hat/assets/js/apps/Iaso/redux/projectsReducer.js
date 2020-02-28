const SET_PROJECTS = 'SET_PROJECTS';

export const setProjects = list => ({
    type: SET_PROJECTS,
    payload: {
        list,
    },
});

export const projectsInitialState = {
    projects: [],
};

export const projectsReducer = (state = projectsInitialState, action = {}) => {
    switch (action.type) {
        case SET_PROJECTS: {
            const {
                list,
            } = action.payload;
            return {
                ...state,
                projects: list,
            };
        }
        default:
            return state;
    }
};
