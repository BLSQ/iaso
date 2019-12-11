import { loadActions } from '../../../redux/load';
import { patientsActions } from './patients';

const PATCH_ACTION = 'hat/tests/PATCH_ACTION';

const req = require('superagent');

const updateTest = (dispatch, test, patientId) => {
    dispatch(loadActions.startLoading());
    req
        .patch(`/api/tests/${test.id}/`)
        .set('Content-Type', 'application/json')
        .send(test)
        .then(() => {
            dispatch(patientsActions.fetchDetails(dispatch, patientId));
            dispatch(loadActions.successLoadingNoData());
        })
        .catch((err) => {
            dispatch(loadActions.errorLoading(err));
        });
    return ({
        type: PATCH_ACTION,
    });
};

const createTest = (dispatch, test, patientId) => {
    dispatch(loadActions.startLoading());
    req
        .post('/api/tests/')
        .set('Content-Type', 'application/json')
        .send(test)
        .then(() => {
            dispatch(patientsActions.fetchDetails(dispatch, patientId));
            dispatch(loadActions.successLoadingNoData());
        })
        .catch((err) => {
            dispatch(loadActions.errorLoading(err));
        });
    return ({
        type: PATCH_ACTION,
    });
};

export const testActions = {
    updateTest,
    createTest,
};

export const testInitialState = {};

export const testReducer = (state = {}, action = {}) => {
    switch (action.type) {
        case PATCH_ACTION: {
            return {};
        }

        default:
            return state;
    }
};
