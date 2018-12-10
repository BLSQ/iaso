import React from 'react';
import moment from 'moment';

const targetsColumns = formatMessage => (
    [
        {
            Header: formatMessage({
                defaultMessage: 'Date',
                id: 'main.label.date_time',
            }),
            accessor: 'date_time',
            Cell: settings => (
                <span>
                    {
                        moment(settings.original.date_time).format('DD/MM/YYYY HH:mm')
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Name',
                id: 'main.label.nom',
            }),
            accessor: 'name',
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
        {
            Header: formatMessage({
                defaultMessage: 'Altitude',
                id: 'main.label.altitude',
            }),
            accessor: 'altitude',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Rivière',
                id: 'main.label.river',
            }),
            accessor: 'river',
        },
    ]
);
export default targetsColumns;

