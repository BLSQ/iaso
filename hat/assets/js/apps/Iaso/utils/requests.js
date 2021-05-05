import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
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

export const fetchSourceTypes = dispatch =>
    getRequest('/api/sourcetypes/')
        .then(sourceTypes => sourceTypes)
        .catch(error => {
            dispatch(
                enqueueSnackbar(
                    errorSnackBar('fetchSourceTypesError', null, error),
                ),
            );
            console.error('Error while fetching source types list:', error);
            throw error;
        });

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
    const url = `/api/instances?as_location=true&form_id=${form.id}&orgUnitId=${orgUnit.id}`;
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
    const url = `/api/orgunits?linkedTo=${orgUnit.id}&linkValidated=False&linkSource=${source.id}&validation_status=all`;

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

export const fetchForms = (dispatch, url = '/api/forms/') =>
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

export const fetchAlgorithmRuns = (dispatch, url = '/api/algorithmsruns/') =>
    getRequest(url)
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

export const createFormVersion = (dispatch, formVersionData, isUpdate) => {
    const data = { form_id: formVersionData.form_id };
    const fileData = { xls_file: formVersionData.xls_file };

    return postRequest('/api/formversions/', data, fileData).catch(error => {
        dispatch(
            enqueueSnackbar(
                errorSnackBar(
                    isUpdate ? 'updateFormError' : 'createFormError',
                    null,
                    error,
                ),
            ),
        );
        throw error;
    });
};

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
 * @property {string} url - endpoint's url
 * @property {Object=} body - request's body
 * @property {string} errorKeyMessage - The message displayed in the error snackbar
 * @property {string} consoleError - the message to embed in the console's error message
 * @property {object=} fileData - object to pass when using multipart mode
 * @property{function} dispatch - redux's dispatch function
 */

/**
 * @typedef {Object} makeHookParams
 * @property {string} url - endpoint's url
 * @property {string} errorKeyMessage - A key to embed in error snack bar massage
 * @property {string} consoleError - the message to embed in the console's error message
 */

/**
 *
 * @param {handlerParams} params { url: string, errorKeyMessage: string, consoleError: string }
 * @returns {object} API response
 */
export const getRequestHandler = params =>
    getRequest(params.url)
        .then(data => {
            params.dispatch(enqueueSnackbar(succesfullSnackBar()));
            return data;
        })
        .catch(error => {
            params.dispatch(
                enqueueSnackbar(
                    errorSnackBar(params.errorKeyMessage, null, error),
                ),
            );
            console.error(
                `Error while fetching ${params.consoleError} list:`,
                error,
            );
            throw error;
        });
// TODO see if it's better to make a separate type for requests with and without body
/**
 *
 * @param {handlerParams} params { url: string, body: object, errorKeyMessage: string, consoleError: string, fileData?: object }
 * @returns {object} API response
 */

export const postRequestHandler = params =>
    postRequest(params.url, params.body, params.fileData ?? {})
        .then(data => {
            params.dispatch(enqueueSnackbar(succesfullSnackBar()));
            return data;
        })
        .catch(error => {
            params.dispatch(
                enqueueSnackbar(
                    errorSnackBar(params.errorKeyMessage, null, error),
                ),
            );
            console.error(
                `Error while posting ${params.consoleError} :`,
                error,
            );
            throw error;
        });

/**
 *
 * @param {handlerParams} params { url: string, body: object, errorKeyMessage: string, consoleError: string }
 * @returns {object} API response
 */

export const putRequestHandler = params =>
    putRequest(params.url, params.body)
        .then(data => {
            params.dispatch(enqueueSnackbar(succesfullSnackBar()));
            return data;
        })
        .catch(error => {
            params.dispatch(
                enqueueSnackbar(
                    errorSnackBar(params.errorKeyMessage, null, error),
                ),
            );
            console.error(
                `Error while putting ${params.consoleError} :`,
                error,
            );
            throw error;
        });

/**
 *
 * @param {handlerParams} params { url: string, body: object, errorKeyMessage: string, consoleError: string }
 * @returns {object} API response
 */
