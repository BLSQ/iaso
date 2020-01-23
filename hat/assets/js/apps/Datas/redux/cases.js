import { loadActions } from '../../../redux/load';
import { patientsActions } from './patients';
import { enqueueSnackbar } from '../../../redux/snackBarsReducer';
import { succesfullSnackBar, errorSnackBar } from '../../../utils/constants/snackBars';

const PATCH_ACTION = 'hat/cases/PATCH_ACTION';
const PUT_ACTION = 'hat/cases/PUT_ACTION';

export const SET_CASES_LIST = 'hat/cases/SET_CASES_LIST';
export const DELETE_CASE = 'hat/cases/DELETE_CASE';
export const SET_CASE_DELETED = 'hat/cases/SET_CASE_DELETED';
export const SET_CASE_DELETED_ERROR = 'hat/cases/SET_CASE_DELETED_ERROR';

const req = require('superagent');

const setCasesList = (list, showPagination, params, count, pages) => ({
    type: SET_CASES_LIST,
    payload: {
        list,
        showPagination,
        params,
        count,
        pages,
    },
});

const setCaseDeleted = deleteResult => ({
    type: SET_CASE_DELETED,
    payload: deleteResult,
});

const setCaseDeleteError = deleteError => ({
    type: SET_CASE_DELETED_ERROR,
    payload: deleteError,
});

const deleteCase = (dispatch, caseId, getUrl, fullDelete = false) => {
    dispatch(loadActions.startLoading());
    let url = `/api/cases/${caseId}`;
    if (fullDelete) url = `/api/cases/${caseId}?full_delete=true&override=true`;
    req
        .delete(url)
        .then((deleteResult) => {
            if (fullDelete) {
                dispatch(setCaseDeleted(deleteResult.body));
            }
            req
                .get(getUrl)
                .then((result) => {
                    const data = result.body;
                    dispatch(loadActions.successLoadingNoData());
                    dispatch(setCasesList(data.cases, true, {}, parseInt(data.count, 10), data.pages));
                });
        })
        .catch((err) => {
            if (fullDelete) {
                dispatch(setCaseDeleteError());
            }
            dispatch(loadActions.errorLoading(err));
            console.error(`Error while deleting case ${err}`);
        });
    return ({
        type: DELETE_CASE,
    });
};

const updateCase = (dispatch, caseItem, patientId, toggleModal) => {
    dispatch(loadActions.startLoading());
    req
        .patch(`/api/cases/${caseItem.id}/`)
        .set('Content-Type', 'application/json')
        .send(caseItem)
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

const createCase = (dispatch, caseItem, patientId, toggleModal) => {
    dispatch(loadActions.startLoading());
    req
        .post('/api/cases/')
        .set('Content-Type', 'application/json')
        .send({
            ...caseItem,
            patient_id: patientId,
        })
        .then(() => {
            dispatch(enqueueSnackbar(succesfullSnackBar()));
            dispatch(patientsActions.fetchDetails(dispatch, patientId, false, toggleModal));
        })
        .catch((err) => {
            dispatch(enqueueSnackbar(errorSnackBar()));
            dispatch(loadActions.errorLoading(err));
        });
    return ({
        type: PUT_ACTION,
    });
};


export const casesActions = {
    setCasesList,
    deleteCase,
    setCaseDeleted,
    setCaseDeleteError,
    updateCase,
    createCase,
};

export const casesInitialState = {
    casesPage: {
        list: null,
        showPagination: false,
        params: {},
        count: 0,
        pages: 0,
    },
    deleteResult: null,
    deleteError: false,
};

export const casesReducer = (state = casesInitialState, action = {}) => {
    switch (action.type) {
        case PUT_ACTION:
        case PATCH_ACTION: {
            return {};
        }

        case SET_CASES_LIST: {
            const {
                list, showPagination, params, count, pages,
            } = action.payload;
            return {
                ...state,
                casesPage: {
                    list,
                    showPagination,
                    params,
                    count,
                    pages,
                },
            };
        }

        case SET_CASE_DELETED: {
            const deleteResult = action.payload;
            return {
                ...state,
                deleteResult,
                deleteError: false,
            };
        }

        case SET_CASE_DELETED_ERROR: {
            return {
                ...state,
                deleteResult: null,
                deleteError: true,
            };
        }

        case DELETE_CASE: {
            return state;
        }

        default:
            return state;
    }
};
