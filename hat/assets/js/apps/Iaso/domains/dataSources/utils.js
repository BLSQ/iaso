import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from './messages';

/**
 * get the first defaultSource and defaultVersion of an user account
 *
 * @param {Object} user
 * @return {Object}
 */

export const getDefaultSourceVersion = user => {
    const sourceVersion = {
        source: undefined,
        version: undefined,
    };
    if (user && user.account) {
        if (user.account.default_version) {
            sourceVersion.version = user.account.default_version;
        }
        if (
            user.account.default_version &&
            user.account.default_version.data_source
        ) {
            sourceVersion.source = user.account.default_version.data_source;
        }
    }
    return sourceVersion;
};
export const useFieldsToExport = () => {
    const { formatMessage } = useSafeIntl();
    return [
        { label: formatMessage(MESSAGES.name), value: 'name' },
        { label: formatMessage(MESSAGES.parent), value: 'parent' },
        { label: formatMessage(MESSAGES.shape), value: 'shape' },
        { label: formatMessage(MESSAGES.groups), value: 'groups' },
        { label: formatMessage(MESSAGES.location), value: 'location' },
    ];
};
export const credentialsAsOptions = credentials => {
    if (!credentials) return [];
    return credentials.map(credential => ({
        label: credential.name,
        value: credential.id,
    }));
};

const formatSourceVersionLabel = (
    formatMessage,
    defaultVersionId,
    sourceVersion,
) => {
    const name = sourceVersion.name ?? 'Unnamed source';
    const version = formatMessage(MESSAGES.version);
    const number = sourceVersion.number.toString();
    const label = `${name} - ${version}: ${number}`;

    if (sourceVersion.id === defaultVersionId)
        return `${label} (${formatMessage(MESSAGES.default)})`;

    return label;
};

export const refDataSourceVersionsAsOptions = ({
    versions,
    defaultVersionId,
    formatMessage,
}) => {
    if (!versions) return [];
    return versions.map(version => {
        return {
            label: formatSourceVersionLabel(
                formatMessage,
                defaultVersionId,
                version,
            ),
            value: version.id,
        };
    });
};

export const dataSourceVersionsAsOptions = (
    versions,
    defaultVersionId,
    formatMessage,
) => {
    const asDefault = `(${formatMessage(MESSAGES.default)})`;
    return versions.map(version => {
        const versionNumber = version.number.toString();
        return {
            value: version.id,
            label:
                version.id === defaultVersionId
                    ? `${versionNumber} ${asDefault}`
                    : versionNumber,
        };
    });
};
