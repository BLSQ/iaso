import moment from 'moment';
import React from 'react';

const catchesColumns = formatMessage => (
    [
        {
            Header: formatMessage({
                defaultMessage: 'Collecté',
                id: 'main.label.collect_date',
            }),
            accessor: 'collect_date',
            className: 'small',
            Cell: settings => (
                <span>
                    {
                        moment(settings.original.collect_date).format('DD/MM/YYYY HH:mm')
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Remarques',
                id: 'main.label.remarks',
            }),
            className: 'small',
            accessor: 'remarks',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Utilisateur',
                id: 'main.label.user',
            }),
            className: 'small',
            accessor: 'username',
        },
    ]
);
export default catchesColumns;

