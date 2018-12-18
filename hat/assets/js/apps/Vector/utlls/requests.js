

import { vectorActions } from '../redux/vectorReducer';
import { loadActions } from '../../../redux/load';

const req = require('superagent');


export const fetchSites = (dispatch, params) => {
    const {
        dateFrom,
        dateTo,
        userId,
        habitats,
        onlyReferenceSites,
        onlyIgnoredSites,
        province_id,
        zs_id,
        as_id,
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
    if (onlyIgnoredSites) {
        url += '&onlyIgnoredSites=True';
    }
    if (province_id) {
        url += `&province_id=${province_id}`;
    }
    if (zs_id) {
        url += `&zs_id=${zs_id}`;
    }
    if (as_id) {
        url += `&as_id=${as_id}`;
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
        onlyIgnoredTargets,
        province_id,
        zs_id,
        as_id,
    } = params;
    let url = `/api/targets?from=${dateFrom}&to=${dateTo}`;
    if (userId) {
        url += `&userId=${userId}`;
    }
    if (habitats) {
        url += `&habitats=${habitats}`;
    }
    if (province_id) {
        url += `&province_id=${province_id}`;
    }
    if (zs_id) {
        url += `&zs_id=${zs_id}`;
    }
    if (as_id) {
        url += `&as_id=${as_id}`;
    }
    if (onlyIgnoredTargets) {
        url += '&onlyIgnoredTargets=True';
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
        onlyIgnoredSites,
        province_id,
        zs_id,
        as_id,
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
    if (onlyIgnoredSites) {
        url += '&onlyIgnoredSites=True';
    }
    if (province_id) {
        url += `&province_id=${province_id}`;
    }
    if (zs_id) {
        url += `&zs_id=${zs_id}`;
    }
    if (as_id) {
        url += `&as_id=${as_id}`;
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
        onlyIgnoredTargets,
        province_id,
        zs_id,
        as_id,
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
    if (onlyIgnoredTargets) {
        url += '&onlyIgnoredTargets=True';
    }
    if (province_id) {
        url += `&province_id=${province_id}`;
    }
    if (zs_id) {
        url += `&zs_id=${zs_id}`;
    }
    if (as_id) {
        url += `&as_id=${as_id}`;
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

export const fetchVillages = (dispatch, params, withEndemic) => {
    const {
        dateFrom,
        dateTo,
        province_id,
        zs_id,
        as_id,
    } = params;

    let url = `/api/villages?from=${dateFrom}&to=${dateTo}`;
    if (province_id) {
        url += `&province_id=${province_id}`;
    }
    if (zs_id) {
        url += `&zs_id=${zs_id}`;
    }
    if (as_id) {
        url += `&as_id=${as_id}`;
    }
    url += `&results=${withEndemic ? 'positive' : 'negative'}`;
    return req
        .get(url)
        .then((result) => {
            if (withEndemic) {
                dispatch(vectorActions.loadEndemicVillages(result.body));
            } else {
                dispatch(vectorActions.loadNonEndemicVillages(result.body));
            }
        })
        .catch((err) => {
            console.error('Error when fetching villages', err);
        });
};

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


export const saveSite = (dispatch, site) => {
    dispatch(loadActions.startLoading());
    return (req
        .put(`/api/sites/${site.id}/`)
        .set('Content-Type', 'application/json')
        .send(site)
        .then(() => {
            dispatch(loadActions.successLoadingNoData());
        })
        .catch(err => (console.error(`Error while saving site ${err}`))));
};

export const saveTarget = (dispatch, target) => {
    console.log(target);
    dispatch(loadActions.startLoading());
    return (req
        .put(`/api/targets/${target.id}/`)
        .set('Content-Type', 'application/json')
        .send(target)
        .then(() => {
            dispatch(loadActions.successLoadingNoData());
        })
        .catch(err => (console.error(`Error while saving target ${err}`))));
};
