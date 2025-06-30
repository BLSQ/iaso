import React, { ReactElement, useEffect, useMemo } from 'react';
import { Box, Chip, Switch } from '@mui/material';
import { Column, textPlaceholder, useSafeIntl } from 'bluesquare-components';
import Color from 'color';
import { baseUrls } from '../../constants/urls';
import { EditProjectDialog } from './components/CreateEditProjectDialog';

import { FeatureFlagToggleCell } from './components/FeatureFlagsToggleCell';
import { FeatureFlagTooltipCell } from './components/FeatureFlagTooltipCell';
import { QrCode } from './components/QrCode';
import MESSAGES from './messages';
import { FeatureFlag, ProjectFeatureFlag } from './types/featureFlag';
import { Project } from './types/project';

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
    featureFlagsValues: ProjectFeatureFlag[],
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
                        <FeatureFlagTooltipCell
                            title={formatMessage(title)}
                            iconVariant={
                                settings.row.original.is_dangerous
                                    ? 'warning'
                                    : 'info'
                            }
                        />
                    ) : (
                        <FeatureFlagToggleCell
                            collapsed={settings.row.original.collapsed}
                            onToggle={() =>
                                toggleFeatureGroup(settings.row.original.code)
                            }
                        />
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
                            id={`featureFlag-checkbox-${settings.row.original.code}`}
                            checked={Boolean(
                                featureFlagsValues.find(
                                    ff => ff.id === settings.row.original.id,
                                ),
                            )}
                            onChange={e => {
                                setFeatureFlag(
                                    settings.row.original,
                                    e.target.checked,
                                );
                            }}
                            name={settings.row.original.code}
                            color="primary"
                        />
                    ) : (
                        ''
                    );
                },
            },
            {
                Header: '',
                id: 'expander',
                width: 1,
                expander: true,
                Expander: ({ _, setIsExpanded }) => {
                    useEffect(() => {
                        setTimeout(() => setIsExpanded(true), 100);
                    }, [setIsExpanded]);
                    return null;
                },
            },
        ];
    }, [featureFlagsValues, formatMessage, setFeatureFlag, toggleFeatureGroup]);
};
