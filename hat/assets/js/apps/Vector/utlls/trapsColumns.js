import React from 'react';

const trapsColumns = formatMessage => (
    [
        {
            Header: 'Id',
            accessor: 'id',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Latitude',
                id: 'main.label.latitude',
            }),
            accessor: 'latitude',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Longitude',
                id: 'main.label.longitude',
            }),
            accessor: 'longitude',
        },
    ]
);
export default trapsColumns;

