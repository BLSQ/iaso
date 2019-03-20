import React from 'react';
import moment from 'moment';

const imagesColumns = formatMessage => (
    [
        {
            Header: formatMessage({
                defaultMessage: 'Type',
                id: 'quality.label.type',
            }),
            accessor: 'type',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Date',
                id: 'quality.label.date',
            }),
            accessor: 'date',
            Cell: settings => (
                <span>
                    {
                        moment(settings.original.date).format('DD/MM/YYYY HH:mm')
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Résultat',
                id: 'quality.label.result',
            }),
            accessor: 'result',
        },
    ]
);
export default imagesColumns;
