import React, { useEffect, useState, useCallback } from 'react';
import {
    getRequest,
    patchRequest,
    postRequest,
    putRequest,
    deleteRequest,
    restoreRequest,
} from '../libs/Api';
import { enqueueSnackbar } from '../redux/snackBarsReducer';
import { succesfullSnackBar, errorSnackBar } from '../constants/snackBars';
import { dispatch as storeDispatch } from '../redux/store';

export const fetchOrgUnits = (dispatch, params) =>
    getRequest(`/api/orgunits/?${params}`)
        .then(res => res.orgUnits)
        .catch(error => {
            dispatch(
                enqueueSnackbar(
                    errorSnackBar('fetchOrgUnitsError', null, error),
                ),
            );
            console.error('Error while fetching org unit list:', error);
            throw error;
        });

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
            throw error;
        });

export const fetchOrgUnitsTypes = dispatch =>
    getRequest('/api/orgunittypes/')
        .then(res => res.orgUnitTypes)
        .catch(error => {
            dispatch(
                enqueueSnackbar(
                    errorSnackBar('fetchOrgUnitTypesError', null, error),
                ),
            );
            console.error('Error while fetching org unit types list:', error);
            throw error;
        });
export const fetchGroups = (dispatch, defaultVersion = false) => {
    const url = `/api/groups/${defaultVersion ? '?&defaultVersion=true' : ''}`;
    return getRequest(url)
        .then(res => res.groups)
        .catch(error => {
            dispatch(
                enqueueSnackbar(errorSnackBar('fetchGroupsError', null, error)),
            );
            console.error('Error while fetching group list:', error);
            throw error;
        });
};

export const fetchDevices = dispatch =>
    getRequest('/api/devices/')
        .then(res => res.devices)
        .catch(error => {
            dispatch(
                enqueueSnackbar(
                    errorSnackBar('fetchDevicesError', null, error),
                ),
            );
            console.error('Error while fetching devices list:', error);
            throw error;
        });

export const fetchDevicesOwnerships = dispatch =>
    getRequest('/api/devicesownership/')
        .then(res => res.devicesownership)
        .catch(error => {
            dispatch(
                enqueueSnackbar(
                    errorSnackBar('fetchDevicesOwnershipError', null, error),
                ),
            );
            console.error(
                'Error while fetching devices ownership list:',
                error,
            );
            throw error;
        });

export const fetchInstancesAsDict = (dispatch, url) =>
    getRequest(url)
        .then(instances => instances)
        .catch(error => {
            dispatch(
                enqueueSnackbar(
                    errorSnackBar('fetchInstanceDictError', null, error),
                ),
            );
            console.error('Error while fetching instances list:', error);
            throw error;
        });

export const fetchInstancesAsSmallDict = (dispatch, url) =>
    getRequest(`${url}&asSmallDict=true`)
        .then(instances => instances)
        .catch(error => {
            dispatch(
                enqueueSnackbar(
                    errorSnackBar('fetchInstanceLocationError', null, error),
                ),
            );
            console.error(
                'Error while fetching instances locations list:',
                error,
            );
            throw error;
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
            throw error;
        });

export const fetchLogs = (dispatch, url) =>
    getRequest(url)
        .then(data => data)
        .catch(error => {
            dispatch(
                enqueueSnackbar(errorSnackBar('fetchLogsError', null, error)),
            );
            console.error('Error while fetching logs list:', error);
            throw error;
        });

export const fetchAllDataSources = (dispatch, url) =>
    getRequest(url)
        .then(data => data)
        .catch(error => {
            dispatch(
                enqueueSnackbar(
                    errorSnackBar('fetchDataSourcesError', null, error),
                ),
            );
            console.error('Error while fetching data sources list:', error);
            throw error;
        });

export const fetchInstancesAsLocationsByForm = (
    dispatch,
    form,
    orgUnit,
    fitToBounds = () => null,
) => {
    const url = `/api/instances/?as_location=true&form_id=${form.id}&orgUnitId=${orgUnit.id}`;
    return getRequest(url)
        .then(data => {
            fitToBounds();
            return {
                ...form,
                instances: data.instances,
            };
        })
        .catch(error => {
            dispatch(
                enqueueSnackbar(
                    errorSnackBar('fetchInstanceLocationError', null, error),
                ),
            );
            console.error(
                'Error while fetching instances locations list:',
                error,
            );
            throw error;
        });
};

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
            throw error;
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
            throw error;
        });

