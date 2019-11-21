import { loadActions } from '../../../redux/load';

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
    if (fullDelete) url = `/api/cases/${caseId}?full_delete=true`;
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

export const casesActions = {
    setCasesList,
    deleteCase,
    setCaseDeleted,
    setCaseDeleteError,
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
