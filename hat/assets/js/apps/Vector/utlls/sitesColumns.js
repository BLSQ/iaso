import moment from 'moment';
import React from 'react';
import { FormattedMessage } from 'react-intl';

const sitesColumns = (formatMessage, getDetail) => (
    [
        {
            Header: 'UUID',
            className: 'small',
            accessor: 'uuid',
            width: 250,
        },
        {
            Header: formatMessage({
                defaultMessage: 'Nom',
                id: 'main.label.name',
            }),
            accessor: 'name',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Créateur',
                id: 'main.label.creator',
            }),
            accessor: 'creator',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Création',
                id: 'main.label.created_at',
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
                defaultMessage: 'Responsable',
                id: 'main.label.responsible',
            }),
            accessor: 'responsible',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Actions',
                id: 'main.actions',
            }),
            sortable: false,
            resizable: false,
            width: 220,
            Cell: settings => (
                <section>
                    <button
                        className="button--edit--tiny"
                        onClick={() => getDetail(settings.original.id, 'new_sites', 'showEditSiteModale')}
                    >
                        <i className="fa fa-pencil-square-o" />
                        <FormattedMessage id="main.label.edit" defaultMessage="Editer" />
                    </button>
                </section>
            ),
        },
    ]
);
export default sitesColumns;
