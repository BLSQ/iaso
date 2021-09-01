import React from 'react';
import {
    IconButton as IconButtonComponent,
    textPlaceholder,
} from 'bluesquare-components';
import ProjectsDialog from './components/ProjectsDialog';

import MESSAGES from './messages';

const projectsTableColumns = (formatMessage, component) => [
    {
        Header: formatMessage(MESSAGES.projectName),
        accessor: 'name',
    },
    {
        Header: formatMessage(MESSAGES.appId),
        accessor: 'app_id',
    },
    {
        Header: formatMessage(MESSAGES.featureFlags),
        accessor: 'feature_flags',
        Cell: settings =>
            settings.value.map(fF => fF.name).join(', ') || textPlaceholder,
    },
    {
        Header: formatMessage(MESSAGES.actions),
        accessor: 'actions',
        resizable: false,
        sortable: false,
        Cell: settings => (
            <section>
                <ProjectsDialog
                    renderTrigger={({ openDialog }) => (
                        <IconButtonComponent
                            onClick={openDialog}
                            icon="edit"
                            tooltipMessage={MESSAGES.edit}
                        />
                    )}
                    initialData={settings.row.original}
                    titleMessage={MESSAGES.updateProject}
                    key={settings.row.original.updated_at}
                    params={component.props.params}
                    featureFlags={component.props.featureFlags}
                />
            </section>
        ),
    },
];

export default projectsTableColumns;
