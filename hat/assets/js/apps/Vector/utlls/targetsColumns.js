import React from 'react';
import moment from 'moment';
import { FormattedMessage } from 'react-intl';

const targetsColumns = (formatMessage, element) => (
    [
        {
            Header: 'UUID',
            className: 'small',
            accessor: 'uuid',
        },
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
                        onClick={() => element.editItem('target', settings.original)}
                    >
                        <i className="fa fa-pencil-square-o" />
                        <FormattedMessage id="main.label.edit" defaultMessage="Editer" />
                    </button>
                </section>
            ),
        },
    ]
);
export default targetsColumns;

