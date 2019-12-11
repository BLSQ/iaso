
import { loadActions } from '../../../redux/load';
import getMergedPatient from '../utils';

const LOAD_CURRENT_DETAIL = 'hat/patient/detail/LOAD_CURRENT_DETAIL';
const LOAD_CURRENT_DUPLICATE_DETAIL = 'hat/patient/detail/LOAD_CURRENT_DUPLICATE_DETAIL';
const LOAD_TEST_MAPPING = 'hat/patient/detail/LOAD_TEST_MAPPING';
const SET_PATIENTS_LIST = 'hat/patient/detail/SET_PATIENTS_LIST';
const EMPTY_PATIENTS_LIST = 'hat/patient/detail/EMPTY_PATIENTS_LIST';
const SET_DUPLICATE_PATIENTS_LIST = 'hat/patient/detail/SET_DUPLICATE_PATIENTS_LIST';
const EMPTY_DUPLICATE_PATIENTS_LIST = 'hat/patient/detail/EMPTY_DUPLICATE_PATIENTS_LIST';
const FETCH_ACTION = 'hat/patient/detail/FETCH_ACTION';
const SAVE_ACTION = 'hat/patient/detail/SAVE_ACTION';
const GET_MANUAL_MERGED_PATIENT = 'hat/patient/detail/GET_MANUAL_MERGED_PATIENT';
const SET_MANUAL_MERGED_PATIENT = 'hat/patient/detail/SET_MANUAL_MERGED_PATIENT';
const SET_ERROR_ON_UPDATED = 'hat/patient/detail/SET_ERROR_ON_UPDATED';
const SET_IS_UPDATED = 'hat/patient/detail/SET_IS_UPDATED';
const LOAD_MANUAL_DUPLICATE = 'hat/patient/duplicate/LOAD_MANUAL_DUPLICATE';
const SET_MANUAL_DUPLICATE_ID = 'hat/patient/duplicate/SET_MANUAL_DUPLICATE_ID';
const SET_IS_FETCHING_DUPLICATE_PAIR = 'hat/patient/duplicate/SET_IS_FETCHING_DUPLICATE_PAIR';
const EMPTY_MANUAL_DUPLICATE = 'hat/patient/duplicate/EMPTY_MANUAL_DUPLICATE';


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


