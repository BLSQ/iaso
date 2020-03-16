import React from 'react';
import instancesTableColumns from './config';

export const getInstancesColumns = (formatMessage, visibleColumns) => {
    let tableColumns = [...instancesTableColumns(formatMessage)];

    const childrenArray = [];
    visibleColumns.forEach((c) => {
        if (c.active) {
            childrenArray.push({
                class: 'small',
                sortable: false,
                accessor: c.key,
                Header: c.label,
                Cell: settings => (
                    <span>
                        {!settings.original.file_content[c.key] || settings.original.file_content[c.key] === '' ? '/' : settings.original.file_content[c.key]}
                    </span>
                ),
                width: 150,
            });
        }
    });
    // tableColumns = tableColumns.map(c => ({
    //     ...c,
    //     width: c.accessor === 'uuid' ? 300 : 200,
    // }));
    tableColumns = tableColumns.concat(childrenArray);
    return tableColumns;
};

export const getInstancesVisibleColumns = (instance) => {
    const columns = [];
    if (instance) {
        Object.keys(instance.file_content).forEach((k) => {
            if (k !== 'meta' && k !== 'uuid') {
                columns.push({
                    key: k,
                    label: k,
                    active: false,
                });
            }
        });
    }
    return columns;
};


export const getInstancesFilesList = (instances) => {
    const filesList = [];
    instances.forEach((i) => {
        if (i.files.length > 0) {
            i.files.forEach((path) => {
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
