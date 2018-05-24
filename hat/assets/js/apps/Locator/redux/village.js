
import { push } from 'react-router-redux';
import { loadActions } from '../../../redux/load';
import { FETCH_ACTION } from './locator';
import { createUrl } from '../../../utils/fetchData';

export const LOAD_VILLAGES = 'hat/locator/locator/LOAD_VILLAGES';
export const SELECT_VILLAGE = 'hat/locator/locator/SELECT_VILLAGE';

const req = require('superagent');


export const loadVillages = payload => ({
    type: LOAD_VILLAGES,
    payload,
});

export const selectVillage = villageId => ({
    type: SELECT_VILLAGE,
    payload: villageId,
});


export const saveVillage = (kaseId, villageObj, params, dispatch) => {
    dispatch(loadActions.startLoading());
    const tempParams = params;
    delete tempParams.case_id;
    req
        .patch(`/api/cases/${kaseId}/`)
        .set('Content-Type', 'application/json')
        .send(villageObj)
        .then(() => {
            dispatch(push(`list${createUrl(tempParams, '')}`));
        })
        .catch((err) => {
            dispatch(loadActions.errorLoading(err));
            console.error('Error when saving village', err);
        });
    return ({
        type: FETCH_ACTION,
    });
};


export const villageActions = {
    loadVillages,
    selectVillage,
    saveVillage,
};
