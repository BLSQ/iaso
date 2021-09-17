import React from 'react';
import CallMade from '@material-ui/icons/CallMade';
import moment from 'moment';
import { Tooltip } from '@material-ui/core';
import { truncateText } from 'bluesquare-components';
import { FormattedMessage } from 'react-intl';
import instancesTableColumns from './config';
import MESSAGES from './messages';
import DeleteDialog from './components/DeleteInstanceDialog';
import ExportInstancesDialogComponent from './components/ExportInstancesDialogComponent';

const NO_VALUE = '/';
const hasNoValue = value => !value || value === '';

const KeyValueFields = ({ entry }) =>
    Object.entries(entry).map(([key, value]) => (
        <>
            <span>{`${key} : ${hasNoValue(value) ? NO_VALUE : value}`}</span>
            <br />
        </>
    ));

const formatValue = value => {
    if (moment(value).isValid()) return moment(value).format('LTS');
    return value;
};
const renderValue = (settings, c) => {
    const { key } = c;
    // eslint-disable-next-line camelcase
    const { file_content } = settings.row.original;
    const value = file_content[key];

    if (hasNoValue(value)) {
        return <span>{NO_VALUE}</span>;
    }
    if (Array.isArray(value)) {
        return (
            <pre style={{ textAlign: 'left' }}>
                {value.map((val, index) => (
                    <>
                        <KeyValueFields key={`arr${index}`} entry={val} />
                        <br />
                    </>
                ))}
            </pre>
        );
    }
    return <span>{formatValue(value)}</span>;
};

export const getInstancesColumns = (
    formatMessage,
    visibleColumns,
    showDeleted = false,
) => {
    const metasColumns = [...instancesTableColumns(formatMessage)];
    if (showDeleted) {
        metasColumns.shift();
    }
    let tableColumns = [];
    metasColumns.forEach(c => {
        const metaColumn = visibleColumns.find(vc => vc.key === c.accessor);
        if ((metaColumn && metaColumn.active) || c.accessor === 'actions') {
            tableColumns.push(c);
        }
    });

    const childrenArray = [];
    visibleColumns
        .filter(c => !c.meta)
        .forEach(c => {
            if (c.active) {
                childrenArray.push({
                    class: 'small',
                    sortable: false,
                    accessor: c.key,
                    Header: (
                        <Tooltip
                            title={
                                <FormattedMessage
                                    {...MESSAGES.instanceHeaderTooltip}
                                    values={{
                                        label: c.label,
                                        key: c.key,
                                    }}
                                />
                            }
                        >
                            <span>
                                {c.label?.trim()
                                    ? truncateText(c.label, 25)
                                    : c.key}
                            </span>
                        </Tooltip>
                    ),
                    Cell: settings => renderValue(settings, c),
                });
            }
        });
    tableColumns = tableColumns.concat(childrenArray);
    return tableColumns;
};

export const getMetasColumns = () =>
    [...instancesTableColumns()].map(c => c.accessor);

const labelLocales = { fr: 'French', en: 'English' };

const localizeLabel = (field, locale) => {
    const formattedlabel = field.label.replaceAll("'", '"');
    let result;
    try {
        const localeOptions = JSON.parse(formattedlabel);
        const localeKey = labelLocales[locale] ?? labelLocales.en;
        result = localeOptions[localeKey];
    } catch (e) {
        // some fields are using single quotes. Logging just for info, this can be deleted if it clutters the console
        console.warn('Error parsing JSON', field.label);
        result = field.key;
    }
    return result;
};

const formatLabel = (field, locale) => {
    if (field.label.charAt(0) === '{') return localizeLabel(field, locale);
    if (!field.label) return field.key;
    if (!field.label.trim()) return field.key;
    if (field.label.includes(':')) return field.label.split(':')[0];
    if (field.label.includes('$')) return field.label.split('$')[0];
    return field.label;
};
export const getInstancesVisibleColumns = ({
    formatMessage,
    instance,
    columns = undefined,
    order,
    defaultOrder,
    possibleFields,
    locale,
}) => {
    const activeOrders = (order || defaultOrder).split(',');
    const columnsNames = columns ? columns.split(',') : [];
    const metasColumns = [
        ...instancesTableColumns(formatMessage).filter(
            c => c.accessor !== 'actions',
        ),
    ];
    const newColumns = metasColumns.map(c => ({
        key: c.accessor,
        label: c.Header,
        active: columnsNames.includes(c.accessor),
        meta: true,
        disabled:
            activeOrders.indexOf(c.accessor) !== -1 ||
            activeOrders.indexOf(`-${c.accessor}`) !== -1,
    }));

    if (instance) {
        possibleFields.forEach(field => {
            const label = formatLabel(field, locale);
            newColumns.push({
                key: field.name,
                label,
                active: columnsNames.includes(field.name),
                disabled: false,
            });
        });
    }
    return newColumns;
};

export const getInstancesFilesList = instances => {
    const filesList = [];
    instances.forEach(i => {
        if (i.files.length > 0) {
            i.files.forEach(path => {
                const file = {
                    itemId: i.id,
                    createdAt: i.created_at,
                    path,
                };
                filesList.push(file);
            });
        }
    });
    return filesList;
};

export const getSelectionActions = (
    formatMessage,
    filters,
    setForceRefresh,
    isUnDeleteAction = false,
    classes,
) => {
    const label = formatMessage(
        isUnDeleteAction ? MESSAGES.unDeleteInstance : MESSAGES.deleteInstance,
    );
    return [
        {
            icon: newSelection => (
                <ExportInstancesDialogComponent
                    selection={newSelection}
                    getFilters={() => filters}
                    renderTrigger={openDialog => {
                        const iconDisabled = newSelection.selectCount === 0;
                        const iconProps = {
                            className: iconDisabled
                                ? classes.iconDisabled
                                : null,
                            onClick: !iconDisabled ? openDialog : () => null,
                            disabled: iconDisabled,
                        };
                        return <CallMade {...iconProps} />;
                    }}
                />
            ),
            label: formatMessage(MESSAGES.exportRequest),
            disabled: false,
        },
        {
            icon: (newSelection, resetSelection) => (
                <DeleteDialog
                    selection={newSelection}
                    filters={filters}
                    setForceRefresh={setForceRefresh}
                    resetSelection={resetSelection}
                    isUnDeleteAction={isUnDeleteAction}
                />
            ),
            label,
            disabled: false,
        },
    ];
};
