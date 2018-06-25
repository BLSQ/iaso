import { loadActions } from '../../../redux/load';
import { selectZone, selectArea, emptyVillages, resetFilters, locatorActions, FETCH_ACTION } from './locator';
import { selectProvince } from './province';

const req = require('superagent');

export const SET_CASE = 'hat/locator/cases/SET_CASE';
export const SET_LIST = 'hat/locator/cases/SET_LIST';


export const setList = list => ({
    type: SET_LIST,
    payload: list,
});

export const setCase = kase => ({
    type: SET_CASE,
    payload: kase,
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
                const { normalized_AS_dict } = kase;
                if (normalized_AS_dict.as_id) {
                    dispatch(selectProvince(normalized_AS_dict.province_id, dispatch, normalized_AS_dict.zs_id, normalized_AS_dict.as_id));
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
