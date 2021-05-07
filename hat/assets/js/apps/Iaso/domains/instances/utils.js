import React from 'react';
import instancesTableColumns from './config';
import MESSAGES from './messages';
import DeleteDialog from './components/DeleteInstanceDialog';

const NO_VALUE = '/';
const hasNoValue = value => !value || value === '';

const KeyValueFields = ({ entry }) =>
    Object.entries(entry).map(([key, value]) => (
        <>
            <span>{`${key} : ${hasNoValue(value) ? NO_VALUE : value}`}</span>
            <br />
        </>
    ));

const renderValue = (settings, c) => {
    const { key } = c;
    // TODO refactor to use camelCase
    const { file_content } = settings.original;
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
    return <span>{value}</span>;
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
                    Header: c.label || c.key,
                    Cell: settings => renderValue(settings, c),
                });
            }
        });
    tableColumns = tableColumns.concat(childrenArray);
    return tableColumns;
};

export const getMetasColumns = () =>
    [...instancesTableColumns()].map(c => c.accessor);

export const getInstancesVisibleColumns = (
    formatMessage,
    instance,
    { columns = undefined, order },
    defaultOrder,
) => {
    const activeOrders = (order || defaultOrder).split(',');
    const metasColumns = [
        ...instancesTableColumns(formatMessage).filter(
            c => c.accessor !== 'actions',
        ),
    ];
    const newColumns = metasColumns.map(c => ({
        key: c.accessor,
        label: c.Header,
        active: columns !== undefined && columns.includes(c.accessor),
        meta: true,
        disabled:
            activeOrders.indexOf(c.accessor) !== -1 ||
            activeOrders.indexOf(`-${c.accessor}`) !== -1,
    }));
    if (instance) {
        Object.keys(instance.file_content).forEach(k => {
            if (k !== 'meta' && k !== 'uuid') {
                newColumns.push({
                    key: k,
                    label: k, // TO-DO: get field label from API
                    active: columns !== undefined && columns.includes(k),
                    disabled: false,
                });
            }
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

export const getSelectedActions = (
    formatMessage,
    filters,
    setForceRefresh,
    isUnDeleteAction = false,
) => {
    const label = formatMessage(
        isUnDeleteAction ? MESSAGES.unDeleteInstance : MESSAGES.deleteInstance,
    );
    return [
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
