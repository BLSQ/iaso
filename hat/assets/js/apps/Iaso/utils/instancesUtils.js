import React from 'react';

import instancesTableColumns from '../constants/instancesTableColumns';


export const getInstancesColumns = (formatMessage, instances) => {
    let tableColumns = [...instancesTableColumns(formatMessage)];
    if (instances[0]) {
        const childrenArray = [];

        Object.keys(instances[0].file_content).forEach((k) => {
            if (k !== 'meta' && k !== 'uuid') {
                childrenArray.push({
                    class: 'small',
                    sortable: false,
                    accessor: k,
                    Header: k,
                    Cell: settings => (
                        <span>
                            {!settings.original.file_content[k] || settings.original.file_content[k] === '' ? '/' : settings.original.file_content[k]}
                        </span>
                    ),
                    width: 150,
                });
            }
        });

        tableColumns = tableColumns.concat(childrenArray);
    }
    return tableColumns;
};


export const getInstancesFilesList = (instances) => {
    const filesList = [];
    instances.forEach((i) => {
        if (i.files.length > 0) {
            i.files.forEach((path) => {
                const file = {
                    itemId: i.id,
                    path,
                };
                filesList.push(file);
            });
        }
    });
    return filesList;
};
