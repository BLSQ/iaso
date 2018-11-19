
import { loadActions } from '../../../redux/load';

export const LOAD_CURRENT_DETAIL = 'hat/patient/detail/LOAD_CURRENT_DETAIL';
export const LOAD_TEST_MAPPING = 'hat/patient/detail/LOAD_TEST_MAPPING';
export const LOAD_DETAIL = 'hat/patient/detail/LOAD_DETAIL';
export const FETCH_ACTION = 'hat/patient/detail/FETCH_ACTION';


const req = require('superagent');

export const loadCurrentDetail = payload => ({
    type: LOAD_CURRENT_DETAIL,
    payload,
});

export const loadTestMapping = payload => ({
    type: LOAD_TEST_MAPPING,
    payload,
});

export const fetchDetails = (dispatch, patientId) => {
    dispatch(loadActions.startLoading());
    req
        .get('/api/testsmapping')
        .then((result) => {
            dispatch(loadTestMapping(result.body));
        })
        .catch(err => (console.error(`Error while fetching detail ${err}`)));
    req
        .get(`/api/patients/${patientId}`)
        .then((result) => {
            dispatch(loadActions.successLoadingNoData());
            dispatch(loadCurrentDetail(result.body));
        })
        .catch(err => (console.error(`Error while fetching detail ${err}`)));
    return ({
        type: FETCH_ACTION,
    });
};


export const patientDetailsActions = {
    loadCurrentDetail,
    fetchDetails,
};

export const patientDetailsInitialState = {
    current: {},
    testsMapping: {},
};

export const patientDetailsReducer = (state = patientDetailsInitialState, action = {}) => {
    switch (action.type) {
        case LOAD_CURRENT_DETAIL: {
            const current = action.payload;
            return { ...state, current };
        }

        case LOAD_TEST_MAPPING: {
            const testsMapping = action.payload;
            return { ...state, testsMapping };
        }

        case FETCH_ACTION: {
            return state;
        }

        default:
            return state;
    }
};
