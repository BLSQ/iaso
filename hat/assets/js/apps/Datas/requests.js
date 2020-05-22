import { loadActions } from '../../redux/load';
import { patientsActions } from './redux/patients';
import { enqueueSnackbar } from '../../redux/snackBarsReducer';
import { succesfullSnackBar, errorSnackBar } from '../../utils/constants/snackBars';

const PATCH_ACTION = 'hat/tests/PATCH_ACTION';
const POST_ACTION = 'hat/tests/POST_ACTION';

const req = require('superagent');

export const updateTest = (dispatch, test, patientId, toggleModal) => {
    dispatch(loadActions.startLoading());
    req
        .patch(`/api/tests/${test.id}/`)
        .set('Content-Type', 'application/json')
        .send(test)
        .then(() => {
            dispatch(enqueueSnackbar(succesfullSnackBar()));
            dispatch(patientsActions.fetchDetails(dispatch, patientId, false, toggleModal));
        })
        .catch((err) => {
            dispatch(enqueueSnackbar(errorSnackBar()));
            dispatch(loadActions.errorLoading(err));
        });
    return ({
        type: PATCH_ACTION,
    });
};

export const createTest = (dispatch, test, patientId, toggleModal) => {
    dispatch(loadActions.startLoading());
    req
        .post('/api/tests/')
        .set('Content-Type', 'application/json')
        .send(test)
        .then(() => {
            dispatch(enqueueSnackbar(succesfullSnackBar()));
            dispatch(patientsActions.fetchDetails(dispatch, patientId, false, toggleModal));
        })
        .catch((err) => {
            dispatch(enqueueSnackbar(errorSnackBar()));
            dispatch(loadActions.errorLoading(err));
        });
    return ({
        type: POST_ACTION,
    });
};

export const updateTreatment = (dispatch, treatment, patientId, toggleModal) => {
    dispatch(loadActions.startLoading());
    req
        .patch(`/api/treatments/${treatment.id}/`)
        .set('Content-Type', 'application/json')
        .send(treatment)
        .then(() => {
            dispatch(enqueueSnackbar(succesfullSnackBar()));
            dispatch(patientsActions.fetchDetails(dispatch, patientId, false, toggleModal));
        })
        .catch((err) => {
            dispatch(enqueueSnackbar(errorSnackBar()));
            dispatch(loadActions.errorLoading(err));
        });
    return ({
        type: PATCH_ACTION,
    });
};

export const createTreatment = (dispatch, treatment, patientId, toggleModal) => {
    dispatch(loadActions.startLoading());
    req
        .post('/api/treatments/')
        .set('Content-Type', 'application/json')
        .send(treatment)
        .then(() => {
            dispatch(enqueueSnackbar(succesfullSnackBar()));
            dispatch(patientsActions.fetchDetails(dispatch, patientId, false, toggleModal));
        })
        .catch((err) => {
            dispatch(enqueueSnackbar(errorSnackBar()));
            dispatch(loadActions.errorLoading(err));
        });
    return ({
        type: POST_ACTION,
    });
};
