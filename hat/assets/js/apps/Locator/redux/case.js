import { loadActions } from '../../../redux/load';

const req = require('superagent');

export const SET_CASE = 'hat/locator/cases/SET_CASE';
export const SET_LIST = 'hat/locator/cases/SET_LIST';
export const FETCH_ACTION = 'hat/locator/assignation/FETCH_ACTION';


export const setList = list => ({
    type: SET_LIST,
    payload: list,
});

export const setCase = kase => ({
    type: SET_CASE,
    payload: kase,
});


export const fetchList = (dispatch) => {
    req
        .get('/api/cases/')
        .then((result) => {
            dispatch(loadActions.successLoadingNoData());
            dispatch(setList(result.body));
        })
        .catch((err) => {
            dispatch(loadActions.errorLoading(err));
            console.error(`Error while fetching cases: ${err}`);
        });
    return ({
        type: FETCH_ACTION,
    });
};


export const fetchCase = (dispatch, caseId) => {
    const url = `/api/cases/${caseId}`;
    req
        .get(url)
        .then((result) => {
            dispatch(loadActions.successLoadingNoData());
            dispatch(setCase(result.body));
        })
        .catch((err) => {
            dispatch(loadActions.errorLoading(err));
            console.error(`Error while fetching case: ${err}`);
        });
    return ({
        type: FETCH_ACTION,
    });
};

export const caseActions = {
    setCase,
    setList,
    fetchCase,
};

export const caseReducer = (state = {}, action = {}) => {
    switch (action.type) {
        case SET_CASE: {
            const newCase = action.payload;
            return { ...state, case: newCase };
        }
        case SET_LIST: {
            const list = action.payload;
            return { ...state, list };
        }
        case FETCH_ACTION: {
            return state;
        }
        default:
            return state;
    }
};
