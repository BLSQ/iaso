

import { vectorActions } from '../redux/vectorReducer';
import { loadActions } from '../../../redux/load';

const req = require('superagent');


export const fetchSites = (dispatch, params) => {
    const {
        dateFrom,
        dateTo,
        userId,
        province_id,
        zs_id,
        as_id,
    } = params;
    let url = `/api/new_sites?from=${dateFrom}&to=${dateTo}`;
    if (userId) {
        url += `&userId=${userId}`;
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
            dispatch(vectorActions.loadSites(result.body, params));
        })
        .catch((err) => {
            console.error('Error when fetching sites', err);
        });
};

export const fetchTraps = (dispatch, params) => {
    const {
        dateFrom,
        dateTo,
        userId,
        habitats,
        onlyReferenceTraps,
        onlyIgnoredTraps,
        province_id,
        zs_id,
        as_id,
    } = params;
    let url = `/api/traps?from=${dateFrom}&to=${dateTo}`;
    if (userId) {
        url += `&userId=${userId}`;
    }
    if (habitats) {
        url += `&habitats=${habitats}`;
    }
    if (onlyReferenceTraps) {
        url += '&onlyReferenceTraps=True';
    }
    if (onlyIgnoredTraps) {
        url += '&onlyIgnoredTraps=True';
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
            dispatch(vectorActions.loadTraps(result.body));
        })
        .catch((err) => {
            console.error('Error when fetching traps', err);
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
        province_id,
        zs_id,
        as_id,
    } = params;
    let url = `/api/new_sites?from=${dateFrom}&to=${dateTo}&limit=${limit || '50'}&page=${page || '1'}`;
    if (order) {
        url += `&order=${order}`;
    }
    if (userId) {
        url += `&userId=${userId}`;
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

export const fetchPaginatedTraps = (dispatch, params, limit, page, order) => {
    const {
        dateFrom,
        dateTo,
        userId,
        habitats,
        onlyReferenceTraps,
        onlyIgnoredTraps,
        province_id,
        zs_id,
        as_id,
    } = params;
    let url = `/api/traps?from=${dateFrom}&to=${dateTo}&limit=${limit || '50'}&page=${page || '1'}`;
    if (order) {
        url += `&order=${order}`;
    }
    if (userId) {
        url += `&userId=${userId}`;
    }
    if (habitats) {
        url += `&habitats=${habitats}`;
    }
    if (onlyReferenceTraps) {
        url += '&onlyReferenceTraps=True';
    }
    if (onlyIgnoredTraps) {
        url += '&onlyIgnoredTraps=True';
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
            dispatch(vectorActions.loadPaginatedTraps(result.body, params));
        })
        .catch((err) => {
            console.error('Error when fetching paginated traps', err);
        }));
};

export const fetchPaginatedTargets = (dispatch, params, limit, page, order) => {
    const {
        dateFrom,
        dateTo,
        userId,
        habitats,
        onlyReferenceTraps,
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
    if (onlyReferenceTraps) {
        url += '&onlyReferenceTraps=True';
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


export const saveTrap = (dispatch, trap) => {
    dispatch(loadActions.startLoading());
    return (req
        .put(`/api/traps/${trap.id}/`)
        .set('Content-Type', 'application/json')
        .send(trap)
        .then(() => {
            dispatch(loadActions.successLoadingNoData());
        })
        .catch(err => (console.error(`Error while saving trap ${err}`))));
};

export const saveSite = (dispatch, site) => {
    dispatch(loadActions.startLoading());
    return (req
        .put(`/api/new_sites/${site.id}/`)
        .set('Content-Type', 'application/json')
        .send(site)
        .then(() => {
            dispatch(loadActions.successLoadingNoData());
        })
        .catch(err => (console.error(`Error while saving site ${err}`))));
};

export const saveTarget = (dispatch, target) => {
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
