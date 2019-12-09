const FETCH_ACTION = 'hat/profiles/FETCH_ACTION';
const LOAD_PROFILES = 'hat/profiles/LOAD_PROFILES';

const req = require('superagent');

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

export const profileActions = {
    fetchProfiles,
};

export const profileInitialState = {
    list: [],
};

export const profileReducer = (state = profileInitialState, action = {}) => {
    switch (action.type) {
        case LOAD_PROFILES: {
            const list = action.payload;
            return { ...state, list };
        }

        default:
            return state;
    }
};