export const patchRequestHandler = params =>
    patchRequest(params.url, params.body)
        .then(data => {
            params.dispatch(enqueueSnackbar(succesfullSnackBar()));
            return data;
        })
        .catch(error => {
            params.dispatch(
                enqueueSnackbar(
                    errorSnackBar(params.errorKeyMessage, null, error),
                ),
            );
            console.error(
                `Error while posting ${params.consoleError} :`,
                error,
            );
            throw error;
        });

/**
 *
 * @param {handlerParams} params { url: string, errorKeyMessage: string, consoleError: string }
 * @returns {Promise<void>} API response
 */
export const deleteRequestHandler = params =>
    deleteRequest(params.url)
        .then(() => {
            params.dispatch(enqueueSnackbar(succesfullSnackBar()));
        })
        .catch(error => {
            params.dispatch(
                enqueueSnackbar(
                    errorSnackBar(params.errorKeyMessage, null, error),
                ),
            );
            console.error(
                `Error while deleting ${params.consoleError} :`,
                error,
            );
            throw error;
        });

/**
 *
 * @param {handlerParams} params { url: string, errorKeyMessage: string, consoleError: string }
 * @returns {Promise<void>} API response
 */
export const restoreRequestHandler = params =>
    restoreRequest(params.url)
        .then(() => {
            params.dispatch(enqueueSnackbar(succesfullSnackBar()));
        })
        .catch(error => {
            params.dispatch(
                enqueueSnackbar(
                    errorSnackBar(params.errorKeyMessage, null, error),
                ),
            );
            console.error(
                `Error while restoring ${params.consoleError} :`,
                error,
            );
            throw error;
        });

/**
 * A function that returns a hook. The return hook should be named 'useXXX' to allow React to recognize it as such
 * The returned takes a trigger that can be used to make the request conditional (to the update of a state value for example).
 * @param {makeHookParams} params - url: string, errorKeyMessage: string, consoleError: string
 * @returns {function} a react hook that takes a trigger, makes a get request and returns the response
 *
 * @example const useGetRequest = makeGetRequestHook({url : '/api/url', errorKeyMessage : 'hook_test_error', consoleError: 'Hook Test Error '});
 * // In your component;
 * useGetRequest(trigger)
 */

// TODO confirm trigger with use
export const makeGetRequestHook = params => {
    return trigger => {
        const dispatch = useDispatch();
        const [result, setResult] = useState(null);
        useEffect(() => {
            // declaring async function inside useEffect to be able to use async code
            const executeRequest = async () => {
                if (trigger) {
                    const response = await getRequestHandler({
                        url: params.url,
                        errorKeyMessage: params.errorKeyMessage,
                        consoleError: params.consoleError,
                        dispatch,
                    });
                    if (response) setResult(response);
                }
            };
            executeRequest();
        }, [trigger, dispatch]);
        return result;
    };
};

/**
 * A function that returns a hook. The return hook should be named 'useXXX' to allow React to recognize it as such
 * @param {makeHookParams} params - url: string, errorKeyMessage: string, consoleError: string
 * @returns {function} a react hook that takes a requestBody, an optional fieldData object, then makes a post request and returns the response
 *
 * @example const usePostRequest = makePostRequestHook({url : '/api/url', errorKeyMessage : 'hook_test_error', consoleError: 'Hook Test Error '});
 * // In your component;
 * usePostRequest(requestBody)
 */
export const makePostRequestHook = params => {
    return (requestBody, fileData = {}) => {
        const dispatch = useDispatch();
        const [result, setResult] = useState(null);
        useEffect(() => {
            // declaring async function inside useEffect to be able to use async code
            const executeRequest = async () => {
                if (requestBody) {
                    const response = await postRequestHandler({
                        url: params.url,
                        body: requestBody,
                        errorKeyMessage: params.errorKeyMessage,
                        consoleError: params.consoleError,
                        fileData,
                        dispatch,
                    });
                    if (response) setResult(response);
                }
            };
            executeRequest();
        }, [requestBody, dispatch]);
        return result;
    };
};

/**
 * A function that returns a hook. The return hook should be named 'useXXX' to allow React to recognize it as such
 * @param {makeHookParams} params - url: string, errorKeyMessage: string, consoleError: string
 * @returns {function} a react hook that takes a requestBody, then makes a put request and returns the response
 *
 * @example const usePutRequest = makePutRequestHook({url : '/api/url', errorKeyMessage : 'hook_test_error', consoleError: 'Hook Test Error '});
 * // In your component;
 * usePutRequest(requestBody)
 */

