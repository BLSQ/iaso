import React, { ReactElement } from 'react';
import {
    IconButton as IconButtonComponent,
    textPlaceholder,
} from 'bluesquare-components';
import { ProjectsDialog } from './components/ProjectsDialog';

import { baseUrls } from '../../constants/urls';

import MESSAGES from './messages';
import { Column } from '../../types/table';
import { IntlMessage } from '../../types/intl';

import { FeatureFlag } from './types/featureFlag';
import { Project } from './types/project';

type Params = {
    pageSize: string;
    order: string;
    page: string;
    search?: string;
};

export const baseUrl = baseUrls.projects;
export const columns = (
    // eslint-disable-next-line no-unused-vars
    formatMessage: (msg: IntlMessage) => string,
    // eslint-disable-next-line no-unused-vars
    params: Params,
    saveProject: (s: Project) => Promise<any>,
): Array<Column> => [
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
        sortable: false,
        Cell: settings =>
            settings.value.map(fF => fF.name).join(', ') || textPlaceholder,
    },
    {
        Header: formatMessage(MESSAGES.actions),
        accessor: 'actions',
        resizable: false,
        sortable: false,
        Cell: (settings): ReactElement => (
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
                    saveProject={saveProject}
                />
            </section>
        ),
    },
];
