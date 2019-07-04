import React from 'react';
import moment from 'moment';

const formsTableColumns = formatMessage => (
    [
        {
            Header: formatMessage({
                defaultMessage: 'Nom',
                id: 'iaso.form.name',
            }),
            accessor: 'name',
        },
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
        {
            Header: formatMessage({
                defaultMessage: 'Enregistrement(s)',
                id: 'iaso.form.records',
            }),
            accessor: 'instancesCount',
        },
    ]
);
export default formsTableColumns;
