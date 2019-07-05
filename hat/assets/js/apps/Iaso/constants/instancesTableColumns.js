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
            width: 200,
        },
    ]
);
export default instancesTableColumns;
