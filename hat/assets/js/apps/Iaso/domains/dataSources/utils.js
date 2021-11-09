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
export const FIELDS_TO_EXPORT = {
    name: 'name',
    parent: 'parent',
    geometry: 'geometry',
    groups: 'groups',
};

export const useFieldsToExport = () => {
    const { formatMessage } = useSafeIntl();
    return [
        { label: formatMessage(MESSAGES.name), value: FIELDS_TO_EXPORT.name },
        {
            label: formatMessage(MESSAGES.parent),
            value: FIELDS_TO_EXPORT.parent,
        },
        {
            label: formatMessage(MESSAGES.geometry),
            value: FIELDS_TO_EXPORT.geometry,
        },
        {
            label: formatMessage(MESSAGES.groups),
            value: FIELDS_TO_EXPORT.groups,
        },
    ];
};
export const credentialsAsOptions = credentials => {
    if (!credentials) return [];
    return credentials.map(credential => ({
        label: credential.name,
        value: credential.id,
    }));
};

export const formatSourceVersionLabel = (formatMessage, sourceVersion) => {
    const name = sourceVersion.data_source_name ?? 'Unnamed source';
    const version = formatMessage(MESSAGES.version);
    const number = sourceVersion.number.toString();
    const label = `${name} - ${version}: ${number}`;
    if (sourceVersion.is_default) {
        return `${label} ⋅ (${formatMessage(MESSAGES.default)})`;
    }

    return label;
};

export const versionsAsOptionsWithSourceName = ({
    versions,
    formatMessage,
}) => {
    if (!versions) return [];
    return versions.map(version => {
        return {
            label: formatSourceVersionLabel(formatMessage, version),
            value: version.id.toString(),
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
