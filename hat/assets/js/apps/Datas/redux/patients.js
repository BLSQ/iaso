
import { loadActions } from '../../../redux/load';

export const LOAD_CURRENT_DETAIL = 'hat/patient/detail/LOAD_CURRENT_DETAIL';
export const LOAD_TEST_MAPPING = 'hat/patient/detail/LOAD_TEST_MAPPING';
export const SET_PATIENTS_LIST = 'hat/patient/detail/SET_PATIENTS_LIST';
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

export const setPatientList = (list, showPagination, params, count, pages) => ({
    type: SET_PATIENTS_LIST,
    payload: {
        list,
        showPagination,
        params,
        count,
        pages,
    },
});

export const fetchDetails = (dispatch, patientId) => {
    dispatch(loadActions.startLoading());
    dispatch(loadCurrentDetail({}));
    req
        .get('/api/testsmapping')
        .then((result) => {
            dispatch(loadTestMapping(result.body));
        })
        .catch(err => (console.error(`Error while fetching test mapping ${err}`)));
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


export const patientsActions = {
    loadCurrentDetail,
    fetchDetails,
    setPatientList,
};

export const patientsInitialState = {
    current: {},
    testsMapping: {},
    list: null,
    showPagination: false,
    params: {},
    count: 0,
    pages: 0,
};

export const patientsReducer = (state = patientsInitialState, action = {}) => {
    switch (action.type) {
        case LOAD_CURRENT_DETAIL: {
            const current = action.payload;
            return { ...state, current };
        }

        case LOAD_TEST_MAPPING: {
            const testsMapping = action.payload;
            return { ...state, testsMapping };
        }

        case SET_PATIENTS_LIST: {
            const {
                list, showPagination, params, count, pages,
            } = action.payload;
            return {
                ...state,
                list,
                showPagination,
                params,
                count,
                pages,
            };
        }

        case FETCH_ACTION: {
            return state;
        }

        default:
            return state;
    }
};
