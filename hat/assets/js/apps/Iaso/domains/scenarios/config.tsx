import React, { useMemo } from 'react';
import { Box, Chip, Typography } from '@mui/material';
import {
    Column,
    LinkWithLocation,
    Setting,
    useSafeIntl,
} from 'bluesquare-components';
import { ScenarioList } from 'Iaso/api/scenarios';
import { baseUrls } from 'Iaso/constants/urls';
import { SxStyles } from 'Iaso/types/general';
import { ActionsCell } from './components/ActionsCell';
import { StatusChip } from './components/StatusChip';
import MESSAGES from './messages';

const styles: SxStyles = {
    name: { fontWeight: 500 },
    secondary: { color: 'text.secondary' },
    journey: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 0.5,
    },
    failure: { color: 'error.main', mt: 0.5 },
};

type Params = {
    workflowVersionId?: number;
    onRun: (scenarioIds: number[]) => void;
    onDelete: (scenarioId: number) => void;
    isRunning: boolean;
};

export const scenarioDetailUrl = (
    scenarioId: number,
    workflowVersionId?: number,
): string =>
    `/${baseUrls.scenarioDetail}/scenarioId/${scenarioId}${workflowVersionId ? `/versionId/${workflowVersionId}` : ''}`;

export const useScenariosColumns = ({
    workflowVersionId,
    onRun,
    onDelete,
    isRunning,
}: Params): Column[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(
        () => [
            {
                Header: formatMessage(MESSAGES.scenario),
                id: 'name',
                accessor: 'name',
                sortable: false,
                Cell: (settings: Setting<ScenarioList>) => {
                    const scenario = settings.row.original;
                    return (
                        <Box>
                            <LinkWithLocation
                                to={scenarioDetailUrl(
                                    scenario.id,
                                    workflowVersionId,
                                )}
                            >
                                <Typography component="span" sx={styles.name}>
                                    {scenario.name}
                                </Typography>
                            </LinkWithLocation>
                            {scenario.description && (
                                <Typography
                                    variant="body2"
                                    sx={styles.secondary}
                                >
                                    {scenario.description}
                                </Typography>
                            )}
                        </Box>
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.journey),
                id: 'journey',
                accessor: 'journey',
                sortable: false,
                Cell: (settings: Setting<ScenarioList>) => (
                    <Box sx={styles.journey}>
                        {settings.row.original.journey
                            .map((form, index) => ({ form, step: index + 1 }))
                            .map(({ form, step }) => (
                                // a form can be filled at several steps: keyed by step
                                <React.Fragment key={step}>
                                    {step > 1 && '→'}
                                    <Chip size="small" label={form} />
                                </React.Fragment>
                            ))}
                    </Box>
                ),
            },
            {
                Header: formatMessage(MESSAGES.lastResult),
                id: 'last_run_status',
                accessor: 'last_run_status',
                sortable: false,
                Cell: (settings: Setting<ScenarioList>) => {
                    const scenario = settings.row.original;
                    // the first line of the first failure: the scenario's page explains it
                    const failure =
                        scenario.last_run_failures[0]?.split('\n')[0];
                    const otherVersion =
                        workflowVersionId !== undefined &&
                        scenario.last_run_workflow_version_id !== null &&
                        scenario.last_run_workflow_version_id !==
                            workflowVersionId;
                    return (
                        <Box>
                            <StatusChip
                                status={scenario.last_run_status}
                                step={scenario.last_run_failed_step}
                            />
                            {otherVersion && (
                                <Typography
                                    variant="body2"
                                    sx={styles.secondary}
                                >
                                    {formatMessage(MESSAGES.onOtherVersion)}
                                </Typography>
                            )}
                            {failure && (
                                <Typography variant="body2" sx={styles.failure}>
                                    {failure}
                                </Typography>
                            )}
                        </Box>
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.actions),
                id: 'actions',
                accessor: 'actions',
                sortable: false,
                Cell: (settings: Setting<ScenarioList>) => (
                    <ActionsCell
                        scenario={settings.row.original}
                        onRun={onRun}
                        onDelete={onDelete}
                        isRunning={isRunning}
                    />
                ),
            },
        ],
        [formatMessage, workflowVersionId, onRun, onDelete, isRunning],
    );
};
