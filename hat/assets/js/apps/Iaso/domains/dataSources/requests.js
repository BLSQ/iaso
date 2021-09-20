import { useQuery } from 'react-query';
import { iasoGetRequest, iasoPostRequest } from '../../utils/requests';

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
                name: version.name,
                number: version.number,
            }));
        },
    });
};

// TODO figure out why stuff crashes when importing those 2 functions
export const waitFor = delay =>
    new Promise(resolve => setTimeout(resolve, delay));

export const fakeResponse =
    response =>
    async (isError = false) => {
        if (isError) throw new Error('mock request failed');
        await waitFor(200);
        return response;
    };
export const postToDHIS2 = async data => {
    // return iasoPostRequest({
    //     requestParams: {
    //         url: '/api/exportdatasource/',
    //         body: data,
    //     },
    //     errorKeyMessage: 'Could not export to DHIS2',
    //     consoleError: 'exportdatasource',
    // });
    console.log('posted to DHSI2', data);
    return fakeResponse(data)();
};
export const xlsPreview = async data => {
    // return iasoPostRequest({
    //     requestParams: {
    //         url: '/api/exportpreview/',
    //         body: data,
    //     },
    //     errorKeyMessage: 'Could not generate XLS preview',
    //     consoleError: 'exportpreview',
    // });
    console.log('generated XLS preview with data:', data);
    return fakeResponse(data)();
};

const getCredentials = async datasourceId => {
    // return iasoGetRequest({
    //     requestParams: { url: `/api/credentials/${datasourceId}` },
    //     disableSuccessSnackBar: true,
    // });
    const fakeCredentials = [
        { name: 'stu', id: 1 },
        { name: 'pete', id: 2 },
    ];
    return fakeResponse(fakeCredentials)();
};

export const useCredentials = (datasourceId = null) => {
    return useQuery(['credentials', datasourceId], getCredentials);
};
