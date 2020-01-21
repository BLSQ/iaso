import {
    getRequest,
    patchRequest,
    putRequest,
    deleteRequest,
} from '../libs/Api';

import { enqueueSnackbar } from '../../../redux/snackBarsReducer';
import { succesfullSnackBar, errorSnackBar } from '../components/snackBars';

export const fetchOrgUnits = (dispatch, params) => getRequest(`/api/orgunits/?${params}`)
    .then(res => res.orgUnits)
    .catch((error) => {
        dispatch(enqueueSnackbar(errorSnackBar('fetchOrgUnitsError')));
        console.error('Error while fetching org unit list:', error);
        throw error;
    });

export const fetchSubOrgUnitsByType = (dispatch, params, orgUnitType) => getRequest(`/api/orgunits/?${params}`)
    .then(res => ({
        ...orgUnitType,
        orgUnits: res.orgUnits,
    }))
    .catch((error) => {
        dispatch(enqueueSnackbar(errorSnackBar('fetchOrgUnitsError')));
        console.error('Error while fetching org unit list:', error);
        throw error;
    });

export const fetchOrgUnitsTypes = dispatch => getRequest('/api/orgunittypes')
    .then(res => res.orgUnitTypes)
    .catch((error) => {
        dispatch(enqueueSnackbar(errorSnackBar('fetchOrgUnitTypesError')));
        console.error('Error while fetching org unit types list:', error);
        throw error;
    });

export const fetchSourceTypes = dispatch => getRequest('/api/sourcetypes/')
    .then(sourceTypes => sourceTypes)
    .catch((error) => {
        dispatch(enqueueSnackbar(errorSnackBar('fetchSourceTypesError')));
        console.error('Error while fetching source types list:', error);
        throw error;
    });

export const fetchSources = dispatch => getRequest('/api/datasources/')
    .then(res => res.sources)
    .catch((error) => {
        dispatch(enqueueSnackbar(errorSnackBar('fetchSourcesError')));
        console.error('Error while fetching source list:', error);
        throw error;
    });

export const fetchGroups = dispatch => getRequest('/api/groups/')
    .then(res => res.groups)
    .catch((error) => {
        dispatch(enqueueSnackbar(errorSnackBar('fetchGroupsError')));
        console.error('Error while fetching group list:', error);
        throw error;
    });

export const fetchDevices = dispatch => getRequest('/api/iasodevices')
    .then(devices => devices)
    .catch((error) => {
        dispatch(enqueueSnackbar(errorSnackBar('fetchDevicesError')));
        console.error('Error while fetching devices list:', error);
        throw error;
    });

export const fetchDevicesOwnerships = dispatch => getRequest('/api/iasodevicesownership')
    .then(devicesOwnerships => devicesOwnerships)
    .catch((error) => {
        dispatch(enqueueSnackbar(errorSnackBar('fetchDevicesOwnershipError')));
        console.error('Error while fetching devices ownership list:', error);
        throw error;
    });

export const fetchInstancesAsDict = (dispatch, url) => getRequest(url)
    .then(instances => instances)
    .catch((error) => {
        dispatch(enqueueSnackbar(errorSnackBar('fetchInstanceDictError')));
        console.error('Error while fetching instances list:', error);
        throw error;
    });

export const fetchInstancesAsSmallDict = (dispatch, url) => getRequest(`${url}&asSmallDict=true`)
    .then(instances => instances)
    .catch((error) => {
        dispatch(enqueueSnackbar(errorSnackBar('fetchInstanceLocationError')));
        console.error('Error while fetching instances locations list:', error);
        throw error;
    });


export const fetchOrgUnitsList = (dispatch, url) => getRequest(url)
    .then(data => data)
    .catch((error) => {
        dispatch(enqueueSnackbar(errorSnackBar('fetchOrgUnitsError')));
        console.error('Error while fetching org unit list:', error);
        throw error;
    });

export const fetchInstancesAsLocationsByForm = (dispatch, form, orgUnit) => {
    const url = `/api/instances?as_location=true&form_id=${form.id}&orgUnitId=${orgUnit.id}`;
    return getRequest(url)
        .then(data => ({
            ...form,
            instances: data.instances,
        }))
        .catch((error) => {
            dispatch(enqueueSnackbar(errorSnackBar('fetchInstanceLocationError')));
            console.error('Error while fetching instances locations list:', error);
            throw error;
        });
};

export const fetchAssociatedOrgUnits = (dispatch, source, orgUnit) => {
    const url = `/api/orgunits?linkedTo=${orgUnit.id}&linkValidated=False&linkSource=${source.id}&withShapes=true&validated=both`;
    return getRequest(url)
        .then(data => ({
            ...source,
            orgUnits: data.orgUnits,
        }))
        .catch((error) => {
            dispatch(enqueueSnackbar(errorSnackBar('fetchOrgUnitsError')));
            console.error('Error while fetching org unit list:', error);
            throw error;
        });
};

