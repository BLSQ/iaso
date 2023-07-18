/* eslint-disable no-else-return */
import React from 'react';
import { useMutation } from 'react-query';
import { useDispatch, useSelector } from 'react-redux';
import { getRequest, iasoFetch, postRequest, putRequest } from 'Iaso/libs/Api';
import { useSnackMutation, useSnackQuery } from 'Iaso/libs/apiHooks';
import { dispatch as storeDispatch } from '../../redux/store';
import { enqueueSnackbar } from '../../redux/snackBarsReducer';
import { errorSnackBar } from '../../constants/snackBars';
import snackBarMessages from '../../components/snackBars/messages';
import { fetchCurrentUser } from '../users/actions';
import { getValues } from '../../hooks/form';
import MESSAGES from './messages';

/**
 *
 * @param {Object} requestBody - request's body
 * @param {number} requestBody.source_id
 * @param {number} requestBody.source_version_number
 * @param {string} requestBody.dhis_name
 * @param {string} requestBody.dhis_url
 * @param {string} requestBody.dhis_login
 * @param {string} requestBody.dhis_password
 * @param {boolean} requestBody.force - should be false
 * @param {boolean} requestBody.validate_status
 * @param {boolean} requestBody.continue_on_error
 * @returns {Object} request's response
 */

export const sendDhisOuImporterRequest = async requestBody =>
    postRequest('/api/dhis2ouimporter/', requestBody);

export const postGeoPkg = async request => {
    const file = { file: request.file };
    const body = { ...request };
    delete body.file;
    return postRequest('/api/tasks/create/importgpkg/', body, file);
};

const getOrgUnitTypes = async () => {
    return getRequest('/api/v2/orgunittypes/');
};

export const useOrgUnitTypes = () => {
    return useSnackQuery(['orgUnitTypes'], getOrgUnitTypes, undefined, {
        select: data =>
            data.orgUnitTypes.map(orgUnitType => ({
                value: orgUnitType.id,
                label: orgUnitType.name,
            })),
    });
};

const getDataSourceVersions = async () => {
    return getRequest('/api/sourceversions/');
};

// Func to compare version to  order them
// string.localeCompare allow us to have case-insensitive sorting and to take accents into account
const compareVersions = (a, b) => {
    const comparison = a.data_source_name.localeCompare(
        b.data_source_name,
        undefined,
        {
            sensitivity: 'accent',
        },
    );
    if (comparison === 0) {
        if (a.number < b.number) {
            return -1;
        } else if (a.number > b.number) {
            return 1;
        } else {
            return 0;
        }
    }
    return comparison;
};

export const useDataSourceVersions = () => {
    return useSnackQuery(
        ['dataSourceVersions'],
        getDataSourceVersions,
        undefined,
        {
            select: data => {
                return data.versions
                    .map(version => {
                        return {
                            id: version.id.toString(),
                            data_source: version.data_source,
                            data_source_name: version.data_source_name,
                            is_default: version.is_default,
                            number: version.number,
                        };
                    })
                    .sort(compareVersions);
            },
        },
    );
};

const adaptForApi = data => {
    const adaptedData = { ...data };
    if (data.ref_status === 'ALL') {
        adaptedData.ref_status = '';
    }
    if (data.source_status === 'ALL') {
        adaptedData.source_status = '';
    }
    return adaptedData;
};

export const postToDHIS2 = async data => {
    const adaptedData = adaptForApi(data);
    return postRequest('/api/sourceversions/export_dhis2/', adaptedData);
};

export const convertExportDataToURL = data => {
    const up = new URLSearchParams();

    Object.entries(data).forEach(([k, v]) => {
        if (Array.isArray(v)) {
            v.forEach(p => up.append(k, p));
        } else if (v !== undefined && v !== null) {
            up.append(k, v);
        }
    });

    return `/api/sourceversions/diff.csv/?${up.toString()}`;
};

export const csvPreview = async data => {
    const adaptedData = adaptForApi(data);
    const url = convertExportDataToURL(adaptedData);
    const requestSettings = {
        method: 'GET',
        headers: { 'Sec-fetch-Dest': 'document', 'Content-Type': 'text/csv' },
    };
    // using iasoFetch, so I can convert response to text i.o. json
    return iasoFetch(url, requestSettings)
        .then(result => result.text())
        .catch(error => {
            storeDispatch(
                enqueueSnackbar(
                    errorSnackBar(
                        'iaso.snackBar.generateCSVError',
                        snackBarMessages.generateCSVError,
                        error,
                    ),
                ),
            );
            console.error(`Error while fetching CSV:`, error);
        });
};

export const updateDefaultDataSource = ([accountId, defaultVersionId]) =>
    putRequest(`/api/accounts/${accountId}/`, {
        default_version: defaultVersionId,
    });

/**
 * Save DataSource on server
 * If the data source is marked as default this necessitates a separate request to
 * save and then we refetch the user since it's updated
 * Mark errors in form.
 * @param {func} setFieldErrors
 */
