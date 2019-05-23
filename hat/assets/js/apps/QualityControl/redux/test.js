import { loadActions } from '../../../redux/load';

const SET_CURRENT_TEST = 'hat/locator/cases/SET_CURRENT_TEST';
const LOAD_TEST_MAPPING = 'hat/patient/detail/LOAD_TEST_MAPPING';
const FETCH_ACTION = 'hat/quality/FETCH_ACTION';

const req = require('superagent');

export const testInitialState = {
    currentTest: {},
    testsMapping: null,
};

export const setTest = test => ({
    type: SET_CURRENT_TEST,
    payload: test,
});

const loadTestMapping = payload => ({
    type: LOAD_TEST_MAPPING,
    payload,
});

export const fetchTestDetail = (dispatch, id) => {
    dispatch(loadActions.startLoading());
    dispatch(setTest(testInitialState.currentTest));
    req
        .get(`/api/qctests/${id}`)
        .then((result) => {
            dispatch(loadActions.successLoadingNoData());
            dispatch(setTest(result.body));
        })
        .catch((err) => {
            dispatch(loadActions.errorLoading(err));
            console.error(`Error while fetching test detail ${err}`);
        });
    return ({
        type: FETCH_ACTION,
    });
};

const fetchTestMapping = (dispatch) => {
    req
        .get('/api/testsmapping')
        .then((result) => {
            const testMapping = result.body;
            const cattTypeConstant = [];
            const rdtTypeConstant = [];
            const rdtValues = [-2, -1, 0, 1, 2];

            Object.keys(testMapping).forEach((key) => {
                const mappedItem = {
                    value: parseInt(key, 10),
                    label: testMapping[key],
                };
                cattTypeConstant.push(mappedItem);
                if (rdtValues.indexOf(parseInt(key, 10)) !== -1) {
                    rdtTypeConstant.push(mappedItem);
                }
            });


            dispatch(loadTestMapping({
                cattTypeConstant,
                rdtTypeConstant,
            }));
        })
        .catch(err => (console.error(`Error while fetching test mapping ${err}`)));
    return ({
        type: FETCH_ACTION,
    });
};

export const testActions = {
    fetchTestDetail,
    fetchTestMapping,
};


export const testReducer = (state = testInitialState, action = {}) => {
    switch (action.type) {
        case SET_CURRENT_TEST: {
            const currentTest = action.payload;
            return { ...state, currentTest };
        }

        case LOAD_TEST_MAPPING: {
            const testsMapping = action.payload;
            return { ...state, testsMapping };
        }

        default:
            return state;
    }
};