export const fetchAssociatedDataSources = (dispatch, orgUnitId) => {
    const url = `/api/datasources/?linkedTo=${orgUnitId}`;
    return getRequest(url)
        .then(res => res.sources)
        .catch(error => {
            dispatch(
                enqueueSnackbar(
                    errorSnackBar('fetchAssociatedDataSources', null, error),
                ),
            );
            console.error(
                'Error while fetching associated data sources',
                error,
            );
            throw error;
        });
};

export const fetchForms = (dispatch, url = '/api/forms') =>
    getRequest(url)
        .then(forms => forms)
        .catch(error => {
            dispatch(
                enqueueSnackbar(errorSnackBar('fetchFormsError', null, error)),
            );
            console.error('Error while fetching forms list:', error);
            throw error;
        });

export const fetchFormDetail = (dispatch, formId) =>
    getRequest(`/api/forms/${formId}/`)
        .then(form => form)
        .catch(error => {
            dispatch(
                enqueueSnackbar(errorSnackBar('fetchFormError', null, error)),
            );
            console.error('Error while fetching form detail:', error);
            throw error;
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
            throw error;
        });

export const saveOrgUnit = (dispatch, orgUnit) =>
    patchRequest(`/api/orgunits/${orgUnit.id}/`, orgUnit)
        .then(savedOrgUnit => {
            dispatch(enqueueSnackbar(succesfullSnackBar()));
            return savedOrgUnit;
        })
        .catch(error => {
            dispatch(enqueueSnackbar(errorSnackBar(null, null, error)));
            console.error('Error while saving org unit detail:', error);
            throw error;
        });

export const fetchLogDetail = (dispatch, logId) =>
    getRequest(`/api/logs/${logId}`)
        .then(logDetail => logDetail)
        .catch(error => {
            dispatch(
                enqueueSnackbar(
                    errorSnackBar('fetchLogDetailError', null, error),
                ),
            );
            console.error('Error while fetching log detail:', error);
            throw error;
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
            throw error;
        });

export const saveLink = (dispatch, link) =>
    patchRequest(`/api/links/${link.id}/`, link)
        .then(savedLink => {
            dispatch(enqueueSnackbar(succesfullSnackBar()));
            return savedLink;
        })
        .catch(error => {
            dispatch(
                enqueueSnackbar(errorSnackBar('saveLinkError', null, error)),
            );
            console.error('Error occured while saving link:', error);
            throw error;
        });

export const fetchProfiles = dispatch =>
    getRequest('/api/profiles')
        .then(profiles => profiles)
        .catch(error => {
            dispatch(
                enqueueSnackbar(
                    errorSnackBar('fetchProfilesError', null, error),
                ),
            );
            console.error('Error while fetching profiles list:', error);
            throw error;
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
            throw error;
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
            throw error;
        });

export const fetchLinks = (dispatch, url = '/api/links/') =>
    getRequest(url)
        .then(links => links)
        .catch(error => {
            dispatch(
                enqueueSnackbar(errorSnackBar('fetchLinksError', null, error)),
            );
            console.error('Error while fetching links:', error);
            throw error;
        });

export const deleteAlgorithmRun = (dispatch, runId) =>
    deleteRequest(`/api/algorithmsruns/${runId}/`)
        .then(res => res)
        .catch(error => {
            dispatch(enqueueSnackbar(errorSnackBar('deleteRun', null, error)));
            console.error('Error while delteing algorithms run:', error);
            throw error;
        });

export const runAlgorithm = (dispatch, runItem) =>
    putRequest('/api/algorithmsruns/0/', runItem)
        .then(res => res)
        .catch(error => {
            dispatch(enqueueSnackbar(errorSnackBar('deleteRun', null, error)));
            console.error('Error while deleting algorithms run:', error);
            throw error;
        });

export const fetchPeriods = (dispatch, formId) =>
    getRequest(`/api/periods/?form_id=${formId}`)
        .then(res => res.periods)
        .catch(error => {
            dispatch(
                enqueueSnackbar(
                    errorSnackBar('fetchPeriodsError', null, error),
                ),
            );
            console.error('Error while fetching periods list:', error);
            throw error;
        });

