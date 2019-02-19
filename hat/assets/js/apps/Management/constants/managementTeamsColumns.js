import React from 'react';
import { FormattedMessage } from 'react-intl';

const managementTeamsColumns = (formatMessage, component) => ([
    {
        Header: formatMessage({
            defaultMessage: 'Nom',
            id: 'main.label.name',
        }),
        accessor: 'name',
    },
    {
        Header: formatMessage({
            defaultMessage: 'Capacité',
            id: 'main.label.capacity',
        }),
        accessor: 'capacity',
    },
    {
        Header: formatMessage({
            defaultMessage: 'Type',
            id: 'main.label.type',
        }),
        accessor: 'UM',
        Cell: settings => (
            <span>{settings.original.UM ? 'UM' : 'MUM'}</span>
        ),
    },
    {
        Header: formatMessage({
            defaultMessage: 'Coordination',
            id: 'main.label.coordination',
        }),
        accessor: 'coordination_id',
        Cell: (settings) => {
            if (component.state.coordinations.length > 0) {
                const coordName = component.state.coordinations.filter(c =>
                    c.id === parseInt(settings.original.coordination_id, 10))[0].name;
                return (
                    <span>{coordName}</span>
                );
            }
            return null;
        },
    },
    {
        Header: formatMessage({
            defaultMessage: 'Actions',
            id: 'main.actions',
        }),
        sortable: false,
        resizable: false,
        width: 250,
        Cell: settings => (
            <section>
                <button
                    className="button--tiny margin-right"
                    onClick={() => component.selectTeam(settings.original)}
                >
                    <i className="fa fa-info-circle" />
                    <FormattedMessage id="main.label.infos" defaultMessage="Infos" />
                </button>
                <button
                    className="button--edit--tiny margin-right"
                    onClick={() => component.editTeam(settings.original)}
                >
                    <i className="fa fa-pencil-square-o" />
                    <FormattedMessage id="main.label.edit" defaultMessage="Editer" />
                </button>
                <button
                    className="button--delete--tiny"
                    onClick={() => component.showDelete(settings.original)}
                >
                    <i className="fa fa-trash" />
                    <FormattedMessage id="main.label.delete" defaultMessage="Effacer" />
                </button>
            </section>
        ),
    },
]
);
export default managementTeamsColumns;
