import React from 'react';

const sitesColumns = formatMessage => (
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
export default sitesColumns;

