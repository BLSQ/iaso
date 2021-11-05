import React from 'react';
import { useMutation, useQuery } from 'react-query';
import { useDispatch, useSelector } from 'react-redux';
import { iasoGetRequest, iasoPostRequest } from '../../utils/requests';
import { dispatch as storeDispatch } from '../../redux/store';
import { getRequest, iasoFetch, postRequest, putRequest } from '../../libs/Api';
import { enqueueSnackbar } from '../../redux/snackBarsReducer';
import { errorSnackBar } from '../../constants/snackBars';
import snackBarMessages from '../../components/snackBars/messages';
import { fetchCurrentUser } from '../users/actions';
import { useSnackMutation, useSnackQuery } from '../../libs/apiHooks';
import { getValues } from '../../hooks/form';

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
    iasoPostRequest({
        requestParams: { url: '/api/dhis2ouimporter/', body: requestBody },
        errorKeyMessage: 'dhisouimporterError',
        consoleError: 'DHIS OU Importer',
    });

export const postGeoPkg = async request => {
    const file = { file: request.file };
    const body = { ...request };
    delete body.file;
    return iasoPostRequest({
        requestParams: {
            url: '/api/tasks/create/importgpkg/',
            body,
            fileData: file,
        },
    });
};

const getOrgUnitTypes = async () => {
    return iasoGetRequest({
        requestParams: { url: '/api/orgunittypes/' },
        disableSuccessSnackBar: true,
    });
};

export const useOrgUnitTypes = () => {
    return useQuery(['orgUnitTypes'], getOrgUnitTypes, {
        select: data =>
            data.orgUnitTypes.map(orgUnitType => ({
                value: orgUnitType.id,
                label: orgUnitType.name,
            })),
    });
};

const getDataSourceVersions = async () => {
    return iasoGetRequest({
        requestParams: { url: '/api/sourceversions/' },
        disableSuccessSnackBar: true,
    });
};

export const useDataSourceVersions = () => {
    return useQuery(['dataSourceVersions'], getDataSourceVersions, {
        select: data => {
            return data.versions.map(version => {
                return {
                    id: version.id,
                    data_source: version.data_source,
                    data_source_name: version.data_source_name,
                    is_default: version.is_default,
                    number: version.number,
                };
            });
        },
    });
};

const adaptForApi = data => {
    const adaptedData = { ...data };
    if (data.ref_status === 'ALL') {
        adaptedData.ref_status = '';
    }
    return adaptedData;
};

export const postToDHIS2 = async data => {
    const adaptedData = adaptForApi(data);
    return iasoPostRequest({
        requestParams: {
            url: '/api/sourceversions/export_dhis2/',
            body: adaptedData,
        },
        errorKeyMessage: 'iaso.snackBar.exportToDHIS2Error',
        errorMessageObject: snackBarMessages.exportToDHIS2Error,
        consoleError: 'exportdatasource',
    });
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
    // using iasoFetch so I can convert response to text i.o. json
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
            throw error;
        });
};

export const updateDefaultDataSource = (accountId, defaultVersionId) =>
    putRequest(`/api/accounts/${accountId}/`, {
        default_version: defaultVersionId,
    });

/**
 * Save DataSource on server
 * If the data source is marked as default this necessitate a separate request to
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
            throw error;
        }

        // eslint-disable-next-line camelcase
        if (is_default_source && form.default_version_id.value) {
            await saveDefaultDataSourceMutation.mutateAsync(
                currentUser.account.id,
                form.default_version_id.value,
            );
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
        },
    );
