import {
    deleteRequest,
    getRequest,
    patchRequest,
    postRequest,
    putRequest,
} from 'Iaso/libs/Api.ts';
import { useSnackQuery } from 'Iaso/libs/apiHooks.ts';
import { enqueueSnackbar } from '../redux/snackBarsReducer';
import { errorSnackBar, succesfullSnackBar } from '../constants/snackBars';
import { dispatch as storeDispatch } from '../redux/store';

export const fetchSubOrgUnitsByType = (dispatch, params, orgUnitType) =>
    getRequest(`/api/orgunits/?${params}`)
        .then(res => ({
            ...orgUnitType,
            orgUnits: res.orgUnits,
        }))
        .catch(error => {
            dispatch(
                enqueueSnackbar(
                    errorSnackBar('fetchOrgUnitsError', null, error),
                ),
            );
            console.error('Error while fetching org unit list:', error);
        });

export const fetchOrgUnitsTypes = dispatch =>
    getRequest('/api/v2/orgunittypes/')
        .then(res => res.orgUnitTypes)
        .catch(error => {
            dispatch(
                enqueueSnackbar(
                    errorSnackBar('fetchOrgUnitTypesError', null, error),
                ),
            );
            console.error('Error while fetching org unit types list:', error);
        });

export const fetchOrgUnitsList = (dispatch, url) =>
    getRequest(url)
        .then(data => data)
        .catch(error => {
            dispatch(
                enqueueSnackbar(
                    errorSnackBar('fetchOrgUnitsError', null, error),
                ),
            );
            console.error('Error while fetching org unit list:', error);
        });

export const fetchAssociatedOrgUnits = (
    dispatch,
    source,
    orgUnit,
    fitToBounds = () => null,
) => {
    const url = `/api/orgunits/?linkedTo=${orgUnit.id}&linkValidated=all&linkSource=${source.id}&validation_status=all&withShapes=true`;

    return getRequest(url)
        .then(data => {
            fitToBounds();
            return {
                ...source,
                orgUnits: data.orgUnits,
            };
        })
        .catch(error => {
            dispatch(
                enqueueSnackbar(
                    errorSnackBar('fetchOrgUnitsError', null, error),
                ),
            );
            console.error('Error while fetching org unit list:', error);
        });
};

export const fetchSources = dispatch =>
    getRequest('/api/datasources/')
        .then(res => res.sources)
        .catch(error => {
            dispatch(
                enqueueSnackbar(
                    errorSnackBar('fetchSourcesError', null, error),
                ),
            );
            console.error('Error while fetching source list:', error);
        });

export const fetchOrgUnitDetail = (dispatch, orgUnitId) =>
    getRequest(`/api/orgunits/${orgUnitId}/`)
        .then(orgUnit => orgUnit)
        .catch(error => {
            dispatch(
                enqueueSnackbar(
                    errorSnackBar('fetchOrgUnitError', null, error),
                ),
            );
            console.error('Error while fetching org unit detail:', error);
        });

export const fetchInstanceDetail = (dispatch, instanceId) =>
    getRequest(`/api/instances/${instanceId}`)
        .then(instance => instance)
        .catch(error => {
            dispatch(
                enqueueSnackbar(
                    errorSnackBar('fetchInstanceError', null, error),
                ),
            );
            console.error('Error while fetching instance detail:', error);
        });

export const fetchAlgorithms = dispatch =>
    getRequest('/api/algorithms/')
        .then(algorithms => algorithms)
        .catch(error => {
            dispatch(
                enqueueSnackbar(
                    errorSnackBar('fetchAlgorithmsError', null, error),
                ),
            );
            console.error('Error while fetching algorithms list:', error);
        });

export const fetchLinkDetail = (dispatch, linkId) =>
    getRequest(`/api/links/${linkId}`)
        .then(linkDetail => linkDetail)
        .catch(error => {
            dispatch(
                enqueueSnackbar(
                    errorSnackBar('fetchLinkDetailError', null, error),
                ),
            );
            console.error('Error while fetching link detail:', error);
        });

export const deleteAlgorithmRun = (dispatch, runId) =>
    deleteRequest(`/api/algorithmsruns/${runId}/`)
        .then(res => res)
        .catch(error => {
            dispatch(enqueueSnackbar(errorSnackBar('deleteRun', null, error)));
            console.error('Error while delteing algorithms run:', error);
        });

export const runAlgorithm = (dispatch, runItem) =>
    putRequest('/api/algorithmsruns/0/', runItem)
        .then(res => res)
        .catch(error => {
            dispatch(enqueueSnackbar(errorSnackBar('deleteRun', null, error)));
            console.error('Error while deleting algorithms run:', error);
        });

