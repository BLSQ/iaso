import React from 'react';
import IconButtonComponent from '../../components/buttons/IconButtonComponent';
import DataSourceDialogComponent from './components/DataSourceDialogComponent';
import MESSAGES from './messages';

const dataSourcesTableColumns = (formatMessage, setForceRefresh) => [
    {
        Header: formatMessage(MESSAGES.dataSourceName),
        accessor: 'name',
        Cell: settings => {
            return <span>{settings.original.name}</span>;
        },
    },
    {
        Header: formatMessage(MESSAGES.dataSourceDescription),
        accessor: 'description',
        Cell: settings => <span>{settings.original.description}</span>,
    },
    {
        Header: formatMessage(MESSAGES.dataSourceReadOnly),
        accessor: 'read_only',
        Cell: settings => (
            <span>
                {settings.original.read_only === true
                    ? formatMessage(MESSAGES.yes)
                    : formatMessage(MESSAGES.no)}
            </span>
        ),
    },
    {
        Header: formatMessage(MESSAGES.actions),
        resizable: false,
        sortable: false,
        Cell: settings => (
            <section>
                <DataSourceDialogComponent
                    renderTrigger={({ openDialog }) => (
                        <IconButtonComponent
                            onClick={openDialog}
                            icon="edit"
                            tooltipMessage={MESSAGES.edit}
                        />
                    )}
                    initialData={{
                        ...settings.original,
                        projects: settings.original.projects.flat(),
                    }}
                    titleMessage={MESSAGES.updateDataSource}
                    key={settings.original.updated_at}
                    onSuccess={() => setForceRefresh(true)}
                />
            </section>
        ),
    },
];
export default dataSourcesTableColumns;
