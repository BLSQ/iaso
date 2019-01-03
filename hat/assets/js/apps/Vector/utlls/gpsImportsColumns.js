import moment from 'moment';
import React from 'react';

const gpsImportsColumns = formatMessage => (
    [
        {
            Header: formatMessage({
                defaultMessage: 'Date',
                id: 'main.label.date',
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
                defaultMessage: 'Utilisateur',
                id: 'main.label.user',
            }),
            accessor: 'user__username',
            Cell: settings => (
                <span>
                    {
                        settings.original.user
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Informations',
                id: 'main.label.infos',
            }),
            sortable: false,
            resizable: false,
            Cell: settings => (
                <section>
                    {`${settings.original.count} `}
                    {formatMessage({
                        defaultMessage: 'nouveau(x) écran(s)',
                        id: 'vector.sync.label.newTargets',
                    })}
                </section>
            ),
        },
    ]
);
export default gpsImportsColumns;

