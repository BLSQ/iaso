const FETCH_ACTION = 'hat/quality/FETCH_ACTION';
const LOAD_TEST_MAPPING = 'hat/quality/LOAD_TEST_MAPPING';
const SET_IMAGES_LIST = 'hat/quality/SET_IMAGES_LIST';
const SET_VIDEOS_LIST = 'hat/quality/SET_VIDEOS_LIST';
const RESET_IMAGES_LIST = 'hat/quality/RESET_IMAGES_LIST';
const RESET_VIDEOS_LIST = 'hat/quality/RESET_VIDEOS_LIST';
const LOAD_PROFILES = 'hat/quality/LOAD_PROFILES';

const req = require('superagent');

const loadTestMapping = payload => ({
    type: LOAD_TEST_MAPPING,
    payload,
});

export const fetchTestMapping = (dispatch) => {
    req
        .get('/api/testsmapping')
        .then((result) => {
            dispatch(loadTestMapping(result.body));
        })
        .catch(err => (console.error(`Error while fetching test mapping ${err}`)));
    return ({
        type: FETCH_ACTION,
    });
};

const setImagesList = (list, showPagination, params, count, pages) => ({
    type: SET_IMAGES_LIST,
    payload: {
        list,
        showPagination,
        params,
        count,
        pages,
    },
});

const setVideosList = (list, showPagination, params, count, pages) => ({
    type: SET_VIDEOS_LIST,
    payload: {
        list,
        showPagination,
        params,
        count,
        pages,
    },
});


const resetImagesList = () => ({
    type: RESET_IMAGES_LIST,
});

const resetVideosList = () => ({
    type: RESET_VIDEOS_LIST,
});

const loadProfiles = payload => ({
    type: LOAD_PROFILES,
    payload,
});

const fetchProfiles = (dispatch) => {
    req
        .get('/api/profiles?as_list=True')
        .then((result) => {
            dispatch(loadProfiles(result.body));
        })
        .catch(err => (console.error(`Error while fetching profiles ${err}`)));
    return ({
        type: FETCH_ACTION,
    });
};

export const dashboardActions = {
    fetchTestMapping,
    setImagesList,
    setVideosList,
    fetchProfiles,
    loadProfiles,
    resetImagesList,
    resetVideosList,
};

export const dashboardInitialStte = {
    testsMapping: {},
    reduxImagePage: {
        list: null,
        showPagination: false,
        params: {},
        count: 0,
        pages: 0,
    },
    reduxVideoPage: {
        list: null,
        showPagination: false,
        params: {},
        count: 0,
        pages: 0,
    },
    profiles: [],
};

export const dashboardReducer = (state = dashboardInitialStte, action = {}) => {
    switch (action.type) {
        case LOAD_TEST_MAPPING: {
            const testsMapping = action.payload;
            return { ...state, testsMapping };
        }

        case SET_IMAGES_LIST: {
            const {
                list, showPagination, params, count, pages,
            } = action.payload;
            return {
                ...state,
                reduxImagePage: {
                    list,
                    showPagination,
                    params,
                    count,
                    pages,
                },
            };
        }

        case SET_VIDEOS_LIST: {
            const {
                list, showPagination, params, count, pages,
            } = action.payload;
            return {
                ...state,
                reduxVideoPage: {
                    list,
                    showPagination,
                    params,
                    count,
                    pages,
                },
            };
        }


        case RESET_IMAGES_LIST: {
            return {
                ...state,
                reduxImagePage: dashboardInitialStte.reduxImagePage,
            };
        }

        case RESET_VIDEOS_LIST: {
            return {
                ...state,
                reduxVideoPage: dashboardInitialStte.reduxVideoPage,
            };
        }

        case LOAD_PROFILES: {
            const profiles = action.payload;
            return { ...state, profiles };
        }

        default:
            return state;
    }
};
