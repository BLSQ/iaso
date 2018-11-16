
import { loadActions } from '../../../redux/load';

export const LOAD_CURRENT_DETAIL = 'hat/patient/detail/LOAD_CURRENT_DETAIL';
export const LOAD_DETAIL = 'hat/patient/detail/LOAD_DETAIL';
export const FETCH_ACTION = 'hat/patient/detail/FETCH_ACTION';


const req = require('superagent');

export const loadCurrentDetail = payload => ({
    type: LOAD_CURRENT_DETAIL,
    payload,
});

export const fetchDetails = (dispatch, patientId) => {
    dispatch(loadActions.startLoading());
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
};

export const patientDetailsReducer = (state = patientDetailsInitialState, action = {}) => {
    switch (action.type) {
        case LOAD_CURRENT_DETAIL: {
            const current = action.payload;
            return { ...state, current };
        }

        case FETCH_ACTION: {
            return state;
        }

        default:
            return state;
    }
};