export const makePutRequestHook = params => {
    return requestBody => {
        const dispatch = useDispatch();
        const [result, setResult] = useState(null);
        useEffect(() => {
            // declaring async function inside useEffect to be able to use async code
            const executeRequest = async () => {
                if (requestBody) {
                    const response = await putRequestHandler({
                        url: params.url,
                        body: requestBody,
                        errorKeyMessage: params.errorKeyMessage,
                        consoleError: params.consoleError,
                        dispatch,
                    });
                    if (response) setResult(response);
                }
            };
            executeRequest();
        }, [requestBody, dispatch]);
        return result;
    };
};

/**
 * A function that returns a hook. The return hook should be named 'useXXX' to allow React to recognize it as such
 * @param {makeHookParams} params - url: string, errorKeyMessage: string, consoleError: string
 * @returns {function} a react hook that takes a requestBody, then makes a patch request and returns the response
 *
 * @example const usePatchRequest = makePatchRequestHook({url : '/api/url', errorKeyMessage : 'hook_test_error', consoleError: 'Hook Test Error '});
 * // In your component;
 * usePatchRequest(requestBody)
 */

export const makePatchRequestHook = params => {
    return requestBody => {
        const dispatch = useDispatch();
        const [result, setResult] = useState(null);
        useEffect(() => {
            // declaring async function inside useEffect to be able to use async code
            const executeRequest = async () => {
                if (requestBody) {
                    const response = await patchRequestHandler({
                        url: params.url,
                        body: requestBody,
                        errorKeyMessage: params.errorKeyMessage,
                        consoleError: params.consoleError,
                        dispatch,
                    });
                    if (response) setResult(response);
                }
            };
            executeRequest();
        }, [requestBody, dispatch]);
        return result;
    };
};

/**
 * A function that returns a hook. The return hook should be named 'useXXX' to allow React to recognize it as such
 * The returned takes a trigger that can be used to make the request conditional (to the update of a state value for example).
 * @param {makeHookParams} params - url: string, errorKeyMessage: string, consoleError: string
 * @returns {function} a react hook that takes a trigger, makes a delete request and returns the response
 *
 * @example const useDeleteRequest = makeDeleteRequestHook({url : '/api/url', errorKeyMessage : 'hook_test_error', consoleError: 'Hook Test Error '});
 * // In your component;
 * useDeleteRequest(trigger)
 */
// TODO confirm trigger with use
// TODO add return value when refactoring to take error management out of components
export const makeDeleteRequestHook = params => {
    return trigger => {
        const dispatch = useDispatch();
        useEffect(() => {
            // declaring async function inside useEffect to be able to use async code
            const executeRequest = async () => {
                if (trigger) {
                    await deleteRequestHandler({
                        url: params.url,
                        errorKeyMessage: params.errorKeyMessage,
                        consoleError: params.consoleError,
                        dispatch,
                    });
                }
            };
            executeRequest();
        }, [trigger, dispatch]);
    };
};

/**
 * A function that returns a hook. The return hook should be named 'useXXX' to allow React to recognize it as such
 * The returned takes a trigger that can be used to make the request conditional (to the update of a state value for example).
 * @param {makeHookParams} params - url: string, errorKeyMessage: string, consoleError: string
 * @returns {function} a react hook that takes a trigger, makes a restore request and returns the response
 *
 * @example const useRestoreRequest = makeRestoreRequestHook({url : '/api/url', errorKeyMessage : 'hook_test_error', consoleError: 'Hook Test Error '});
 * // In your component;
 * useRestoreRequest(trigger)
 */
// TODO confirm trigger with use
// TODO add return value when refactoring to take error management out of components
export const makeRestoreRequestHook = params => {
    return trigger => {
        const dispatch = useDispatch();
        useEffect(() => {
            // declaring async function inside useEffect to be able to use async code
            const executeRequest = async () => {
                if (trigger) {
                    await restoreRequestHandler({
                        url: params.url,
                        errorKeyMessage: params.errorKeyMessage,
                        consoleError: params.consoleError,
                        dispatch,
                    });
                }
            };
            executeRequest();
        }, [trigger, dispatch]);
    };
};
