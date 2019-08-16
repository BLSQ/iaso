import React from 'react';
import { FormattedMessage } from 'react-intl';

const managementTeamsColumns = (formatMessage, component, teamTypes) => ([
    {
        Header: formatMessage({
            defaultMessage: 'Type',
            id: 'main.label.team_type',
        }),
        accessor: 'team_type',
        Cell: settings => (
            <span>
                {settings.original.team_type ? teamTypes.find(type => type.value === settings.original.team_type).label : '/'}
            </span>
        ),
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
            defaultMessage: 'Capacity',
            id: 'main.label.capacity',
        }),
        accessor: 'capacity',
    },
    {
        Header: formatMessage({
            defaultMessage: 'Type de dépistage',
            id: 'main.label.screening_type',
        }),
        accessor: 'UM',
        Cell: settings => (
            <span>
                {settings.original.UM === true && 'UM'}
                {settings.original.UM === false && 'MUM'}
                {settings.original.UM === null && '/'}
            </span>
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
            id: 'main.label.actions',
        }),
        sortable: false,
        resizable: false,
        width: 250,
        Cell: settings => (
            <section>
                {settings.original.team_type === 'tester' &&
                    <button
                        className="button--tiny margin-right"
                        onClick={() => component.selectTeam(settings.original)}
                    >
                        <i className="fa fa-info-circle" />
                        <FormattedMessage id="main.label.infos" defaultMessage="Infos" />
                    </button>}
                <button
                    className="button--edit--tiny margin-right"
                    onClick={() => component.editTeam(settings.original)}
                >
                    <i className="fa fa-pencil-square-o" />
                    <FormattedMessage id="main.label.edit" defaultMessage="Edit" />
                </button>
                <button
                    className="button--delete--tiny"
                    onClick={() => component.showDelete(settings.original)}
                >
                    <i className="fa fa-trash" />
                    <FormattedMessage id="main.label.delete" defaultMessage="Delete" />
                </button>
            </section>
        ),
    },
]
);
export default managementTeamsColumns;
