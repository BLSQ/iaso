import React, { Fragment } from 'react';

const zonesTableColumns = (
    formatMessage,
    component,
    userCanEditOrDelete,
    userCanEditShape,
) => {
    const tableColumn =
    [
        {
            Header: formatMessage({
                defaultMessage: 'Nom',
                id: 'main.label.name',
            }),
            accessor: 'name',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Province',
                id: 'main.label.province',
            }),
            accessor: 'province__name',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Alias',
                id: 'main.label.source',
            }),
            sortable: false,
            accessor: 'aliases',
            Cell: settings => (
                <section>
                    {settings.original.aliases && settings.original.aliases.map(a => (<span key={a}>{a}<br /></span>))}
                    {(!settings.original.aliases || settings.original.aliases.length === 0) && '/'}
                </section>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Source',
                id: 'main.label.source',
            }),
            accessor: 'source',
        },
    ];
    if (userCanEditOrDelete || userCanEditShape) {
        tableColumn.push({
            Header: formatMessage({
                defaultMessage: 'Actions',
                id: 'main.actions',
            }),
            sortable: false,
            resizable: false,
            width: 300,
            Cell: settings => (
                <section>
                    {
                        userCanEditShape && settings.original.has_shape &&
                            <button
                                className="button--edit--tiny  margin-right"
                                onClick={() =>
                                    component.editShape(settings.original)}
                            >
                                <i className="fa fa-map-o" />
                                {
                                    formatMessage({
                                        defaultMessage: 'Editer la surface',
                                        id: 'main.label.editMap',
                                    })
                                }
                            </button>
                    }
                    {userCanEditOrDelete &&
                        <Fragment>
                            <button
                                className="button--edit--tiny  margin-right"
                                onClick={() =>
                                    component.props.selectZone(settings.original)}
                            >
                                <i className="fa fa-pencil-square-o" />
                                {
                                    formatMessage({
                                        defaultMessage: 'Editer',
                                        id: 'main.label.edit',
                                    })
                                }
                            </button>
                            <button
                                className="button--delete--tiny"
                                onClick={() =>
                                    component.setState({
                                        showDeleteModale: true,
                                        dataDeleted: settings.original,
                                    })}
                            >
                                <i className="fa fa-trash" />
                                {
                                    formatMessage({
                                        defaultMessage: 'Effacer',
                                        id: 'main.label.delete',
                                    })
                                }
                            </button>
                        </Fragment>}
                </section>
            ),
        });
    }
    return tableColumn;
};
export default zonesTableColumns;
