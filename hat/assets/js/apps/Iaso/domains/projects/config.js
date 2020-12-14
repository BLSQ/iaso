import React from 'react';
import PropTypes from 'prop-types';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBoxOutlinedIcon from '@material-ui/icons/CheckBoxOutlined';
import Tooltip from '@material-ui/core/Tooltip';
import { textPlaceholder } from '../../constants/uiConstants';
import IconButtonComponent from '../../components/buttons/IconButtonComponent';
import ProjectsDialog from './components/ProjectsDialog';

import MESSAGES from './messages';

const NEEDS_AUTH_ICONS = {
    false: CheckBoxOutlineBlankIcon,
    true: CheckBoxOutlinedIcon,
};

function NeedsAuthIcon({ IconComponent, title }) {
    return (
        <div>
            <Tooltip title={title}>
                <IconComponent />
            </Tooltip>
        </div>
    );
}

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
        Header: formatMessage(MESSAGES.needsAuthentication),
        accessor: 'project__needs_authentication',
        Cell: settings => (
            <span>
                <NeedsAuthIcon
                    IconComponent={
                        NEEDS_AUTH_ICONS[settings.original.needs_authentication]
                    }
                    title={formatMessage(
                        MESSAGES[settings.original.needs_authentication],
                    )}
                />
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

NeedsAuthIcon.propTypes = {
    title: PropTypes.string.isRequired,
    IconComponent: PropTypes.object.isRequired,
};

export default projectsTableColumns;
