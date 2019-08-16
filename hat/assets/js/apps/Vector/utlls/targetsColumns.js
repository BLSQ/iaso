import React from 'react';
import moment from 'moment';
import { FormattedMessage } from 'react-intl';

const targetsColumns = (formatMessage, getDetail) => (
    [
        {
            Header: 'UUID',
            className: 'small',
            accessor: 'uuid',
            width: 250,
        },
        {
            Header: formatMessage({
                defaultMessage: 'Date',
                id: 'main.label.date',
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
                id: 'main.label.name',
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
                defaultMessage: 'River',
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
                id: 'main.label.actions',
            }),
            sortable: false,
            resizable: false,
            Cell: settings => (
                <section>
                    <button
                        className="button--edit--tiny"
                        onClick={() => getDetail(settings.original.id, 'targets', 'showEditTargetModale')}
                    >
                        <i className="fa fa-pencil-square-o" />
                        <FormattedMessage id="main.label.edit" defaultMessage="Edit" />
                    </button>
                </section>
            ),
        },
    ]
);
export default targetsColumns;

