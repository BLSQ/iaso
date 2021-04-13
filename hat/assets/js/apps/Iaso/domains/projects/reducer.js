import {
    SET_ALL_PROJECTS,
    SET_ALL_APPS,
    SET_IS_FETCHING_PROJECTS,
    SET_ALL_FEATURE_FLAGS,
} from './actions';

export const projectsInitialState = {
    allProjects: undefined,
    allFeatureFlags: [],
    list: [],
    current: null,
    fetching: false,
    count: 0,
    pages: 1,
};

export const projectsReducer = (state = projectsInitialState, action = {}) => {
    switch (action.type) {
        case SET_ALL_PROJECTS: {
            return {
                ...state,
                allProjects: action.payload,
            };
        }
        case SET_ALL_FEATURE_FLAGS: {
            return {
                ...state,
                allFeatureFlags: action.payload,
            };
        }
        case SET_ALL_APPS: {
            const { list, count = 0, pages = 1 } = action.payload;
            return {
                ...state,
                list,
                count,
                pages,
            };
        }
        case SET_IS_FETCHING_PROJECTS: {
            const fetching = action.payload;
            return { ...state, fetching };
        }
        default:
            return state;
    }
};