export const createForm = (dispatch, formData) =>
    postRequest('/api/forms/', formData).catch(error => {
        dispatch(
            enqueueSnackbar(errorSnackBar('createFormError', null, error)),
        );
    });

export const updateForm = (dispatch, formId, formData) =>
    putRequest(`/api/forms/${formId}/`, formData).catch(error => {
        dispatch(
            enqueueSnackbar(errorSnackBar('updateFormError', null, error)),
        );
    });

export const createFormVersion = formVersionData => {
    const { data } = formVersionData;
    const fileData = { xls_file: formVersionData.xls_file };

    return postRequest('/api/formversions/', data, fileData).catch(error => {
        storeDispatch(
            enqueueSnackbar(
                errorSnackBar('createFormVersionError', null, error),
            ),
        );
    });
};

export const updateFormVersion = formVersion =>
    putRequest(`/api/formversions/${formVersion.id}/`, formVersion).catch(
        error => {
            storeDispatch(
                enqueueSnackbar(
                    errorSnackBar('updateFormVersionError', null, error),
                ),
            );
        },
    );

// TO-DO: replace all requests similar to this
export const fetchList = (
    dispatch,
    url,
    errorKeyMessage,
    consoleError,
    signal,
) =>
    getRequest(url, signal)
        .then(data => data)
        .catch(error => {
            dispatch(
                enqueueSnackbar(errorSnackBar(errorKeyMessage, null, error)),
            );
            console.error(`Error while fetching ${consoleError} list:`, error);
        });

export const useGetComments = params => {
    const { orgUnitId, offset, limit } = params;
    const url = offset
        ? `/api/comments/?object_pk=${orgUnitId}&content_type=iaso-orgunit&limit=${limit}&offset=${offset}`
        : `/api/comments/?object_pk=${orgUnitId}&content_type=iaso-orgunit&limit=${limit}`;

    return useSnackQuery(
        ['comments', params],
        async () => getRequest(url),
        undefined,
        { enabled: Boolean(orgUnitId) },
    );
};

export const sendComment = async comment =>
    postRequest('/api/comments/', comment);

export const fetchAlgorithmRuns = (dispatch, url = '/api/algorithmsruns/') =>
    getRequest(url)
        .then(data => data)
        .catch(error => {
            dispatch(
                enqueueSnackbar(
                    errorSnackBar('fetchAlgorithmsError', null, error),
                ),
            );
            console.error(`Error while fetching alogrithms:`, error);
        });

const dispatchSaveOrgUnit = dispatch => orgUnit =>
    patchRequest(`/api/orgunits/${orgUnit.id}/`, orgUnit)
        .then(savedOrgUnit => {
            dispatch(enqueueSnackbar(succesfullSnackBar()));
            return savedOrgUnit;
        })
        .catch(error => {
            dispatch(enqueueSnackbar(errorSnackBar(null, null, error)));
            console.error('Error while saving org unit detail:', error);
        });

export const saveOrgUnitWithDispatch = dispatchSaveOrgUnit(storeDispatch);

const dispatchSaveInstance = dispatch => instance =>
    patchRequest(`/api/instances/${instance.id}/`, instance)
        .then(savedInstance => {
            dispatch(enqueueSnackbar(succesfullSnackBar()));
            return savedInstance;
        })
        .catch(error => {
            dispatch(enqueueSnackbar(errorSnackBar(null, null, error)));
            console.error('Error while saving instance:', error);
        });

export const saveInstanceWithDispatch = dispatchSaveInstance(storeDispatch);

const lockInstance = dispatch => instance =>
    postRequest(`/api/instances/${instance.id}/add_lock/`)
        .then(savedInstance => {
            dispatch(enqueueSnackbar(succesfullSnackBar()));
            return savedInstance;
        })
        .catch(error => {
            dispatch(enqueueSnackbar(errorSnackBar(null, null, error)));
            console.error('Error while saving instance:', error);
        });

export const lockInstanceWithDispatch = lockInstance(storeDispatch);

export const cleanupParams = params => {
    const copy = { ...params };
    Object.keys(params).forEach(key => {
        if (copy[key] === undefined) {
            delete copy[key];
        }
    });
    return copy;
};

export const formatParams = params => {
    const copy = cleanupParams(params);
    if (params.pageSize) {
        copy.limit = params.pageSize;
        delete copy.pageSize;
    }
    if (params.accountId) {
        delete copy.accountId;
    }
    return copy;
};
