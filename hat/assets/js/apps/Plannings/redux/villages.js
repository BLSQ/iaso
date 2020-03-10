import { loadActions } from '../../../redux/load';

export const SET_VILLAGES = 'hat/microplanning/SET_VILLAGES';

const req = require('superagent');

const setVillages = data => ({
    type: SET_VILLAGES,
    payload: data,
});

export const fetchVillages = url => (dispatch) => {
    dispatch(loadActions.startLoading());
    req
        .get(url)
        .then((result) => {
            dispatch(loadActions.successLoadingNoData());
            dispatch(setVillages(result.body));
        })
        .catch((err) => {
            dispatch(loadActions.errorLoading(err));
            console.error(`Error while fetching villages: ${err}`);
        });
};

export const villagesActions = {
    fetchVillages,
};

export const villagesInitialState = {
    list: null,
};
export const villagesReducer = (state = villagesInitialState, action = {}) => {
    switch (action.type) {
        case SET_VILLAGES:
            return { ...state, list: action.payload };

        default:
            return state;
    }
};
