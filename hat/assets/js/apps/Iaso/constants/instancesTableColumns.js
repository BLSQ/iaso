/* globals window */
import React from 'react';
import moment from 'moment';

import Button from '@material-ui/core/Button';
import RemoveRedEye from '@material-ui/icons/RemoveRedEye';

const instancesTableColumns = (formatMessage, component) => (
    [
        {
            Header: formatMessage({
                defaultMessage: 'Updated at',
                id: 'iaso.instance.updated_at',
            }),
            accessor: 'updated_at',
            Cell: settings => (
                <span>
                    {moment.unix(settings.original.updated_at).format('DD/MM/YYYY HH:mm')}
                </span>
            ),
            width: 200,
        },
        {
            Header: 'Uid',
            accessor: 'uuid',
            width: 200,
        },
        {
            Header: formatMessage({
                defaultMessage: 'Org unit',
                id: 'iaso.instance.org_unit',
            }),
            accessor: 'org_unit__id',
            Cell: settings => (
                <span>
                    {settings.original.org_unit ? settings.original.org_unit.name : '/'}
                </span>
            ),
            width: 200,
        },
        {
            Header: formatMessage({
                defaultMessage: 'Created at',
                id: 'iaso.instance.created_at',
            }),
            accessor: 'created_at',
            Cell: settings => (
                <span>
                    {moment.unix(settings.original.created_at).format('DD/MM/YYYY HH:mm')}
                </span>
            ),
            width: 200,
        },
        {
            Header: formatMessage({
                defaultMessage: 'File',
                id: 'iaso.instance.file',
            }),
            sortable: false,
            accessor: 'file_url',
            Cell: settings => (
                <span>
                    <Button
                        onClick={() => window.open(settings.original.file_url, '_blank')}
                        size="small"
                        variant="contained"
                        color="primary"
                    >
                        <RemoveRedEye className={component.props.classes.buttonIcon} fontSize="small" />
                        XML
                    </Button>
                </span>
            ),
            width: 150,
        },
    ]
);
export default instancesTableColumns;