const loadManualDuplicate = manualDuplicate => ({
    type: LOAD_MANUAL_DUPLICATE,
    payload: manualDuplicate,
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

const setDuplicatePatientList = (list, showPagination, params, count, pages) => ({
    type: SET_DUPLICATE_PATIENTS_LIST,
    payload: {
        list,
        showPagination,
        params,
        count,
        pages,
    },
});

const emptyPatientList = () => ({
    type: EMPTY_PATIENTS_LIST,
});

const setManualDuplicateId = duplicateId => ({
    type: SET_MANUAL_DUPLICATE_ID,
    payload: duplicateId,
});
const emptyManualDuplicate = () => ({
    type: EMPTY_MANUAL_DUPLICATE,
});
const emptyDuplicatePatientList = () => ({
    type: EMPTY_DUPLICATE_PATIENTS_LIST,
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

const fetchDetails = (dispatch, patientId, resetDetail = true) => {
    dispatch(loadActions.startLoading());
    if (resetDetail) {
        dispatch(loadCurrentDetail({}));
        dispatch(fetchTestMapping(dispatch));
    }
    req
        .get(`/api/patients/${patientId}`)
        .then((result) => {
            dispatch(loadActions.successLoadingNoData());
            dispatch(loadCurrentDetail(result.body));
        })
        .catch((err) => {
            dispatch(loadActions.errorLoading(err));
            console.error(`Error while fetching detail ${err}`);
        });
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
        .catch((err) => {
            dispatch(loadActions.errorLoading(err));
            console.error(`Error while fetching duplicate detail ${err}`);
        });
    return ({
        type: FETCH_ACTION,
    });
};

const setIsFetchincgDuplicatePair = payload => ({
    type: SET_IS_FETCHING_DUPLICATE_PAIR,
    payload,
});


const fetchDuplicatePair = (dispatch, patientId1, patientId2) => {
    dispatch(setIsFetchincgDuplicatePair(true));
    req
        .get(`/api/patientduplicates?patientId1=${patientId1}&patientId2=${patientId2}`)
        .then((result) => {
            dispatch(setIsFetchincgDuplicatePair(false));
            let duplicateId;
            if (result.body.count > 0) {
                duplicateId = result.body.patientduplicatepairs[0].id;
            }
            dispatch(setManualDuplicateId(duplicateId));
        })
        .catch((err) => {
            dispatch(setIsFetchincgDuplicatePair(false));
            console.error(`Error while fetching duplicates pair ${err}`);
        });
    return ({
        type: FETCH_ACTION,
    });
};


const fetchPatients = (dispatch, url, params) => {
    dispatch(loadActions.startLoading());
    req
        .get(url)
        .then((result) => {
            dispatch(loadActions.successLoadingNoData());
            dispatch(setPatientList(result.body.patient, true, params, result.body.count, result.body.pages));
        })
        .catch((err) => {
            dispatch(loadActions.errorLoading(err));
            console.error(`Error while fetching patients ${err}`);
        });
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
            dispatch(emptyDuplicatePatientList());
            dispatch(loadActions.successLoadingNoData());
            element.goBack(true);
        })
        .catch((err) => {
            dispatch(loadActions.errorLoading(err));
            console.error(`Error while merging duplicates ${err}`);
        });
    return ({
        type: FETCH_ACTION,
    });
};

const saveManualDuplicate = (
    dispatch,
    patient1,
    patient2,
) => {
    const data = {
        patientA: patient1.id > patient2.id ? patient1 : patient2,
        patientB: patient1.id > patient2.id ? patient2 : patient1,
    };
    dispatch(loadActions.startLoading());
    req
        .post('/api/patientduplicates/')
        .set('Content-Type', 'application/json')
        .send(data)
        .then((result) => {
            dispatch(setManualDuplicateId(result.body.id));
            dispatch(loadActions.successLoadingNoData());
        })
        .catch((err) => {
            dispatch(setManualDuplicateId(null));
            dispatch(loadActions.errorLoading(err));
            console.error(`Error while saving manual duplicate ${err}`);
        });
    return ({
        type: FETCH_ACTION,
    });
};

export const saveAndMergePatient = (dispatch, patient, duplicateId, targetId, element) => {
    dispatch(loadActions.startLoading());
    req
        .put(`/api/patients/${patient.id}/`)
        .set('Content-Type', 'application/json')
        .send(patient)
        .then(() => {
            dispatch(mergeDuplicates(dispatch, duplicateId, targetId, element));
        })
        .catch((err) => {
            dispatch(loadActions.errorLoading(err));
            console.error(`Error while saving patient ${err}`);
        });
    return ({
        type: SAVE_ACTION,
    });
};


const setErrorOnUpdated = payload => ({
    type: SET_ERROR_ON_UPDATED,
    payload,
});

const setIsUpdated = payload => ({
    type: SET_IS_UPDATED,
    payload,
});

export const savePatient = (dispatch, patient) => {
    dispatch(loadActions.startLoading());
    req
        .put(`/api/patients/${patient.id}/`)
        .set('Content-Type', 'application/json')
        .send(patient)
        .then((result) => {
            dispatch(emptyPatientList());
            dispatch(setErrorOnUpdated(false));
            dispatch(setIsUpdated(true));
            dispatch(loadCurrentDetail(result.body));
            dispatch(loadActions.successLoadingNoData());
        })
        .catch((err) => {
            dispatch(setErrorOnUpdated(true));
            dispatch(setIsUpdated(false));
            dispatch(loadActions.errorLoading(err));
            return (console.error(`Error while saving patient ${err}`));
        });
    return ({
        type: SAVE_ACTION,
    });
};

export const patientsActions = {
    loadCurrentDetail,
    fetchDetails,
    setPatientList,
    setDuplicatePatientList,
    fetchDuplicatesDetails,
    mergeDuplicates,
    getManualMergedPatient,
    setManualMergedPatient,
    saveAndMergePatient,
    savePatient,
    setErrorOnUpdated,
    setIsUpdated,
    loadManualDuplicate,
    saveManualDuplicate,
    fetchDuplicatePair,
    emptyManualDuplicate,
    fetchPatients,
};

export const patientsInitialState = {
    current: {},
    duplicateCurrent: {},
    testsMapping: {},
    manualDuplicate: {
        patientA: null,
        patientB: null,
        duplicateId: 0,
        fetchingPair: false,
    },
    patientsPage: {
        list: null,
        showPagination: false,
        params: {},
        count: 0,
        pages: 0,
    },
    patientsDuplicatePage: {
        list: null,
        showPagination: false,
        params: {},
        count: 0,
        pages: 0,
    },
    manualMergedPatient: null,
    manualMergedConflicts: [],
    isUpdated: false,
    hasError: false,
};

export const patientsReducer = (state = patientsInitialState, action = {}) => {
    switch (action.type) {
        case LOAD_CURRENT_DETAIL: {
            const current = action.payload;
            return { ...state, current };
        }

        case SET_IS_FETCHING_DUPLICATE_PAIR: {
            const fetchingPair = action.payload;
            return {
                ...state,
                manualDuplicate: {
                    ...state.manualDuplicate,
                    fetchingPair,
                },
            };
        }

        case LOAD_MANUAL_DUPLICATE: {
            const manualDuplicate = action.payload;
            return {
                ...state,
                manualDuplicate: {
                    ...manualDuplicate,
                    duplicateId: 0,
                },
            };
        }

        case LOAD_CURRENT_DUPLICATE_DETAIL: {
            const { current, duplicateCurrent } = action.payload;
            return { ...state, current, duplicateCurrent };
        }

        case LOAD_TEST_MAPPING: {
            const testsMapping = action.payload;
            return { ...state, testsMapping };
        }

        case SET_MANUAL_DUPLICATE_ID: {
            const duplicateId = action.payload;
            return {
                ...state,
                manualDuplicate: {
                    ...state.manualDuplicate,
                    duplicateId,
                },
            };
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

        case EMPTY_PATIENTS_LIST: {
            return {
                ...state,
                patientsPage: {
                    ...state.patientsPage,
                    list: null,
                },
            };
        }

        case SET_DUPLICATE_PATIENTS_LIST: {
            const {
                list, showPagination, params, count, pages,
            } = action.payload;
            return {
                ...state,
                patientsDuplicatePage: {
                    list,
                    showPagination,
                    params,
                    count,
                    pages,
                },
            };
        }
        case EMPTY_DUPLICATE_PATIENTS_LIST: {
            return {
                ...state,
                patientsDuplicatePage: {
                    ...state.patientsDuplicatePage,
                    list: null,
                },
            };
        }

        case EMPTY_MANUAL_DUPLICATE: {
            return {
                ...state,
                manualDuplicate: patientsInitialState.manualDuplicate,
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

        case SET_ERROR_ON_UPDATED: {
            const hasError = action.payload;
            return { ...state, hasError };
        }

        case SET_IS_UPDATED: {
            const isUpdated = action.payload;
            return { ...state, isUpdated };
        }

        default:
            return state;
    }
};
