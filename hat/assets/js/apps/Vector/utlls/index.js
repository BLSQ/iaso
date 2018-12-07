

import { vectorActions } from '../redux/vectorReducer';

const req = require('superagent');


export const fetchSites = (dispatch, dateFrom, dateTo) => req
    .get(`/api/sites?from=${dateFrom}&to=${dateTo}`)
    .then((result) => {
        dispatch(vectorActions.loadSites(result.body));
    })
    .catch((err) => {
        console.error('Error when fetching sites', err);
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
