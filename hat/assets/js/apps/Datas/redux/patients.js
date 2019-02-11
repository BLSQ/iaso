
import { loadActions } from '../../../redux/load';
import getMergedPatient from '../utils';

const LOAD_CURRENT_DETAIL = 'hat/patient/detail/LOAD_CURRENT_DETAIL';
const LOAD_CURRENT_DUPLICATE_DETAIL = 'hat/patient/detail/LOAD_CURRENT_DUPLICATE_DETAIL';
const LOAD_TEST_MAPPING = 'hat/patient/detail/LOAD_TEST_MAPPING';
const SET_PATIENTS_LIST = 'hat/patient/detail/SET_PATIENTS_LIST';
const FETCH_ACTION = 'hat/patient/detail/FETCH_ACTION';
const GET_MANUAL_MERGED_PATIENT = 'hat/patient/detail/GET_MANUAL_MERGED_PATIENT';
const SET_MANUAL_MERGED_PATIENT = 'hat/patient/detail/SET_MANUAL_MERGED_PATIENT';


const req = require('superagent');

const loadCurrentDetail = payload => ({
    type: LOAD_CURRENT_DETAIL,
    payload,
});

const loadCurrentDuplicatesDetail = (current, duplicateCurrent) => ({
    type: LOAD_CURRENT_DUPLICATE_DETAIL,
    payload: {
        current,
        duplicateCurrent,
    },
});

const loadTestMapping = payload => ({
    type: LOAD_TEST_MAPPING,
    payload,
});

const setPatientList = (list, showPagination, params, count, pages) => ({
    type: SET_PATIENTS_LIST,
    payload: {
        list,
        showPagination,
        params,
        count,
        pages,
    },
});

const fetchTestMapping = (dispatch) => {
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

const fetchDetails = (dispatch, patientId) => {
    dispatch(loadActions.startLoading());
    dispatch(loadCurrentDetail({}));
    dispatch(fetchTestMapping(dispatch));
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

const setManualMergedPatient = (manualMergedPatient, manualMergedConflicts) => (
    {
        type: SET_MANUAL_MERGED_PATIENT,
        payload: {
            manualMergedPatient,
            manualMergedConflicts,
        },
    }
);

const getManualMergedPatient = (patientA, patientB) => {
    const mergedPatientObject = getMergedPatient(patientA, patientB);
    return {
        type: GET_MANUAL_MERGED_PATIENT,
        payload: {
            manualMergedPatient: mergedPatientObject.mergedItem,
            manualMergedConflicts: mergedPatientObject.conflicts,
        },
    };
};


const fetchDuplicatesDetails = (dispatch, patientId, patientId2) => {
    dispatch(loadActions.startLoading());
    dispatch(loadCurrentDuplicatesDetail({}, {}));
    dispatch(fetchTestMapping(dispatch));

    Promise.all([
        req.get(`/api/patients/${patientId}`),
        req.get(`/api/patients/${patientId2}`),
    ]).then((result) => {
        dispatch(loadActions.successLoadingNoData());
        dispatch(getManualMergedPatient(result[0].body, result[1].body));
        dispatch(loadCurrentDuplicatesDetail(result[0].body, result[1].body));
    })
        .catch(err => (console.error(`Error while fetching detail ${err}`)));
    return ({
        type: FETCH_ACTION,
    });
};

const mergeDuplicates = (
    dispatch,
    duplicateId,
    targetId,
    element,
    ignore,
) => {
    dispatch(loadActions.startLoading());
    let data = {
        merge: targetId,
    };
    if (ignore) {
        data = {
            ignore: true,
        };
    }
    req
        .put(`/api/patientduplicates/${duplicateId}/`)
        .set('Content-Type', 'application/json')
        .send(data)
        .then(() => {
            dispatch(loadActions.successLoadingNoData());
            element.goBack();
        })
        .catch(err => (console.error(`Error while merging duplicates ${err}`)));
    return ({
        type: FETCH_ACTION,
    });
};

export const saveAndMergePatient = (dispatch, patient, duplicateId, targetId, element) => {
    dispatch(loadActions.startLoading());
    return (req
        .put(`/api/patients/${patient.id}/`)
        .set('Content-Type', 'application/json')
        .send(patient)
        .then(() => {
            dispatch(mergeDuplicates(dispatch, duplicateId, targetId, element));
        })
        .catch(err => (console.error(`Error while saving patient ${err}`))));
};


export const patientsActions = {
    loadCurrentDetail,
    fetchDetails,
    setPatientList,
    fetchDuplicatesDetails,
    mergeDuplicates,
    getManualMergedPatient,
    setManualMergedPatient,
    saveAndMergePatient,
};

export const patientsInitialState = {
    current: {},
    duplicateCurrent: {},
    testsMapping: {},
    patientsPage: {
        list: null,
        showPagination: false,
        params: {},
        count: 0,
        pages: 0,
    },
    manualMergedPatient: null,
    manualMergedConflicts: [],
};

export const patientsReducer = (state = patientsInitialState, action = {}) => {
    switch (action.type) {
        case LOAD_CURRENT_DETAIL: {
            const current = action.payload;
            return { ...state, current };
        }

        case LOAD_CURRENT_DUPLICATE_DETAIL: {
            const { current, duplicateCurrent } = action.payload;
            return { ...state, current, duplicateCurrent };
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
                patientsPage: {
                    list,
                    showPagination,
                    params,
                    count,
                    pages,
                },
            };
        }

        case GET_MANUAL_MERGED_PATIENT: {
            const { manualMergedPatient, manualMergedConflicts } = action.payload;
            return {
                ...state,
                manualMergedPatient,
                manualMergedConflicts,
            };
        }

        case SET_MANUAL_MERGED_PATIENT: {
            const { manualMergedPatient, manualMergedConflicts } = action.payload;
            return {
                ...state,
                manualMergedPatient,
                manualMergedConflicts,
            };
        }

        case FETCH_ACTION: {
            return state;
        }

        default:
            return state;
    }
};
