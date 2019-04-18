import moment from 'moment';
import React from 'react';

const catchesColumns = formatMessage => (
    [
        {
            Header: 'UUID',
            className: 'small',
            accessor: 'uuid',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Installé',
                id: 'vector.catchs.setup_date',
            }),
            accessor: 'setup_date',
            className: 'small',
            Cell: settings => (
                <span>
                    {
                        moment(settings.original.setup_date).format('DD/MM/YYYY HH:mm')
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Collecté',
                id: 'vector.catchs.collect_date',
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
                defaultMessage: 'Males',
                id: 'vector.catchs.male',
            }),
            className: 'small',
            accessor: 'male_count',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Femelles',
                id: 'vector.catchs.female',
            }),
            className: 'small',
            accessor: 'female_count',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Inconnu',
                id: 'vector.catchs.unknown',
            }),
            className: 'small',
            accessor: 'unknown_count',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Remarques',
                id: 'vector.catchs.remarks',
            }),
            className: 'small',
            accessor: 'remarks',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Utilisateur',
                id: 'vector.catchs.user',
            }),
            className: 'small',
            accessor: 'username',
        },
    ]
);
export default catchesColumns;

