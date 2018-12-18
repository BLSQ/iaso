import moment from 'moment';
import React from 'react';
import { FormattedMessage } from 'react-intl';

const sitesColumns = (formatMessage, messages, element) => (
    [
        {
            Header: formatMessage({
                defaultMessage: 'Date de création',
                id: 'main.label.created_at',
            }),
            accessor: 'created_at',
            Cell: settings => (
                <span>
                    {
                        moment(settings.original.created_at).format('DD/MM/YYYY HH:mm')
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
            sortable: false,
        },
        {
            Header: formatMessage({
                defaultMessage: 'Longitude',
                id: 'main.label.longitude',
            }),
            accessor: 'longitude',
            sortable: false,
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
                defaultMessage: 'Actions',
                id: 'main.actions',
            }),
            sortable: false,
            resizable: false,
            Cell: settings => (
                <section>
                    <button
                        className="button--edit--tiny"
                        onClick={() => element.editItem('site', settings.original)}
                    >
                        <i className="fa fa-pencil-square-o" />
                        <FormattedMessage id="main.label.edit" defaultMessage="Editer" />
                    </button>
                </section>
            ),
        },
    ]
);
export default sitesColumns;

