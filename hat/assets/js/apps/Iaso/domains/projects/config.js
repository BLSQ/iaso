import React from 'react';
import { textPlaceholder } from '../../constants/uiConstants';
import IconButtonComponent from '../../components/buttons/IconButtonComponent';
import ProjectsDialog from './components/ProjectsDialog';

import MESSAGES from './messages';

const projectsTableColumns = (formatMessage, component) => [
    {
        Header: formatMessage(MESSAGES.projectName),
        accessor: 'project__name',
        Cell: settings => <span>{settings.original.name}</span>,
    },
    {
        Header: formatMessage(MESSAGES.appId),
        accessor: 'project__app_id',
        Cell: settings => (
            <span>{settings.original.app_id || textPlaceholder}</span>
        ),
    },
    {
        Header: formatMessage(MESSAGES.featureFlags),
        accessor: 'project__needs_authentication',
        Cell: settings => (
            <span>
                {settings.original.feature_flags
                    .map(fF => fF.name)
                    .join(', ') || textPlaceholder}
            </span>
        ),
    },
    {
        Header: formatMessage(MESSAGES.actions),
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
                    initialData={settings.original}
                    titleMessage={MESSAGES.updateProject}
                    key={settings.original.updated_at}
                    params={component.props.params}
                    featureFlags={component.props.featureFlags}
                />
            </section>
        ),
    },
];

export default projectsTableColumns;
