import React from 'react';
import instancesTableColumns from './config';

export const getInstancesColumns = (formatMessage, visibleColumns) => {
    const metasColumns = [...instancesTableColumns(formatMessage)];
    let tableColumns = [];
    metasColumns.forEach((c) => {
        const metaColumn = visibleColumns.find(vc => vc.key === c.accessor);
        if ((metaColumn && metaColumn.active) || c.accessor === 'actions') {
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

export const getInstancesVisibleColumns = (formatMessage, instance, {
    columns = undefined,
    order,
}, defaultOrder) => {
    const activeOrders = (order || defaultOrder).split(',');
    const metasColumns = [...instancesTableColumns(formatMessage).filter(c => c.accessor !== 'actions')];
    const newColumns = metasColumns.map(c => (
        {
            key: c.accessor,
            label: c.Header,
            active: columns !== undefined && columns.includes(c.accessor),
            meta: true,
            disabled: activeOrders.indexOf(c.accessor) !== -1 || activeOrders.indexOf(`-${c.accessor}`) !== -1,
        }
    ));
    if (instance) {
        Object.keys(instance.file_content).forEach((k) => {
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
