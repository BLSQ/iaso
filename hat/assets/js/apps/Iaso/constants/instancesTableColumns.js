import React from 'react';
import moment from 'moment';

const instancesTableColumns = formatMessage => (
    [
        {
            Header: formatMessage({
                defaultMessage: 'Mise à jour',
                id: 'iaso.form.updated_at',
            }),
            accessor: 'updated_at',
            Cell: settings => (
                <section>
                    {moment.unix(settings.original.updated_at).format('DD/MM/YYYY HH:mm')}
                </section>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Création',
                id: 'iaso.form.created_at',
            }),
            accessor: 'created_at',
            Cell: settings => (
                <section>
                    {moment.unix(settings.original.created_at).format('DD/MM/YYYY HH:mm')}
                </section>
            ),
        },
    ]
);
export default instancesTableColumns;
