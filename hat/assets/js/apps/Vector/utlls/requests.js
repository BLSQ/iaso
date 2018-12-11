

import { vectorActions } from '../redux/vectorReducer';

const req = require('superagent');


export const fetchSites = (dispatch, params) => {
    const {
        dateFrom,
        dateTo,
        userId,
        habitats,
        onlyReferenceSites,
    } = params;
    let url = `/api/sites?from=${dateFrom}&to=${dateTo}`;
    if (userId) {
        url += `&userId=${userId}`;
    }
    if (habitats) {
        url += `&habitats=${habitats}`;
    }
    if (onlyReferenceSites) {
        url += '&only_reference_sites=True';
    }
    return req
        .get(url)
        .then((result) => {
            dispatch(vectorActions.loadSites(result.body));
        })
        .catch((err) => {
            console.error('Error when fetching sites', err);
        });
};

export const fetchTargets = (dispatch, params) => {
    const {
        dateFrom,
        dateTo,
        userId,
        habitats,
        onlyReferenceSites,
    } = params;
    let url = `/api/targets?from=${dateFrom}&to=${dateTo}`;
    if (userId) {
        url += `&userId=${userId}`;
    }
    if (habitats) {
        url += `&habitats=${habitats}`;
    }
    if (onlyReferenceSites) {
        url += '&only_reference_sites=True';
    }
    return req
        .get(url)
        .then((result) => {
            dispatch(vectorActions.loadTargets(result.body));
        })
        .catch((err) => {
            console.error('Error when fetching targets', err);
        });
};

export const fetchPaginatedSites = (dispatch, params, limit, page, order) => {
    const {
        dateFrom,
        dateTo,
        userId,
        habitats,
        onlyReferenceSites,
    } = params;
    let url = `/api/sites?from=${dateFrom}&to=${dateTo}&limit=${limit || '50'}&page=${page || '1'}`;
    if (order) {
        url += `&order=${order}`;
    }
    if (userId) {
        url += `&userId=${userId}`;
    }
    if (habitats) {
        url += `&habitats=${habitats}`;
    }
    if (onlyReferenceSites) {
        url += '&only_reference_sites=True';
    }
    return (req
        .get(url)
        .then((result) => {
            dispatch(vectorActions.loadPaginatedSites(result.body, params));
        })
        .catch((err) => {
            console.error('Error when fetching paginated sites', err);
        }));
};

export const fetchPaginatedTargets = (dispatch, params, limit, page, order) => {
    const {
        dateFrom,
        dateTo,
        userId,
        habitats,
        onlyReferenceSites,
    } = params;
    let url = `/api/targets?from=${dateFrom}&to=${dateTo}&limit=${limit || '50'}&page=${page || '1'}`;
    if (order) {
        url += `&order=${order}`;
    }
    if (userId) {
        url += `&userId=${userId}`;
    }
    if (habitats) {
        url += `&habitats=${habitats}`;
    }
    if (onlyReferenceSites) {
        url += '&only_reference_sites=True';
    }
    return (req
        .get(url)
        .then((result) => {
            dispatch(vectorActions.loadPaginatedTargets(result.body, params));
        })
        .catch((err) => {
            console.error('Error when fetching paginated targets', err);
        }));
};

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

export const fetchProfiles = dispatch => req
    .get('/api/profiles?as_list=True')
    .then((result) => {
        dispatch(vectorActions.loadProfiles(result.body));
    })
    .catch((err) => {
        console.error('Error when fetching profiles', err);
    });

export const fetchHabitats = dispatch => req
    .get('/api/habitats')
    .then((result) => {
        dispatch(vectorActions.loadHabitats(result.body));
    })
    .catch((err) => {
        console.error('Error when fetching habitats', err);
    });
