import { useQuery } from 'react-query';
import { useSafeIntl } from 'bluesquare-components';
import { iasoGetRequest, iasoPostRequest } from '../../utils/requests';
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

const formatSourceVersionLabel =
    formatMessage => (defaultVersionId, sourceVersion) => {
        const name = sourceVersion.name ?? 'Unnamed source';
        const version = formatMessage(MESSAGES.version);
        const number = sourceVersion.number.toString();
        const label = `${name} - ${version}: ${number}`;

        if (sourceVersion.id === defaultVersionId)
            return `${label} (${formatMessage(MESSAGES.default)})`;

        return label;
    };

export const useDataSourceVersions = defaultVersionId => {
    const { formatMessage } = useSafeIntl();
    const makeLabel = formatSourceVersionLabel(formatMessage);
    return useQuery(
        ['dataSourceVersions', defaultVersionId],
        getDataSourceVersions,
        {
            select: data => {
                return data.versions.map(version => ({
                    value: version.id,
                    label: makeLabel(defaultVersionId, version),
                }));
            },
        },
    );
};
export const useDataSourceVersionsMap = defaultVersionId => {
    return useQuery(
        ['dataSourceVersions', defaultVersionId],
        getDataSourceVersions,
        {
            select: data => {
                return new Map(
                    data.versions.map(version => [
                        version.id,
                        version.data_source,
                    ]),
                );
            },
        },
    );
};
