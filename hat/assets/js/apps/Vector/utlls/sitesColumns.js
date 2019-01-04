import moment from 'moment';
import React from 'react';
import { FormattedMessage } from 'react-intl';

const sitesColumns = (formatMessage, messages, element) => (
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
                id: 'main.label.catchs',
            }),
            className: 'small',
            accessor: 'catchs_count',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Mouches',
                id: 'main.label.catchs_count_total',
            }),
            accessor: 'catchs_count_total',
            className: 'small',
            Cell: (settings) => {
                const site = settings.original;
                let total = 0;
                if (site.catchs_count_male) {
                    total += site.catchs_count_male;
                }
                if (site.catchs_count_female) {
                    total += site.catchs_count_female;
                }
                if (site.catchs_count_unknown) {
                    total += site.catchs_count_male;
                }
                return <span>{total}</span>;
            },
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
                        settings.original.catchs_count > 0 &&
                        <button
                            className="button--edit--tiny margin-right"
                            onClick={() => element.displayCatchs(settings.original, true)}
                        >
                            <i className="fa fa-eye" />
                            <FormattedMessage id="main.label.catchs" defaultMessage="Déploiements" />
                        </button>
                    }
                    <button
                        className="button--edit--tiny"
                        onClick={() => element.editItem('site', settings.original)}
                    >
                        <i className="fa fa-pencil-square-o" />
                        <FormattedMessage id="main.label.detail" defaultMessage="Détails" />
                    </button>
                </section>
            ),
        },
    ]
);
export default sitesColumns;

