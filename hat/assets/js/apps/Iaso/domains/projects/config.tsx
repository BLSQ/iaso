import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { Box, Switch, Tooltip } from '@mui/material';
import {
    Column,
    IntlMessage,
    textPlaceholder,
    useSafeIntl,
} from 'bluesquare-components';
import React, { ReactElement, useMemo } from 'react';
import { EditProjectDialog } from './components/CreateEditProjectDialog';

import { baseUrls } from '../../constants/urls';

import MESSAGES from './messages';
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
    formatMessage: (msg: IntlMessage) => string,
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
            settings.value
                .map(fF =>
                    MESSAGES[fF.code.toLowerCase()]
                        ? formatMessage(MESSAGES[fF.code.toLowerCase()])
                        : fF.name || fF.id,
                )
                .join(', ') || textPlaceholder,
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

export const useFeatureFlagColumns = (
    setFeatureFlag: (featureFlag: FeatureFlag, isChecked: boolean) => void,
    featureFlagsValues: (string | number)[],
): Array<Column> => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        return [
            {
                Header: '',
                id: 'tooltip',
                sortable: false,
                align: 'center',
                width: 50,
                Cell: settings => {
                    const title = MESSAGES[
                        `${settings.row.original.code.toLowerCase()}_tooltip`
                    ]
                        ? MESSAGES[
                              `${settings.row.original.code.toLowerCase()}_tooltip`
                          ]
                        : settings.row.original.name;
                    return (
                        <Box style={{ cursor: 'pointer' }}>
                            <Tooltip
                                title={formatMessage(title)}
                                disableInteractive={false}
                                leaveDelay={500}
                                placement="left-start"
                                arrow
                            >
                                <HelpOutlineIcon color="primary" />
                            </Tooltip>
                        </Box>
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.featureFlags),
                id: 'name',
                accessor: 'name',
                sortable: false,
                width: 250,
                align: 'left',
                Cell: settings => {
                    return settings.row.original.name;
                },
            },
            {
                Header: formatMessage(MESSAGES.project_featureFlags),
                id: 'code',
                accessor: 'code',
                sortable: false,
                Cell: settings => {
                    return (
                        <Switch
                            data-test="featureFlag-checkbox"
                            id={`featureFlag-checkbox-${settings.row.original.id}`}
                            checked={Boolean(
                                featureFlagsValues.includes(
                                    settings.row.original.id,
                                ),
                            )}
                            onChange={e => {
                                setFeatureFlag(
                                    settings.row.original,
                                    e.target.checked,
                                );
                            }}
                            name={settings.row.original.id}
                            color="primary"
                        />
                    );
                },
            },
        ];
    }, [featureFlagsValues, formatMessage, setFeatureFlag]);
};
