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
            return data.versions.map(version => ({
                id: version.id,
                data_source_name: version.data_source_name,
                is_default: version.is_default,
                number: version.number,
            }));
        },
    });
};

export const postToDHIS2 = async data => {
    const adaptedData = { ...data };
    if (data.source_status === 'ALL') {
        adaptedData.source_status = '';
    }
    adaptedData.ref_org_unit_type_ids = data.source_org_unit_type_ids;
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

// Assumes that the entries are ordered starting with source_version_id
export const convertExportDataToURL = data => {
    const keys = Object.keys(data);
    let result = '/api/sourceversions/diff.csv/?';
    keys.forEach((key, index) => {
        if (data[key]) {
            if (index === 0) {
                result = result.concat(`${key}=${data[key]}`);
            } else if (
                key === 'source_org_unit_types_ids' ||
                key === 'fields_to_export'
            ) {
                data[key].forEach(entry => {
                    result = result.concat(`&${key}=${entry}`);
                });
            } else {
                result = result.concat(`&${key}=${data[key]}`);
            }
        }
    });
    return result;
};
export const csvPreview = async data => {
    const adaptedData = { ...data };
    if (data.source_status === 'ALL') {
        adaptedData.source_status = '';
    }
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
