import React, { ReactElement, useMemo } from 'react';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Box, Button, Chip, Switch, Tooltip } from '@mui/material';
import { Column, textPlaceholder, useSafeIntl } from 'bluesquare-components';
import Color from 'color';
import { baseUrls } from '../../constants/urls';
import { EditProjectDialog } from './components/CreateEditProjectDialog';

import { QrCode } from './components/QrCode';
import MESSAGES from './messages';
import { FeatureFlag } from './types/featureFlag';
import { Project } from './types/project';
import { ExpandLess, ExpandMore } from '@mui/icons-material';

export const baseUrl = baseUrls.projects;
export const useColumns = (
    saveProject: (s: Project) => Promise<any>,
): Array<Column> => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        return [
            {
                Header: formatMessage(MESSAGES.projectName),
                accessor: 'name',
                Cell: settings => {
                    const textColor = Color(
                        settings.row.original.color,
                    ).isDark()
                        ? 'white'
                        : 'black';
                    return (
                        <Chip
                            label={settings.row.original.name}
                            sx={{
                                backgroundColor: settings.row.original.color,
                                color: textColor,
                            }}
                        />
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.appId),
                accessor: 'app_id',
                Cell: settings => {
                    return settings.row.original.app_id;
                },
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
                    <Box
                        display="flex"
                        alignItems="center"
                        gap={1}
                        justifyContent="center"
                    >
                        <EditProjectDialog
                            initialData={settings.row.original}
                            saveProject={saveProject}
                            dialogType="edit"
                            iconProps={{}}
                        />
                        {settings.row.original.qr_code && (
                            <QrCode qrCode={settings.row.original.qr_code} />
                        )}
                    </Box>
                ),
            },
        ];
    }, [formatMessage, saveProject]);
};

export const useFeatureFlagColumns = (
    setFeatureFlag: (featureFlag: FeatureFlag, isChecked: boolean) => void,
    toggleFeatureGroup: (group: string) => void,
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
                    return !settings.row.original.group ? (
                        <Box style={{ cursor: 'pointer' }}>
                            <Tooltip
                                title={formatMessage(title)}
                                disableInteractive={false}
                                leaveDelay={500}
                                placement="left-start"
                                arrow
                            >
                                {settings.row.original.is_dangerous ? (
                                    <WarningAmberIcon color="warning" />
                                ) : (
                                    <HelpOutlineIcon color="primary" />
                                )}
                            </Tooltip>
                        </Box>
                    ) : (
                        <Button
                            variant="text"
                            onClick={() =>
                                toggleFeatureGroup(settings.row.original.code)
                            }
                        >
                            {settings.row.original.collapsed ? (
                                <ExpandMore />
                            ) : (
                                <ExpandLess />
                            )}
                        </Button>
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
                    if (settings.row.original.group) {
                        return (
                            <strong>
                                {formatMessage(
                                    MESSAGES[
                                        `featureFlag_${settings.row.original.code}`
                                    ],
                                )}
                            </strong>
                        );
                    }
                    return settings.row.original.name;
                },
            },
            {
                Header: formatMessage(MESSAGES.project_featureFlags),
                id: 'code',
                accessor: 'code',
                sortable: false,
                Cell: settings => {
                    return !settings.row.original.group ? (
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
                    ) : (
                        ''
                    );
                },
            },
        ];
    }, [featureFlagsValues, formatMessage, setFeatureFlag, toggleFeatureGroup]);
};