export const fetchProjects = dispatch =>
    getRequest('/api/projects/')
        .then(res => res.projects)
        .catch(error => {
            dispatch(
                enqueueSnackbar(
                    errorSnackBar('fetchProjectsError', null, error),
                ),
            );
            throw error;
        });

export const createForm = (dispatch, formData) =>
    postRequest('/api/forms/', formData).catch(error => {
        dispatch(
            enqueueSnackbar(errorSnackBar('createFormError', null, error)),
        );
        throw error;
    });

export const updateForm = (dispatch, formId, formData) =>
    putRequest(`/api/forms/${formId}/`, formData).catch(error => {
        dispatch(
            enqueueSnackbar(errorSnackBar('updateFormError', null, error)),
        );
        throw error;
    });

export const deleteForm = (dispatch, formId) =>
    deleteRequest(`/api/forms/${formId}/`).catch(error => {
        dispatch(
            enqueueSnackbar(errorSnackBar('deleteFormError', null, error)),
        );
        throw error;
    });

export const restoreForm = (dispatch, formId) =>
    restoreRequest(`/api/forms/${formId}/?only_deleted=1`).catch(error => {
        dispatch(
            enqueueSnackbar(errorSnackBar('archiveFormError', null, error)),
        );
        throw error;
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
        throw error;
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
            throw error;
        },
    );

export const fetchFormVersions = (dispatch, formId) => {
    const data = { form_id: formId };

    return postRequest('/api/formversions/', data).catch(error => {
        dispatch(
            enqueueSnackbar(
                errorSnackBar(
                    // @ts-ignore
                    isUpdate ? 'updateFormError' : 'createFormError',
                    null,
                    error,
                ),
            ),
        );
        throw error;
    });
};

export const fetchCompleteness = (dispatch, url) =>
    getRequest(url)
        .then(res => res.completeness)
        .catch(error => {
            dispatch(
                enqueueSnackbar(
                    errorSnackBar('fetchCompletenessError', null, error),
                ),
            );
            console.error(
                'Error while fetching  while fetching completness:',
                error,
            );
            throw error;
        });

export const fetchTasks = (dispatch, url) =>
    getRequest(url)
        .then(data => data)
        .catch(error => {
            dispatch(
                enqueueSnackbar(errorSnackBar('fetchTasksError', null, error)),
            );
            console.error('Error while fetching tasks list:', error);
            throw error;
        });

export const fetchDevicesAsDict = (dispatch, url) =>
    getRequest(url)
        .then(data => data)
        .catch(error => {
            dispatch(
                enqueueSnackbar(
                    errorSnackBar('fetchDevicesError', null, error),
                ),
            );
            console.error('Error while fetching devices list:', error);
            throw error;
        });

export const createDataSource = (dispatch, dataSource) =>
    postRequest('/api/datasources/', dataSource).catch(error => {
        dispatch(
            enqueueSnackbar(
                errorSnackBar('createDataSourceError', null, error),
            ),
        );
        throw error;
    });

export const updateDataSource = (dispatch, dataSourceId, dataSource) =>
    putRequest(`/api/datasources/${dataSourceId}/`, dataSource).catch(error => {
        dispatch(
            enqueueSnackbar(
                errorSnackBar('updateDataSourceError', null, error),
            ),
        );
        throw error;
    });

// eslint-disable-next-line camelcase
export const updateDefaultSource = (dispatch, accountId, default_version) =>
    putRequest(`/api/accounts/${accountId}/`, {
        default_version,
    }).catch(error => {
        dispatch(
            enqueueSnackbar(
                errorSnackBar('updateDefaultSourceError', null, error),
            ),
        );
        throw error;
    });

// TO-DO: replace all requests similar to this
export const fetchList = (dispatch, url, errorKeyMessage, consoleError) =>
    getRequest(url)
        .then(data => data)
        .catch(error => {
            dispatch(
                enqueueSnackbar(errorSnackBar(errorKeyMessage, null, error)),
            );
            console.error(`Error while fetching ${consoleError} list:`, error);
            throw error;
        });

/**
 * @typedef {Object} handlerParams
 * @property {queryParams} requestParams - params that will be passed to the API caller
 * @property {string} errorKeyMessage - The message displayed in the error snackbar
 * @property {string} consoleError - the message to embed in the console's error message
 * @property {boolean=} disableSuccessSnackBar - will not display snack bar if true
 */

