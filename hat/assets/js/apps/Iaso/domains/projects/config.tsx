import React, { ReactElement } from 'react';
import { textPlaceholder, IntlMessage, Column } from 'bluesquare-components';
import { EditProjectDialog } from './components/CreateEditProjectDialog';

import { baseUrls } from '../../constants/urls';

import MESSAGES from './messages';

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
    // eslint-disable-next-line no-unused-vars
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
                <EditProjectDialog
                    initialData={settings.row.original}
                    saveProject={saveProject}
                    dialogType="edit"
                    iconProps={{}}
                />
            </section>
        ),
    },
];
