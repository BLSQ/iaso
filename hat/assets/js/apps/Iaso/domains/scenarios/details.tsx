import React, { FunctionComponent, useState } from 'react';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    FormControlLabel,
    Paper,
    Switch,
    Typography,
} from '@mui/material';
import {
    LoadingSpinner,
    useGoBack,
    useRedirectTo,
    useRedirectToReplace,
    useSafeIntl,
} from 'bluesquare-components';
import moment from 'moment';
import { useApiScenariosRetrieve } from 'Iaso/api/scenarios';
import InputComponent from 'Iaso/components/forms/InputComponent';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { baseUrls } from 'Iaso/constants/urls';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import { SxStyles } from 'Iaso/types/general';
import { AppWillDo } from './components/AppWillDo';
import { EntityAtThisPoint } from './components/EntityAtThisPoint';
import { FailureCard } from './components/FailureCard';
import { FormsOffered } from './components/FormsOffered';
import { JourneySteps } from './components/JourneySteps';
import { ProfileAtEachStep } from './components/ProfileAtEachStep';
import { StepDetail } from './components/StepDetail';
import {
    getDefaultVersionId,
    useGetWorkflowVersionOptions,
} from './hooks/requests/useGetWorkflowVersionOptions';
import { useRunScenarios } from './hooks/useRunScenarios';
import { useTechnicalNames } from './hooks/useTechnicalNames';
import MESSAGES from './messages';
import { pageStyles } from './styles';
import {
    downloadJson,
    getSteps,
    parseLastRun,
    scenarioFileName,
} from './utils';

const styles: SxStyles = {
    main: {
        maxWidth: 1400,
        mx: 'auto',
        p: { xs: 2, md: 3 },
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
    },
    columns: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 2,
        alignItems: 'flex-start',
    },
    journey: {
        flex: '1 1 220px',
        maxWidth: { md: 300 },
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
    },
    step: {
        flex: '999 1 460px',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
    },
    side: { flex: '1 1 260px', maxWidth: { md: 320 } },
    header: {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        gap: 2,
    },
    titleBlock: { display: 'flex', flexDirection: 'column', gap: 0.75 },
    title: { fontSize: 26, fontWeight: 500 },
    secondary: { color: 'text.secondary' },
    actions: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 2,
    },
    version: { minWidth: 260 },
    passed: { p: 3 },
    sections: { p: 1 },
};

