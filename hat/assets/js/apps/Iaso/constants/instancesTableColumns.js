/* globals window */
import React from 'react';
import moment from 'moment';

import Button from '@material-ui/core/Button';
import RemoveRedEye from '@material-ui/icons/RemoveRedEye';

const instancesTableColumns = (formatMessage, component) => (
    [
        {
            Header: formatMessage({
                defaultMessage: 'Mise à jour',
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
            Header: formatMessage({
                defaultMessage: 'Création',
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
                defaultMessage: 'Fichier',
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
                        {formatMessage({
                            defaultMessage: 'XML',
                            id: 'iaso.instance.XML',
                        })}
                    </Button>
                </span>
            ),
            width: 150,
        },
    ]
);
export default instancesTableColumns;