/**
 * @typedef {Object} queryParams
 * @property {string} url - endpoint's url
 * @property {Object=} body - request's body
 * @property {object=} fileData - object to pass when using multipart mode
 */

/**
 *
 * @param {function} dispatch - a redux dispatch function
 *
 */
// currying to allow testing calls to dispatch
// TODO figure out how to document currying with JSDocs
export const requestHandler = dispatch => request => params => {
    const { url, body, fileData } = params.requestParams;
    return request(url, body, fileData)
        .then(data => {
            if (!params.disableSuccessSnackBar) {
                dispatch(enqueueSnackbar(succesfullSnackBar()));
            }
            return data;
        })
        .catch(error => {
            dispatch(
                enqueueSnackbar(
                    errorSnackBar(
                        params.errorKeyMessage,
                        params.errorMessageObject ?? null,
                        // null,
                        error,
                    ),
                ),
            );
            console.error(
                `Error with API call ${params.consoleError} :`,
                error,
            );
            throw error;
        });
};
/**
 * @example const genericHandler = requestHandler(dispatch);
 * const putHandler = genericHandler(putRequest);
 * const result = await putHandler(params);
 */
export const iasoGetRequest = requestHandler(storeDispatch)(getRequest);
export const iasoPostRequest = requestHandler(storeDispatch)(postRequest);
export const iasoPutRequest = requestHandler(storeDispatch)(putRequest);
export const iasoPatchRequest = requestHandler(storeDispatch)(patchRequest);
export const iasoDeleteRequest = requestHandler(storeDispatch)(deleteRequest);
export const iasoRestoreRequest = requestHandler(storeDispatch)(restoreRequest);

/**
 *
 * @typedef APIHookResponse
 * @property {boolean} - isLoading
 * @property {boolean} - isError
 * @property {any} - result
 */

/**
 *
 * @param {function} request - IMPORTANT: must be wrapped in useCallback
 * @param {Object} [params={trigger:true,additionalDependencies:[]}]
 * @param {boolean} [params.trigger=true]
 * @param {any[]} [params.additionalDependencies=[]]
 * @returns {APIHookResponse} - { isLoading: boolean, isError: boolean, data: any }
 */

const defaultHookParams = { preventTrigger: false, additionalDependencies: [] };

export const useAPI = (request, requestArgs, params = defaultHookParams) => {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);
    // useRef to avoid memory leak if user navigates away while async action not completed
    // credit: https://medium.com/wesionary-team/how-to-fix-memory-leak-issue-in-react-js-using-hook-a5ecbf9becf8
    const mountedRef = React.useRef();

    useEffect(() => {
        mountedRef.current = true;
        const executeRequest = async () => {
            if (params.preventTrigger) {
                return;
            }
            setIsLoading(true);
            try {
                const response = await request(requestArgs);
                if (mountedRef.current) {
                    setData(response);
                    setIsLoading(false);
                }
            } catch (e) {
                if (mountedRef.current) {
                    setIsLoading(false);
                    setIsError(true);
                }
            }
        };
        executeRequest();
        return () => {
            mountedRef.current = false;
        };
    }, [
        ...(params.additionalDependencies ?? []),
        request,
        params.preventTrigger,
        params.trigger,
        requestArgs,
    ]);

    const result = { data, isLoading, isError };
    return result;
};

export const useGetComments = ({
    orgUnitId,
    offset,
    limit,
    refreshTrigger,
}) => {
    const url = offset
        ? `/api/comments/?object_pk=${orgUnitId}&content_type=iaso-orgunit&limit=${limit}&offset=${offset}`
        : `/api/comments/?object_pk=${orgUnitId}&content_type=iaso-orgunit&limit=${limit}`;
    const request = useCallback(
        async () =>
            iasoGetRequest({
                disableSuccessSnackBar: true,
                requestParams: {
                    url,
                },
            }),
        [url, refreshTrigger],
    );
    const result = useAPI(request, null, {
        preventTrigger: Boolean(!orgUnitId),
    });
    return result;
};

export const postComment = async comment => {
    const result = await iasoPostRequest({
        requestParams: { url: '/api/comments/', body: comment },
    });
    return result;
};

export const fetchAlgorithmRuns = (dispatch, url = '/api/algorithmsruns/') =>
    iasoGetRequest({
        disableSuccessSnackBar: true,
        errorKeyMessage: 'fetchAlgorithmsError',
        requestParams: {
            url,
        },
    });
