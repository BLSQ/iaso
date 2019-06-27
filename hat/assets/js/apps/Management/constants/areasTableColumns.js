import React from 'react';

const areasTableColumns = (
    formatMessage,
    component,
    userCanEditOrDelete,
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
    if (userCanEditOrDelete) {
        tableColumns.push({
            Header: formatMessage({
                defaultMessage: 'Actions',
                id: 'main.actions',
            }),
            sortable: false,
            resizable: false,
            width: 200,
            Cell: settings => (
                <section>
                    <button
                        className="button--edit--tiny  margin-right"
                        onClick={() =>
                            component.props.selectArea(settings.original)}
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
                </section>
            ),
        });
    }
    return tableColumns;
};
export default areasTableColumns;
