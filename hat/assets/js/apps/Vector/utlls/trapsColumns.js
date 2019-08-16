import moment from 'moment';
import React from 'react';
import { FormattedMessage } from 'react-intl';

const trapsColumns = (formatMessage, messages, habitats, getDetail) => (
    [
        {
            Header: 'UUID',
            className: 'small',
            accessor: 'uuid',
            width: 250,
        },
        {
            Header: formatMessage({
                defaultMessage: 'Created at',
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
                defaultMessage: 'Name',
                id: 'main.label.name',
            }),
            className: 'small',
            accessor: 'name',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Site',
                id: 'main.label.site',
            }),
            className: 'small',
            accessor: 'site__name',
            Cell: settings => (
                <span>
                    {
                        settings.original.site ?
                            settings.original.site.name :
                            formatMessage(messages.unknown)
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Catches',
                id: 'main.label.catches',
            }),
            className: 'small',
            accessor: 'catches_count',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Mouches',
                id: 'main.label.flies',
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
                defaultMessage: 'User',
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
            Cell: (settings) => {
                const currentHabitat = habitats.find(h => h[0] === settings.original.habitat);
                return (
                    <span>
                        {
                            currentHabitat ?
                                formatMessage({
                                    id: `vectors.label.${currentHabitat[0]}`,
                                    defaultMessage: currentHabitat[1],
                                }) :
                                formatMessage(messages.unknown)
                        }
                    </span>
                );
            },
        },
        {
            Header: formatMessage({
                defaultMessage: 'Actions',
                id: 'main.label.actions',
            }),
            sortable: false,
            resizable: false,
            width: 220,
            Cell: settings => (
                <section>
                    <button
                        className="button--edit--tiny"
                        onClick={() => getDetail(settings.original.id, 'traps', 'showEditTrapsModale')}
                    >
                        <i className="fa fa-pencil-square-o" />
                        <FormattedMessage id="main.label.edit" defaultMessage="Edit" />
                    </button>
                </section>
            ),
        },
    ]
);
export default trapsColumns;
