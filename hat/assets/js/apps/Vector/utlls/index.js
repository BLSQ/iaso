

import { vectorActions } from '../redux/vectorReducer';

const req = require('superagent');


export const fetchTraps = (dispatch, dateFrom, dateTo) => req
    .get(`/api/traps?from=${dateFrom}&to=${dateTo}`)
    .then((result) => {
        dispatch(vectorActions.loadTraps(result.body));
    })
    .catch((err) => {
        console.error('Error when fetching traps', err);
    });

export const fetchTargets = (dispatch, dateFrom, dateTo) => req
    .get(`/api/targets?from=${dateFrom}&to=${dateTo}`)
    .then((result) => {
        dispatch(vectorActions.loadTargets(result.body));
    })
    .catch((err) => {
        console.error('Error when fetching targets', err);
    });

export const fetchNonEndemicVillages = (dispatch, dateFrom, dateTo) => req
    .get(`/api/villages?from=${dateFrom}&to=${dateTo}&results=negative`)
    .then((result) => {
        dispatch(vectorActions.loadNonEndemicVillages(result.body));
    })
    .catch((err) => {
        console.error('Error when fetching villages', err);
    });

export const fetchEndemicVillages = (dispatch, dateFrom, dateTo) => req
    .get(`/api/villages?from=${dateFrom}&to=${dateTo}&results=positive`)
    .then((result) => {
        dispatch(vectorActions.loadEndemicVillages(result.body));
    })
    .catch((err) => {
        console.error('Error when fetching villages', err);
    });
