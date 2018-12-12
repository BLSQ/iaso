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
                        settings.original.date_time ? moment(settings.original.date_time).format('DD/MM/YYYY HH:mm') : '/'
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
                defaultMessage: 'Utilisateur',
                id: 'main.label.user',
            }),
            accessor: 'gps_import__user__username',
            Cell: settings => (
                <span>
                    {
                        settings.original.username
                    }
                </span>
            ),
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
            Cell: settings => (
                <span>
                    {
                        settings.original.river ? settings.original.river : '/'
                    }
                </span>
            ),
        },
    ]
);
export default targetsColumns;

