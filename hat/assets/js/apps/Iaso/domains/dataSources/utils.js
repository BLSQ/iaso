import React from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { Chip } from '@material-ui/core';
import {
    HighlightOffOutlined as NotCheckedIcon,
    CheckCircleOutlineOutlined as CheckedIcon,
} from '@material-ui/icons';
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

const formatSourceVersionLabel = (formatMessage, sourceVersion) => {
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

const sortByNumberAsc = (sourceA, sourceB) => {
    return sourceA.number - sourceB.number;
};
const sortByNumberDesc = (sourceA, sourceB) => {
    return sourceB.number - sourceA.number;
};
const sortByOrgUnitsAsc = (sourceA, sourceB) => {
    return sourceA.org_units_count - sourceB.org_units_count;
};
const sortByOrgUnitsDesc = (sourceA, sourceB) => {
    return sourceB.org_units_count - sourceA.org_units_count;
};

export const getSortedSourceVersions = (
    dataForTable,
    sortFocus,
    sortBy,
    formatDataForTable,
    formatMessage,
) => {
    if (sortFocus === 'number' && sortBy === 'asc') {
        return formatDataForTable(dataForTable, sortByNumberAsc);
    }
    if (sortFocus === 'number' && sortBy === 'desc') {
        return formatDataForTable(dataForTable, sortByNumberDesc);
    }
    if (sortFocus === 'org_units_count' && sortBy === 'asc') {
        return formatDataForTable(dataForTable, sortByOrgUnitsAsc);
    }
    if (sortFocus === 'org_units_count' && sortBy === 'desc') {
        return formatDataForTable(dataForTable, sortByOrgUnitsDesc);
    }
    console.warn(
        formatMessage(MESSAGES.dataSourceVersionSortingWarn, {
            sortBy,
            sortFocus,
        }),
    );

    return [];
};

export const handleSort = (
    focus,
    sortFocus,
    sortBy,
    setSortFocus,
    setSortBy,
) => {
    if (sortFocus !== focus) {
        setSortFocus(focus);
        setSortBy('asc');
    } else if (sortBy === 'asc') {
        setSortBy('desc');
    } else {
        setSortBy('asc');
    }
};

export const handleTableParamsChange = (
    tableParams,
    handleSortFunction,
    setRowsPerPage,
    setPage,
) => {
    if (tableParams.order) {
        handleSortFunction(tableParams.order.replace('-', ''));
    }
    if (tableParams.pageSize) {
        setRowsPerPage(parseInt(tableParams.pageSize, 10));
    }
    if (tableParams.page) {
        setPage(parseInt(tableParams.page, 10) - 1);
    }
};

export const getTableParams = (rowsPerPage, page) => ({
    pageSize: rowsPerPage,
    page: page + 1,
});

export const getTablePages = (dataForTable, rowsPerPage) => {
    return dataForTable.length
        ? Math.ceil(dataForTable.length / rowsPerPage)
        : 0;
};

export const getLabelsAndValues = (dataSource, formatMessage) => {
    const keys = [
        'name',
        'description',
        'url',
        'default_version',
        'projects',
        'read_only',
    ];

    const translations = {
        name: 'dataSourceName',
        description: 'dataSourceDescription',
        url: 'dhisUrl',
        default_version: 'defaultVersion',
        projects: 'projects',
        read_only: 'dataSourceReadOnly',
    };
    const getProjects = projects => {
        return (
            <>
                {projects.flat().map(project => {
                    return (
                        <Chip
                            label={project.name}
                            key={project.id}
                            color="primary"
                        />
                    );
                })}
            </>
        );
    };

    const getDefaultVersion = defaultVersion => {
        if (defaultVersion) {
            return <CheckedIcon style={{ color: 'green' }} />;
        }
        return <NotCheckedIcon color="disabled" />;
    };

    const fields = [];

    Object.entries(dataSource).forEach(([key, source]) => {
        const label =
            translations[key] === undefined
                ? ''
                : formatMessage(MESSAGES[translations[key]]);
        if (keys.includes(key)) {
            switch (key) {
                case 'default_version':
                    fields.push({
                        label,
                        value: getDefaultVersion(!!source),
                    });
                    break;
                case 'projects':
                    fields.push({
                        label,
                        value: getProjects(source),
                    });
                    break;
                case 'read_only':
                    fields.push({
                        label,
                        value: getDefaultVersion(!!source),
                    });
                    break;
                default:
                    fields.push({ label, value: source });
            }
        }
    });
    return fields;
};
