const SET_CURRENT_TEST = 'hat/locator/cases/SET_CURRENT_TEST';
const FETCH_ACTION = 'hat/quality/FETCH_ACTION';

const req = require('superagent');

export const setTest = test => ({
    type: SET_CURRENT_TEST,
    payload: test,
});

export const fetchTestDetail = (dispatch, id) => {
    req
        .get(`/api/qctests/${id}`)
        .then((result) => {
            dispatch(setTest(result.body));
        })
        .catch(err => (console.error(`Error while fetching test ${err}`)));
    return ({
        type: FETCH_ACTION,
    });
};

export const testActions = {
    fetchTestDetail,
};

export const testInitialState = {
    currentTest: {},
};

export const testReducer = (state = testInitialState, action = {}) => {
    switch (action.type) {
        case SET_CURRENT_TEST: {
            const currentTest = action.payload;
            return { ...state, currentTest };
        }

        default:
            return state;
    }
};
