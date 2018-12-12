import moment from 'moment';
import React from 'react';

const sitesColumns = (formatMessage, messages) => (
    [
        {
            Header: formatMessage({
                defaultMessage: 'Première collecte',
                id: 'main.label.first_survey_date',
            }),
            accessor: 'first_survey_date',
            Cell: settings => (
                <span>
                    {
                        moment(settings.original.first_survey_date).format('DD/MM/YYYY HH:mm')
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
                defaultMessage: 'Zone',
                id: 'main.label.zone',
            }),
            accessor: 'zone',
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
            accessor: 'user__username',
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
                defaultMessage: 'Habitat',
                id: 'main.label.habitat',
            }),
            accessor: 'habitat',
            Cell: settings => (
                <span>
                    {
                        settings.original.habitat ? formatMessage(messages[settings.original.habitat]) : '/'
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Décompte',
                id: 'main.label.count',
            }),
            accessor: 'count',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Total',
                id: 'main.label.total',
            }),
            accessor: 'total',
        },
    ]
);
export default sitesColumns;

