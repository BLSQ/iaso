import React, { Fragment } from 'react';

const areasTableColumns = (
    formatMessage,
    component,
    userCanEditOrDelete,
    userCanEditShape,
) => {
    const tableColumns = [
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
            accessor: 'ZS__province__name',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Zone',
                id: 'main.label.zone',
            }),
            accessor: 'ZS__name',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Alias',
                id: 'main.label.aliases',
            }),
            sortable: false,
            accessor: 'aliases',
            Cell: settings => (
                <section>
                    {settings.original.aliases && settings.original.aliases.map(a => (
                        <span key={a}>
                            {a}
                            <br />
                        </span>
                    ))}
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
        tableColumns.push({
            Header: formatMessage({
                defaultMessage: 'Actions',
                id: 'main.label.actions',
            }),
            sortable: false,
            resizable: false,
            width: 300,
            Cell: settings => (
                <section>
                    {userCanEditOrDelete
                        && (
                            <Fragment>

                                <button
                                    className="button--edit--tiny  margin-right"
                                    onClick={() => component.editShape(settings.original)}
                                >
                                    <i className="fa fa-map-o" />
                                    {
                                        settings.original.has_shape
                                        && (
                                            formatMessage({
                                                defaultMessage: 'Edit shape',
                                                id: 'main.label.editMap',
                                            })
                                        )}
                                    {
                                        !settings.original.has_shape
                                        && (
                                            formatMessage({
                                                defaultMessage: 'Add shape',
                                                id: 'main.label.addShape',
                                            })
                                        )}
                                </button>
                                <button
                                    className="button--edit--tiny  margin-right"
                                    onClick={() => component.props.selectArea(settings.original)}
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
                                    onClick={() => component.setState({
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
                            </Fragment>
                        )}
                </section>
            ),
        });
    }
    return tableColumns;
};
export default areasTableColumns;
