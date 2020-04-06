import React from 'react';
import { displayDateFromTimestamp } from '../../utils/intlUtil';

const mappingsTableColumns = formatMessage => ([
    {
        Header: formatMessage({
            defaultMessage: 'Name',
            id: 'iaso.label.name',
        }),
        accessor: 'form_version__form__name',
        Cell: settings => (
            <span>
               {settings.original.form_version.form.name}
            </span>
        ),
    },
    {
        Header: formatMessage({
            defaultMessage: 'Version',
            id: 'iaso.label.version',
        }),
        accessor: 'form_version__form__version_id',
        Cell: settings => (
            <span>
               {settings.original.form_version.version_id}
            </span>
        ),
    },
    {
        Header: formatMessage({
            defaultMessage: 'Type',
            id: 'iaso.label.type',
        }),
        accessor: 'mapping__mapping_type',
        Cell: settings => (
            <span>
               {settings.original.mapping.mapping_type}
            </span>
        ),
    },
    {
        Header: formatMessage({
            defaultMessage: 'Updated at',
            id: 'iaso.label.updated_at',
        }),
        accessor: 'updated_at',
        Cell: settings => (
            <span>
                {displayDateFromTimestamp(settings.original.updated_at)}
            </span>
        ),
    },
]
);
export default mappingsTableColumns;