export const fetchAssociatedDataSources = (dispatch, orgUnitId) => {
    const url = `/api/datasources/?linkedTo=${orgUnitId}`;
    return getRequest(url)
        .then(res => res.sources)
        .catch((error) => {
            dispatch(enqueueSnackbar(errorSnackBar('fetchAssociatedDataSources')));
            console.error('Error while fetching associated data sources', error);
            throw error;
        });
};


export const fetchForms = (dispatch, url = '/api/forms/') => getRequest(url)
    .then(forms => forms)
    .catch((error) => {
        dispatch(enqueueSnackbar(errorSnackBar('fetchFormsError')));
        console.error('Error while fetching forms list:', error);
        throw error;
    });

export const fetchFormDetail = (dispatch, formId) => getRequest(`/api/forms/${formId}`)
    .then(form => form)
    .catch((error) => {
        dispatch(enqueueSnackbar(errorSnackBar('fetchFormError')));
        console.error('Error while fetching form detail:', error);
        throw error;
    });

export const fetchOrgUnitDetail = (dispatch, orgUnitId) => getRequest(`/api/orgunits/${orgUnitId}`)
    .then(orgUnit => orgUnit)
    .catch((error) => {
        dispatch(enqueueSnackbar(errorSnackBar('fetchOrgUnitError')));
        console.error('Error while fetching org unit detail:', error);
        throw error;
    });

export const saveOrgUnit = (dispatch, orgUnit) => patchRequest(`/api/orgunits/${orgUnit.id}/`, orgUnit)
    .then((savedOrgUnit) => {
        dispatch(enqueueSnackbar(succesfullSnackBar()));
        return savedOrgUnit;
    })
    .catch((error) => {
        dispatch(enqueueSnackbar(errorSnackBar()));
        console.error('Error while saving org unit detail:', error);
        throw error;
    });

export const fetchLogDetail = (dispatch, logId) => getRequest(`/api/logs/${logId}`)
    .then(logDetail => logDetail)
    .catch((error) => {
        dispatch(enqueueSnackbar(errorSnackBar('fetchLogDetailError')));
        console.error('Error while fetching log detail:', error);
        throw error;
    });

export const fetchInstanceDetail = (dispatch, instanceId) => getRequest(`/api/instances/${instanceId}`)
    .then(instance => instance)
    .catch((error) => {
        dispatch(enqueueSnackbar(errorSnackBar('fetchInstanceError')));
        console.error('Error while fetching instance detail:', error);
        throw error;
    });

export const saveLink = (dispatch, link) => patchRequest(`/api/links/${link.id}/`, link)
    .then((savedLink) => {
        dispatch(enqueueSnackbar(succesfullSnackBar()));
        return savedLink;
    })
    .catch((error) => {
        dispatch(enqueueSnackbar(errorSnackBar('saveLinkError')));
        console.error('Error occured while saving link:', error);
        throw error;
    });

export const fetchProfiles = dispatch => getRequest('/api/profiles')
    .then(profiles => profiles)
    .catch((error) => {
        dispatch(enqueueSnackbar(errorSnackBar('fetchProfilesError')));
        console.error('Error while fetching profiles list:', error);
        throw error;
    });

export const fetchIasoProfiles = dispatch => getRequest('/api/profiles')
    .then(response => response.profiles)
    .catch((error) => {
        dispatch(enqueueSnackbar(errorSnackBar('fetchProfilesError')));
        console.error('Error while fetching profiles list:', error);
        throw error;
    });

export const fetchAlgorithms = dispatch => getRequest('/api/algorithms')
    .then(algorithms => algorithms)
    .catch((error) => {
        dispatch(enqueueSnackbar(errorSnackBar('fetchAlgorithmsError')));
        console.error('Error while fetching algorithms list:', error);
        throw error;
    });

export const fetchLinkDetail = (dispatch, linkId) => getRequest(`/api/links/${linkId}`)
    .then(linkDetail => linkDetail)
    .catch((error) => {
        dispatch(enqueueSnackbar(errorSnackBar('fetchLinkDetailError')));
        console.error('Error while fetching link detail:', error);
        throw error;
    });

export const fetchAlgorithmRuns = dispatch => getRequest('/api/algorithmsruns')
    .then(algorithms => algorithms)
    .catch((error) => {
        dispatch(enqueueSnackbar(errorSnackBar('fetchAlgorithmsError')));
        console.error('Error while fetching algorithms list:', error);
        throw error;
    });

export const deleteAlgorithmRun = (dispatch, runId) => deleteRequest(`/api/algorithmsruns/${runId}/`)
    .then(res => res)
    .catch((error) => {
        dispatch(enqueueSnackbar(errorSnackBar('deleteRun')));
        console.error('Error while delteing algorithms run:', error);
        throw error;
    });

export const runAlgorithm = (dispatch, runItem) => putRequest('/api/algorithmsruns/0/', runItem)
    .then(res => res)
    .catch((error) => {
        dispatch(enqueueSnackbar(errorSnackBar('deleteRun')));
        console.error('Error while deleting algorithms run:', error);
        throw error;
    });
