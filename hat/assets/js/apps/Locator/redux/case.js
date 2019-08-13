import { loadActions } from '../../../redux/load';
import { emptyVillages, resetFilters, FETCH_ACTION } from './locator';
import { selectProvince } from './province';

const req = require('superagent');

export const SET_CASE = 'hat/locator/cases/SET_CASE';
export const SET_LIST = 'hat/locator/cases/SET_LIST';
export const SET_CASES_LIST = 'hat/patient/detail/SET_CASES_LIST';
export const RESET_CASES_LIST = 'hat/patient/detail/RESET_CASES_LIST';


export const setList = list => ({
    type: SET_LIST,
    payload: list,
});

export const setCase = kase => ({
    type: SET_CASE,
    payload: kase,
});

export const setCasesList = (list, showPagination, params, count, pages) => ({
    type: SET_CASES_LIST,
    payload: {
        list,
        showPagination,
        params,
        count,
        pages,
    },
});

export const resetCasesList = () => ({
    type: RESET_CASES_LIST,
});

export const fetchCase = (dispatch, caseId) => {
    const url = `/api/cases/${caseId}`;
    req
        .get(url)
        .then((result) => {
            dispatch(loadActions.successLoadingNoData());
            const kase = result.body;
            dispatch(setCase(kase));

            if (kase) {
                const { location } = kase;
                if (location.normalized && location.normalized.as) {
                    dispatch(selectProvince(location.normalized.as.province_id, dispatch, location.normalized.as.zs_id, location.normalized.as.id));
                    dispatch(emptyVillages());
                } else {
                    dispatch(resetFilters());
                }
            }
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
    setCasesList,
    resetCasesList,
};

export const caseInitialState = {
    casesPage: {
        list: null,
        showPagination: false,
        params: {},
        count: 0,
        pages: 0,
    },
};


export const caseReducer = (state = caseInitialState, action = {}) => {
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
        case RESET_CASES_LIST: {
            return {
                ...state,
                casesPage: caseInitialState.casesPage,
            };
        }
        default:
            return state;
    }
};
