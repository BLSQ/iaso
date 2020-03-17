import React from 'react';
import instancesTableColumns from './config';

export const getInstancesColumns = (formatMessage, visibleColumns) => {
    const metasColumns = [...instancesTableColumns(formatMessage)];
    let tableColumns = [];
    metasColumns.forEach((c) => {
        const metaColumn = visibleColumns.find(vc => vc.key === c.accessor);
        if (metaColumn && metaColumn.active) {
            tableColumns.push(c);
        }
    });

    const childrenArray = [];
    visibleColumns.filter(c => !c.meta).forEach((c) => {
        if (c.active) {
            childrenArray.push({
                class: 'small',
                sortable: false,
                accessor: c.key,
                Header: c.label || c.key,
                Cell: settings => (
                    <span>
                        {!settings.original.file_content[c.key] || settings.original.file_content[c.key] === '' ? '/' : settings.original.file_content[c.key]}
                    </span>
                ),
            });
        }
    });
    tableColumns = tableColumns.concat(childrenArray);
    return tableColumns;
};

export const getMetasColumns = () => [...instancesTableColumns()].map(c => c.accessor);

export const getInstancesVisibleColumns = (formatMessage, instance, columnsParams = undefined) => {
    const metasColumns = [...instancesTableColumns(formatMessage)];
    const columns = metasColumns.map(c => (
        {
            key: c.accessor,
            label: c.Header,
            active: columnsParams !== undefined && columnsParams.includes(c.accessor),
            meta: true,
        }
    ));
    if (instance) {
        Object.keys(instance.file_content).forEach((k) => {
            if (k !== 'meta' && k !== 'uuid') {
                columns.push({
                    key: k,
                    label: instance.file_content[k].label,
                    active: columnsParams !== undefined && columnsParams.includes(k),
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
