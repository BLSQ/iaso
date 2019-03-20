export const SET_DASHBOARD_INFO = 'hat/quality/SET_DASHBOARD_INFO';
const FETCH_ACTION = 'hat/quality/FETCH_ACTION';
const LOAD_TEST_MAPPING = 'hat/quality/LOAD_TEST_MAPPING';

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

export const dashboardActions = {
    fetchTestMapping,
};

export const dashboardInitialStte = {
    testsMapping: {},
};

export const dashboardReducer = (state = dashboardInitialStte, action = {}) => {
    switch (action.type) {
        case LOAD_TEST_MAPPING: {
            const testsMapping = action.payload;
            return { ...state, testsMapping };
        }

        default:
            return state;
    }
};
