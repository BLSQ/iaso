import moment from 'moment';
import React from 'react';
import { FormattedMessage } from 'react-intl';

const trapsColumns = (formatMessage, messages, element) => (
    [
        {
            Header: formatMessage({
                defaultMessage: 'Création',
                id: 'main.label.created_at',
            }),
            accessor: 'created_at',
            className: 'small',
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
                defaultMessage: 'Nom',
                id: 'main.label.name',
            }),
            className: 'small',
            accessor: 'name',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Déploiements',
                id: 'main.label.catches',
            }),
            className: 'small',
            accessor: 'catches_count',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Mouches',
                id: 'main.label.catches_count_total',
            }),
            accessor: 'catches_count_total',
            className: 'small',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Description',
                id: 'main.label.description',
            }),
            className: 'small',
            accessor: 'description',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Utilisateur',
                id: 'main.label.user',
            }),
            className: 'small',
            accessor: 'user',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Habitat',
                id: 'main.label.habitat',
            }),
            className: 'small',
            accessor: 'habitat',
            Cell: settings => (
                <span>
                    {
                        settings.original.habitat ?
                            formatMessage(messages[settings.original.habitat]) :
                            formatMessage(messages.unknown)
                    }
                </span>
            ),
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
                    {
                        settings.original.catches_count > 0 &&
                        <button
                            className="button--edit--tiny margin-right"
                            onClick={() => element.displayCatches(settings.original, true)}
                        >
                            <i className="fa fa-eye" />
                            <FormattedMessage id="main.label.catches" defaultMessage="Déploiements" />
                        </button>
                    }
                    <button
                        className="button--edit--tiny"
                        onClick={() => element.editItem('trap', settings.original)}
                    >
                        <i className="fa fa-pencil-square-o" />
                        <FormattedMessage id="main.label.detail" defaultMessage="Détails" />
                    </button>
                </section>
            ),
        },
    ]
);
export default trapsColumns;

