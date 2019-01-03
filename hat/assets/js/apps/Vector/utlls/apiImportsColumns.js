import moment from 'moment';
import React from 'react';

const apiImportsColumns = formatMessage => (
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
                    {
                        settings.original.type === 'site' &&
                        <span>
                            {`${settings.original.site_count} `}
                            {formatMessage({
                                defaultMessage: 'nouveau(x) site(s)',
                                id: 'vector.sync.label.newSites',
                            })}
                        </span>
                    }
                    {
                        settings.original.type === 'catch' &&
                        <span>
                            {`${settings.original.catch_count} `}
                            {formatMessage({
                                defaultMessage: 'nouveau(x) piège(s)',
                                id: 'vector.sync.label.newCatchs',
                            })}
                        </span>
                    }
                </section>
            ),
        },
    ]
);
export default apiImportsColumns;

