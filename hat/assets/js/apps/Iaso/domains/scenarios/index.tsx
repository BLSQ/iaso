import React, { FunctionComponent, useMemo } from 'react';
import AddIcon from '@mui/icons-material/Add';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Box, Button, Chip, Paper, Typography } from '@mui/material';
import {
    useGoBack,
    useRedirectTo,
    useRedirectToReplace,
    useSafeIntl,
} from 'bluesquare-components';
import moment from 'moment';
import { useApiScenariosList } from 'Iaso/api/scenarios';
import InputComponent from 'Iaso/components/forms/InputComponent';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { baseUrls } from 'Iaso/constants/urls';
import { useGetType } from 'Iaso/domains/entities/entityTypes/hooks/requests/entitiyTypes';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import { SxStyles } from 'Iaso/types/general';
import { MoreActionsMenu } from './components/MoreActionsMenu';
import { ScenariosTable } from './components/ScenariosTable';
import {
    getDefaultVersionId,
    useGetWorkflowVersionOptions,
} from './hooks/requests/useGetWorkflowVersionOptions';
import { useRunScenarios } from './hooks/useRunScenarios';
import MESSAGES from './messages';
import { pageStyles } from './styles';

const styles: SxStyles = {
    main: {
        // the whole width on a laptop, a readable one on a large screen
        maxWidth: 1800,
        mx: 'auto',
        px: { xs: 2, md: 3 },
        py: { xs: 2, md: 3 },
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
    },
    intro: { maxWidth: 900, color: 'text.secondary' },
    toolbar: {
        px: 2,
        py: 1.5,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
    },
    context: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 2,
    },
    version: { width: 300 },
    summary: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 1,
    },
    actions: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 1,
    },
    passing: {
        backgroundColor: 'success.light',
        color: 'success.contrastText',
    },
    failing: { backgroundColor: 'error.light', color: 'error.contrastText' },
    secondary: { color: 'text.secondary' },
};

/** The scenarios of an entity type, run against one of its workflow versions. */
export const Scenarios: FunctionComponent = () => {
    const params = useParamsObject(baseUrls.scenarios);
    const { formatMessage } = useSafeIntl();
    const redirectToReplace = useRedirectToReplace();
    const redirectTo = useRedirectTo();
    const goBack = useGoBack(baseUrls.entityTypes);
    const entityTypeId = Number(params.entityTypeId);

    const { data: entityType } = useGetType(params.entityTypeId);
    const { data: versions = [] } = useGetWorkflowVersionOptions(entityTypeId);
    const versionId = getDefaultVersionId(versions, params.versionId);

    const { data, isFetching } = useApiScenariosList({
        entity_type_id: entityTypeId,
        kind: 'entity',
    });
    const scenarios = useMemo(() => data?.results ?? [], [data]);
    const { run, isRunning } = useRunScenarios(versionId);

    const passing = scenarios.filter(
        scenario => scenario.last_run_status === 'passed',
    ).length;
    const notPassing = scenarios.filter(
        scenario =>
            scenario.last_run_status && scenario.last_run_status !== 'passed',
    ).length;
    const lastRunAt = scenarios
        .map(scenario => scenario.last_run_at)
        .filter((date): date is string => Boolean(date))
        .sort()
        .pop();

    const title = formatMessage(MESSAGES.scenariosFor, {
        entityType: entityType?.name ?? '',
    });
    return (
        <>
            <TopBar title={title} displayBackButton goBack={() => goBack()} />
            <Box sx={pageStyles.scroll}>
                <Box sx={styles.main}>
                    <Typography sx={styles.intro}>
                        {formatMessage(MESSAGES.intro)}
                    </Typography>

                    <Paper sx={styles.toolbar}>
                        <Box sx={styles.context}>
                            <Box sx={styles.version}>
                                <InputComponent
                                    type="select"
                                    keyValue="versionId"
                                    label={MESSAGES.testAgainst}
                                    value={versionId}
                                    options={versions}
                                    clearable={false}
                                    withMarginTop={false}
                                    onChange={(_: string, value: number) =>
                                        redirectToReplace(baseUrls.scenarios, {
                                            ...params,
                                            versionId: String(value),
                                        })
                                    }
                                />
                            </Box>
                            {lastRunAt && (
                                <Box sx={styles.summary}>
                                    {notPassing > 0 && (
                                        <Chip
                                            size="small"
                                            sx={styles.failing}
                                            label={formatMessage(
                                                MESSAGES.notPassingCount,
                                                { count: String(notPassing) },
                                            )}
                                        />
                                    )}
                                    <Chip
                                        size="small"
                                        sx={styles.passing}
                                        label={formatMessage(
                                            MESSAGES.passingCount,
                                            { count: String(passing) },
                                        )}
                                    />
                                    <Typography
                                        variant="body2"
                                        sx={styles.secondary}
                                    >
                                        {formatMessage(MESSAGES.lastRun, {
                                            when: moment(lastRunAt).fromNow(),
                                        })}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                        <Box sx={styles.actions}>
                            <Button
                                variant="outlined"
                                color="primary"
                                startIcon={<PlayArrowIcon />}
                                disabled={
                                    scenarios.length === 0 ||
                                    isRunning ||
                                    versionId === undefined
                                }
                                onClick={() =>
                                    run(scenarios.map(scenario => scenario.id))
                                }
                            >
                                {formatMessage(MESSAGES.runAll)}
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<AddIcon />}
                                onClick={() =>
                                    redirectTo(baseUrls.scenarioEdit, {
                                        entityTypeId: params.entityTypeId,
                                        ...(versionId
                                            ? { versionId: String(versionId) }
                                            : {}),
                                    })
                                }
                            >
                                {formatMessage(MESSAGES.newScenario)}
                            </Button>
                            <MoreActionsMenu />
                        </Box>
                    </Paper>

                    <Paper>
                        <ScenariosTable
                            scenarios={scenarios}
                            isFetching={isFetching}
                            workflowVersionId={versionId}
                            onRun={run}
                            isRunning={isRunning}
                            params={params}
                            baseUrl={baseUrls.scenarios}
                        />
                    </Paper>
                </Box>
            </Box>
        </>
    );
};
