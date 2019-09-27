import { getRequest, patchRequest } from '../libs/Api';

import { enqueueSnackbar } from '../../../redux/snackBarsReducer';
import { succesfullSnackBar, errorSnackBar } from '../components/snackBars';

const fetchOrgUnits = (dispatch, params) => getRequest(`/api/orgunits/?${params}`)
    .then(res => res.orgUnits)
    .catch((error) => {
        dispatch(enqueueSnackbar(errorSnackBar('fetchOrgUnitsError')));
        console.error('Error while fetching org unit list:', error);
        throw error;
    });

const fetchSubOrgUnitsByType = (dispatch, params, orgUnitType) => getRequest(`/api/orgunits/?${params}`)
    .then(res => ({
        ...orgUnitType,
        orgUnits: res.orgUnits,
    }))
    .catch((error) => {
        dispatch(enqueueSnackbar(errorSnackBar('fetchOrgUnitsError')));
        console.error('Error while fetching org unit list:', error);
        throw error;
    });

const fetchOrgUnitsTypes = dispatch => getRequest('/api/orgunittypes')
    .then(res => res.orgUnitTypes)
    .catch((error) => {
        dispatch(enqueueSnackbar(errorSnackBar('fetchOrgUnitTypesError')));
        console.error('Error while fetching org unit types list:', error);
        throw error;
    });

const fetchSourceTypes = dispatch => getRequest('/api/sourcetypes/')
    .then(sourceTypes => sourceTypes)
    .catch((error) => {
        dispatch(enqueueSnackbar(errorSnackBar('fetchSourceTypesError')));
        console.error('Error while fetching source types list:', error);
        throw error;
    });

const fetchSources = dispatch => getRequest('/api/datasources/')
    .then(res => res.sources)
    .catch((error) => {
        dispatch(enqueueSnackbar(errorSnackBar('fetchSourcesError')));
        console.error('Error while fetching source list:', error);
        throw error;
    });

const fetchDevices = dispatch => getRequest('/api/iasodevices')
    .then(devices => devices)
    .catch((error) => {
        dispatch(enqueueSnackbar(errorSnackBar('fetchDevicesError')));
        console.error('Error while fetching devices list:', error);
        throw error;
    });

const fetchDevicesOwnerships = dispatch => getRequest('/api/iasodevicesownership')
    .then(devicesOwnerships => devicesOwnerships)
    .catch((error) => {
        dispatch(enqueueSnackbar(errorSnackBar('fetchDevicesOwnershipError')));
        console.error('Error while fetching devices ownership list:', error);
        throw error;
    });

const fetchInstancesAsDict = (dispatch, url) => getRequest(url)
    .then(instances => instances)
    .catch((error) => {
        dispatch(enqueueSnackbar(errorSnackBar('fetchInstanceDictError')));
        console.error('Error while fetching instances list:', error);
        throw error;
    });

const fetchInstancesAsLocations = (dispatch, url) => getRequest(url)
    .then(instances => instances)
    .catch((error) => {
        dispatch(enqueueSnackbar(errorSnackBar('fetchInstanceLocationError')));
        console.error('Error while fetching instances locations list:', error);
        throw error;
    });

const fetchFormDetail = (dispatch, formId) => getRequest(`/api/forms/${formId}`)
    .then(form => form)
    .catch((error) => {
        dispatch(enqueueSnackbar(errorSnackBar('fetchFormError')));
        console.error('Error while fetching form detail:', error);
        throw error;
    });

const fetchOrgUnitDetail = (dispatch, orgUnitId) => getRequest(`/api/orgunits/${orgUnitId}`)
    .then(orgUnit => orgUnit)
    .catch((error) => {
        dispatch(enqueueSnackbar(errorSnackBar('fetchOrgUnitError')));
        console.error('Error while fetching org unit detail:', error);
        throw error;
    });

const saveOrgUnit = (dispatch, orgUnit) => patchRequest(`/api/orgunits/${orgUnit.id}/`, orgUnit)
    .then((savedOrgUnit) => {
        dispatch(enqueueSnackbar(succesfullSnackBar()));
        return savedOrgUnit;
    })
    .catch((error) => {
        dispatch(enqueueSnackbar(errorSnackBar()));
        console.error('Error while saving org unit detail:', error);
        throw error;
    });

const fetchLogDetail = (dispatch, logId) => getRequest(`/api/logs/${logId}`)
    .then(logDetail => logDetail)
    .catch((error) => {
        dispatch(enqueueSnackbar(errorSnackBar('fetchLogDetailError')));
        console.error('Error while fetching log detail:', error);
        throw error;
    });

const fetchInstanceDetail = (dispatch, instanceId) => getRequest(`/api/instances/${instanceId}`)
    .then(instance => instance)
    .catch((error) => {
        dispatch(enqueueSnackbar(errorSnackBar('fetchInstanceError')));
        console.error('Error while fetching instance detail:', error);
        throw error;
    });


export {
    fetchOrgUnitsTypes,
    fetchSubOrgUnitsByType,
    fetchSourceTypes,
    fetchSources,
    fetchOrgUnitDetail,
    fetchInstancesAsLocations,
    fetchInstancesAsDict,
    fetchFormDetail,
    saveOrgUnit,
    fetchLogDetail,
    fetchDevices,
    fetchDevicesOwnerships,
    fetchOrgUnits,
    fetchInstanceDetail,
};
