import { useQuery } from 'react-query';
import { iasoGetRequest, iasoPostRequest } from '../../utils/requests';
import { dispatch } from '../../redux/store';
import { iasoFetch } from '../../libs/Api';
import { enqueueSnackbar } from '../../redux/snackBarsReducer';
import { errorSnackBar } from '../../constants/snackBars';
import snackBarMessages from '../../components/snackBars/messages';

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
    if (data.source_status === 'ALL') {
        adaptedData.source_status = '';
    }
    // For now we decided to not expose theses parameters to the user
    // and reuse them between the source and the ref
    adaptedData.ref_org_unit_type_ids = data.source_org_unit_type_ids;
    adaptedData.ref_status = adaptedData.source_status;
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
            dispatch(
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