export const useSaveDataSource = setFieldErrors => {
    const [isSaving, setIsSaving] = React.useState(false);
    const currentUser = useSelector(state => state.users.current);
    const dispatch = useDispatch();

    const { mutateAsync: saveMutation } = useSnackMutation(
        campaignData =>
            putRequest(`/api/datasources/${campaignData.id}/`, campaignData),
        undefined,
        snackBarMessages.updateDataSourceError,
    );
    const { mutateAsync: createMutation } = useSnackMutation(
        campaignData => postRequest('/api/datasources/', campaignData),
        undefined,
        snackBarMessages.createDataSourceError,
    );
    const saveDefaultDataSourceMutation = useSnackMutation(
        updateDefaultDataSource,
        false,
        snackBarMessages.updateDefaultSourceError,
    );

    const saveDataSource = async form => {
        setIsSaving(true);
        // eslint-disable-next-line camelcase
        const { is_default_source, ...campaignData } = getValues(form);

        try {
            if (campaignData.id) {
                await saveMutation(campaignData);
            } else {
                await createMutation(campaignData);
            }
        } catch (error) {
            // Update error on forms
            if (error.status === 400) {
                Object.entries(error.details).forEach(
                    ([errorKey, errorMessages]) => {
                        setFieldErrors(errorKey, errorMessages);
                    },
                );
            }
            setIsSaving(false);
        }

        // eslint-disable-next-line camelcase
        if (is_default_source && form.default_version_id.value) {
            await saveDefaultDataSourceMutation.mutateAsync([
                currentUser.account.id,
                form.default_version_id.value,
            ]);
            dispatch(fetchCurrentUser());
        }
        setIsSaving(false);
    };
    return { saveDataSource, isSaving };
};

export const useCheckDhis2Mutation = setFieldErrors =>
    useMutation(
        form =>
            postRequest(`/api/datasources/check_dhis2/`, {
                data_source: form.id.value,
                dhis2_url: form.credentials.value.dhis_url,
                dhis2_login: form.credentials.value.dhis_login,
                dhis2_password: form.credentials.value.dhis_password,
            }),
        {
            onSuccess: () => {
                // Clean errors
                [
                    'credentials',
                    'credentials_dhis2_url',
                    'credentials_dhis2_login',
                    'credentials_dhis2_password',
                ].forEach(key => setFieldErrors(key, []));
            },
            onError: error => {
                if (error.status === 400)
                    Object.entries(error.details).forEach(
                        ([errorKey, errorMessages]) => {
                            setFieldErrors(
                                `credentials_${errorKey}`,
                                errorMessages,
                            );
                        },
                    );
                else {
                    setFieldErrors('credentials', [
                        error.details?.detail ?? 'Test failed',
                    ]);
                }
            },
        },
    );

export const useDataSourceForVersion = sourceVersion =>
    useSnackQuery(
        ['dataSources'],
        () => getRequest('/api/datasources/'),
        snackBarMessages.fetchSourcesError,
        {
            select: data => {
                if (sourceVersion) {
                    const source = data.sources.find(
                        s => s.id === sourceVersion.data_source,
                    );
                    return source;
                }
                return null;
            },
            staleTime: 60000,
        },
    );
export const useDataSourceAsDropDown = () =>
    useSnackQuery(
        ['dataSources'],
        () => getRequest('/api/datasources/'),
        snackBarMessages.fetchSourcesError,
        {
            select: data =>
                data?.sources.map(datasource => ({
                    label: datasource.name,
                    value: datasource.id,
                })) ?? [],
            staleTime: 60000,
        },
    );

export const useCopyDataSourceVersion = () => {
    return useSnackMutation(
        ({
            dataSourceId,
            dataSourceVersionNumber,
            destinationSourceId,
            destinationVersionNumber,
        }) => {
            return postRequest('/api/copyversion/', {
                source_source_id: dataSourceId,
                source_version_number: dataSourceVersionNumber,
                destination_source_id: destinationSourceId,
                destination_version_number: destinationVersionNumber,
                force: false,
            });
        },
        MESSAGES.copyVersionSuccessMessage,
        MESSAGES.copyVersionSuccessMessage,
        'dataSources',
    );
};
const saveSourceVersion = newSourceVersion => {
    const url = '/api/sourceversions/';
    return postRequest(url, {
        description: newSourceVersion.description,
        data_source_id: newSourceVersion.dataSourceId,
    });
};

export const useCreateSourceVersion = () => {
    return useSnackMutation({
        mutationFn: saveSourceVersion,
        snackErrorMsg: MESSAGES.newEmptyVersionError,
        snackSuccessMessage: MESSAGES.newEmptyVersionSavedSuccess,
        invalidateQueryKey: 'dataSourceVersions',
    });
};

const updateSourceVersion = async ({
    sourceVersionId,
    description,
    dataSourceId,
    sourceVersionNumber,
}) => {
    return putRequest(`/api/sourceversions/${sourceVersionId}/`, {
        id: sourceVersionId,
        description,
        data_source: dataSourceId,
        number: sourceVersionNumber,
    });
};

export const usePutSourceVersion = () => {
    return useSnackMutation(
        ({ sourceVersionId, description, dataSourceId, sourceVersionNumber }) =>
            updateSourceVersion({
                sourceVersionId,
                description,
                dataSourceId,
                sourceVersionNumber,
            }),
        undefined,
        undefined,
        [['dataSourceVersions'], ['dataSources']],
    );
};
