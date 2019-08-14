import React from 'react';

import instancesTableColumns from '../constants/instancesTableColumns';


const getInstancesColumns = (formatMessage, instances, component) => {
    let tableColumns = [...instancesTableColumns(formatMessage, component)];
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

export default getInstancesColumns;