/** One scenario: its journey, its last result explained, everything needed to understand a failure. */
export const ScenarioDetail: FunctionComponent = () => {
    const params = useParamsObject(baseUrls.scenarioDetail);
    const { formatMessage } = useSafeIntl();
    const redirectToReplace = useRedirectToReplace();
    const redirectTo = useRedirectTo();
    const [showTechnicalNames, setShowTechnicalNames] = useTechnicalNames();
    const [selected, setSelected] = useState<number>();

    const { data: scenario, isFetching } = useApiScenariosRetrieve(
        Number(params.scenarioId),
    );
    const { data: versions = [] } = useGetWorkflowVersionOptions(
        scenario?.entity_type_id,
    );
    const versionId =
        getDefaultVersionId(versions, params.versionId) ??
        scenario?.last_run_workflow_version_id ??
        undefined;
    const { run, isRunning } = useRunScenarios(
        scenario?.kind === 'entity' ? versionId : undefined,
    );
    const goBack = useGoBack(
        scenario?.entity_type_id
            ? `${baseUrls.scenarios}/entityTypeId/${scenario.entity_type_id}`
            : baseUrls.entityTypes,
    );

    if (!scenario) {
        return isFetching ? <LoadingSpinner /> : null;
    }
    const lastRun = parseLastRun(scenario.last_run_result);
    const forms = lastRun?.forms ?? {};
    const steps = getSteps(scenario.definition, lastRun);
    const stopped = steps.find(
        step => step.status !== 'ok' && step.status !== 'not_run',
    );
    const lastRan = [...steps].reverse().find(step => step.result);
    const referenceFormFormId = steps[0]?.formId ?? '';
    const lastRunVersion = versions.find(
        option => option.value === scenario.last_run_workflow_version_id,
    );

    // the step shown: the one picked, else where it stopped, else the last one that ran
    const shown =
        steps.find(step => step.index === selected) ??
        stopped ??
        lastRan ??
        steps[0];
    const before = steps.find(step => step.index === (shown?.index ?? 0) - 1);
    const isEntity = scenario.kind === 'entity';

    // the forms offered at that step (before it for a form not offered, else after it)
    const offered =
        shown?.status === 'not_offered'
            ? shown.result?.offered_before
            : shown?.result?.next;
    const offeredTitle =
        shown?.status === 'not_offered'
            ? formatMessage(MESSAGES.formsOfferedBefore, {
                  index: String(shown.index),
              })
            : formatMessage(MESSAGES.formsOfferedAfter, {
                  index: String(shown?.index ?? ''),
              });

    return (
        <>
            <TopBar
                title={scenario.name}
                displayBackButton
                goBack={() => goBack()}
            />
            <Box sx={pageStyles.scroll}>
                <Box sx={styles.main}>
                    <Box sx={styles.header}>
                        <Box sx={styles.titleBlock}>
                            <Typography component="h1" sx={styles.title}>
                                {scenario.name}
                            </Typography>
                            {scenario.description && (
                                <Typography>{scenario.description}</Typography>
                            )}
                            <Typography variant="body2" sx={styles.secondary}>
                                {scenario.last_run_at
                                    ? formatMessage(MESSAGES.lastRunOn, {
                                          when: moment(
                                              scenario.last_run_at,
                                          ).fromNow(),
                                          version:
                                              lastRunVersion?.label ??
                                              formatMessage(MESSAGES.formsOnly),
                                      })
                                    : formatMessage(MESSAGES.notRunYet)}
                            </Typography>
                        </Box>
                        <Box sx={styles.actions}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={showTechnicalNames}
                                        onChange={event =>
                                            setShowTechnicalNames(
                                                event.target.checked,
                                            )
                                        }
                                    />
                                }
                                label={formatMessage(
                                    MESSAGES.showTechnicalNames,
                                )}
                            />
                            {scenario.kind === 'entity' && (
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
                                            redirectToReplace(
                                                baseUrls.scenarioDetail,
                                                {
                                                    ...params,
                                                    versionId: String(value),
                                                },
                                            )
                                        }
                                    />
                                </Box>
                            )}
                            {scenario.kind === 'entity' &&
                                scenario.entity_type_id && (
                                    <Button
                                        variant="outlined"
                                        startIcon={<EditIcon />}
                                        onClick={() =>
                                            redirectTo(baseUrls.scenarioEdit, {
                                                entityTypeId: String(
                                                    scenario.entity_type_id,
                                                ),
                                                scenarioId: String(scenario.id),
                                                ...(versionId
                                                    ? {
                                                          versionId:
                                                              String(versionId),
                                                      }
                                                    : {}),
                                            })
                                        }
                                    >
                                        {formatMessage(MESSAGES.edit)}
                                    </Button>
                                )}
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<PlayArrowIcon />}
                                disabled={isRunning}
                                onClick={() => run([scenario.id])}
                            >
                                {formatMessage(
                                    scenario.last_run_at
                                        ? MESSAGES.runAgain
                                        : MESSAGES.run,
                                )}
                            </Button>
                        </Box>
                    </Box>

                    {lastRun && lastRun.status !== 'passed' && (
                        <FailureCard
                            status={lastRun.status}
                            step={lastRun.failed_step}
                            failures={
                                stopped?.result?.failures ?? lastRun.failures
                            }
                            showTechnicalNames={showTechnicalNames}
                        />
                    )}
                    {lastRun?.status === 'passed' && (
                        <Paper sx={styles.passed}>
                            <Typography>
                                {formatMessage(MESSAGES.allChecksPass)}
                            </Typography>
                        </Paper>
                    )}

                    <Box sx={styles.columns}>
                        <Box sx={styles.journey}>
                            <JourneySteps
                                steps={steps}
                                selected={shown?.index}
                                forms={forms}
                                showTechnicalNames={showTechnicalNames}
                                onSelect={setSelected}
                            />
                            {isEntity && shown && (
                                <EntityAtThisPoint
                                    entityType={scenario.entity_type_name ?? ''}
                                    before={before?.result?.profile ?? {}}
                                    after={shown.result?.profile}
                                    forms={forms}
                                    referenceFormId={referenceFormFormId}
                                    showTechnicalNames={showTechnicalNames}
                                    noAfter={MESSAGES.stepNotRun}
                                />
                            )}
                        </Box>

                        <Box sx={styles.step}>
                            {shown && (
                                <StepDetail
                                    step={shown}
                                    forms={forms}
                                    referenceFormId={referenceFormFormId}
                                    showTechnicalNames={showTechnicalNames}
                                />
                            )}
                            {offered && scenario.reference_form_id && (
                                <FormsOffered
                                    title={offeredTitle}
                                    offered={offered}
                                    forms={forms}
                                    referenceFormId={scenario.reference_form_id}
                                    referenceFormFormId={referenceFormFormId}
                                    showTechnicalNames={showTechnicalNames}
                                />
                            )}
                        </Box>

                        {isEntity && (
                            <Box sx={styles.side}>
                                <AppWillDo
                                    result={shown?.result}
                                    forms={forms}
                                    referenceFormId={referenceFormFormId}
                                    isLoading={isRunning}
                                    hasRun
                                />
                            </Box>
                        )}
                    </Box>

                    {lastRun && (
                        <Paper sx={styles.sections}>
                            {isEntity && (
                                <Accordion disableGutters elevation={0}>
                                    <AccordionSummary
                                        expandIcon={<ExpandMoreIcon />}
                                    >
                                        {formatMessage(
                                            MESSAGES.informationAtEachStep,
                                            {
                                                entityType:
                                                    scenario.entity_type_name ??
                                                    '',
                                            },
                                        )}
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <ProfileAtEachStep
                                            steps={steps}
                                            forms={forms}
                                            referenceFormFormId={
                                                referenceFormFormId
                                            }
                                            showTechnicalNames={
                                                showTechnicalNames
                                            }
                                        />
                                    </AccordionDetails>
                                </Accordion>
                            )}
                            <Accordion disableGutters elevation={0}>
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                >
                                    {formatMessage(MESSAGES.forSupport)}
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Typography
                                        variant="body2"
                                        sx={styles.secondary}
                                        mb={1}
                                    >
                                        {formatMessage(MESSAGES.forSupportText)}
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        startIcon={<DownloadIcon />}
                                        onClick={() =>
                                            downloadJson(
                                                scenarioFileName(scenario.name),
                                                scenario.definition,
                                            )
                                        }
                                    >
                                        {formatMessage(
                                            MESSAGES.downloadScenarioFile,
                                        )}
                                    </Button>
                                </AccordionDetails>
                            </Accordion>
                        </Paper>
                    )}
                </Box>
            </Box>
        </>
    );
};
