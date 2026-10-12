import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import SaveIcon from '@mui/icons-material/Save';
import {
    Alert,
    Box,
    Button,
    FormControlLabel,
    LinearProgress,
    MenuItem,
    Paper,
    Switch,
    TextField,
    Typography,
} from '@mui/material';
import {
    useGoBack,
    useRedirectTo,
    useRedirectToReplace,
    useSafeIntl,
} from 'bluesquare-components';
import {
    ScenarioOutcomeOutput,
    ScenarioStepPrepareResponse,
    useApiScenariosCreate,
    useApiScenariosFormsRetrieve,
    useApiScenariosPartialUpdate,
    useApiScenariosPrepareStepCreate,
    useApiScenariosPreviewCreate,
    useApiScenariosRetrieve,
} from 'Iaso/api/scenarios';
import InputComponent from 'Iaso/components/forms/InputComponent';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { baseUrls } from 'Iaso/constants/urls';
import { useGetType } from 'Iaso/domains/entities/entityTypes/hooks/requests/entitiyTypes';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import { SxStyles } from 'Iaso/types/general';
import { AppWillDo } from '../components/AppWillDo';
import { EntityAtThisPoint } from '../components/EntityAtThisPoint';
import { scenarioDetailUrl } from '../config';
import {
    getDefaultVersionId,
    useGetWorkflowVersionOptions,
} from '../hooks/requests/useGetWorkflowVersionOptions';
import { useTechnicalNames } from '../hooks/useTechnicalNames';
import MESSAGES from '../messages';
import { pageStyles } from '../styles';
import { ChecksPlaceholder } from './components/ChecksPlaceholder';
import { JourneyNav } from './components/JourneyNav';
import { NotOfferedHint } from './components/NotOfferedHint';
import { defaultChecks, StepChecks } from './components/StepChecks';
import { WebFormStep } from './components/WebFormStep';
import {
    answersFromSubmission,
    EditorStep,
    fromDefinition,
    StepExpect,
    toDefinition,
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
    header: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 2,
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    name: { flex: '1 1 420px' },
    version: { flex: '0 1 300px' },
    columns: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 2,
        alignItems: 'flex-start',
    },
    journey: {
        flex: '1 1 220px',
        maxWidth: { md: 260 },
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
    },
    form: {
        flex: '999 1 460px',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
    },
    stepCard: { p: 2, display: 'flex', flexDirection: 'column', gap: 2 },
    stepFields: { display: 'flex', flexWrap: 'wrap', gap: 2 },
    side: { flex: '1 1 260px', maxWidth: { md: 320 } },
    prefilled: { fontSize: 14 },
    actions: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 1,
        justifyContent: 'flex-end',
    },
};

const NO_STEP: EditorStep[] = [];

/** Writes a scenario by filling the forms in web-forms, step by step, as on the phone; then ticks what to check. */
export const ScenarioEditor: FunctionComponent = () => {
    const params = useParamsObject(baseUrls.scenarioEdit);
    const { formatMessage } = useSafeIntl();
    const redirectTo = useRedirectTo();
    const redirectToReplace = useRedirectToReplace();
    const [showTechnicalNames, setShowTechnicalNames] = useTechnicalNames();
    const scenarioId = params.scenarioId
        ? Number(params.scenarioId)
        : undefined;
    const entityTypeId = Number(params.entityTypeId);
    const goBack = useGoBack(
        `${baseUrls.scenarios}/entityTypeId/${entityTypeId}`,
    );

    const { data: existing } = useApiScenariosRetrieve(
        scenarioId ?? 0,
        undefined,
        {
            query: { enabled: scenarioId !== undefined },
        },
    );
    const { data: entityType } = useGetType(params.entityTypeId);
    const { data: workflowForms } = useApiScenariosFormsRetrieve({
        entity_type_id: entityTypeId,
    });
    const { data: versions = [] } = useGetWorkflowVersionOptions(entityTypeId);
    const versionId = getDefaultVersionId(versions, params.versionId);
    const editorForms = useMemo(
        () => workflowForms?.results ?? [],
        [workflowForms],
    );
    const formNames = useMemo(
        () =>
            Object.fromEntries(
                editorForms.map(form => [form.form_id, form.name]),
            ),
        [editorForms],
    );
    // the forms' names and question labels, as the run results give them
    const formDescriptions = useMemo(
        () =>
            Object.fromEntries(
                editorForms.map(form => [
                    form.form_id,
                    { name: form.name, labels: form.labels },
                ]),
            ),
        [editorForms],
    );
    const referenceForm = editorForms.find(form => form.is_reference);
    const referenceFormId = referenceForm?.form_id ?? '';

    // the scenario
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [steps, setSteps] = useState<EditorStep[]>(NO_STEP);
    const [loaded, setLoaded] = useState(scenarioId === undefined);
    useEffect(() => {
        if (existing && !loaded) {
            setName(existing.name);
            setDescription(existing.description ?? '');
            setSteps(fromDefinition(existing.definition));
            setLoaded(true);
        }
    }, [existing, loaded]);

    // the step being filled: `current` === steps.length for a new one
    const [current, setCurrent] = useState(0);
    const [stepForm, setStepForm] = useState('');
    const [stepDescription, setStepDescription] = useState('');
    const [stepAt, setStepAt] = useState('');
    const [offered, setOffered] = useState<string[]>([]);
    const [prepared, setPrepared] = useState<ScenarioStepPrepareResponse>();
    // the point the step starts from: the entity's information, the follow-ups as the app evaluates them
    const [startingPoint, setStartingPoint] =
        useState<ScenarioStepPrepareResponse>();
    const [answers, setAnswers] = useState<Record<string, string>>();
    const [outcome, setOutcome] = useState<ScenarioOutcomeOutput>();
    const [expect, setExpect] = useState<StepExpect>({});
    // the workflow version the open step was prepared against (undefined: no step opened yet)
    const [preparedFor, setPreparedFor] = useState<number | null>();

    const quiet = {
        mutation: {
            meta: { showSuccessSnackBar: false, useApiErrorMessage: true },
        },
    };
    const { mutateAsync: prepareStep, isLoading: isPreparing } =
        useApiScenariosPrepareStepCreate(quiet);
    const { mutateAsync: preview, isLoading: isPreviewing } =
        useApiScenariosPreviewCreate(quiet);
    const { mutateAsync: create, isLoading: isCreating } =
        useApiScenariosCreate({
            mutation: {
                meta: {
                    snackSuccessMessage: MESSAGES.scenarioSaved,
                    useApiErrorMessage: true,
                },
            },
        });
    const { mutateAsync: update, isLoading: isUpdating } =
        useApiScenariosPartialUpdate({
            mutation: {
                meta: {
                    snackSuccessMessage: MESSAGES.scenarioSaved,
                    useApiErrorMessage: true,
                },
            },
        });

    const definitionOf = useCallback(
        (someSteps: EditorStep[]) =>
            toDefinition(
                name || formatMessage(MESSAGES.newScenario),
                description,
                someSteps,
            ),
        [name, description, formatMessage],
    );

    // a step opened: its form (the first one the app offers there, for a new step), prefilled as on the phone
    const openStep = useCallback(
        (index: number, allSteps: EditorStep[]) => {
            const step: EditorStep | undefined = allSteps[index];
            setCurrent(index);
            setStepDescription(step?.description ?? '');
            setStepAt(step?.at ?? '');
            setPrepared(undefined);
            setStartingPoint(undefined);
            setAnswers(undefined);
            setOutcome(undefined);
            setExpect(step?.expect ?? {});
            setStepForm(step?.form ?? '');
            setPreparedFor(versionId ?? null);
            prepareStep({
                data: {
                    definition: definitionOf(allSteps.slice(0, index)),
                    // the first step registers the entity: the reference form
                    form: step?.form ?? (index === 0 ? referenceFormId : null),
                    answers: step?.answers,
                    workflow_version_id: versionId ?? null,
                },
            }).then(response => {
                setStartingPoint(response);
                setOffered(response.offered ?? []);
                setStepForm(response.form ?? '');
                setPrepared(response.xform ? response : undefined);
            });
            // a step already recorded: replayed with its answers, its checks shown without sending the form again
            if (step) {
                setAnswers(step.answers);
                preview({
                    data: {
                        definition: definitionOf(allSteps.slice(0, index + 1)),
                        workflow_version_id: versionId ?? null,
                    },
                }).then(setOutcome);
            }
        },
        [referenceFormId, prepareStep, preview, definitionOf, versionId],
    );

    // open the first step to fill once the forms are known; prepare the open step again when the version changes
    useEffect(() => {
        if (!loaded || !referenceFormId) {
            return;
        }
        if (preparedFor === undefined) {
            openStep(steps.length, steps);
        } else if (preparedFor !== (versionId ?? null)) {
            openStep(current, steps);
        }
    }, [
        loaded,
        referenceFormId,
        preparedFor,
        versionId,
        openStep,
        current,
        steps,
    ]);

    // another form picked for the step: prepared anew
    const handleFormChange = (form: string) => {
        setStepForm(form);
        setPrepared(undefined);
        setOutcome(undefined);
        prepareStep({
            data: {
                definition: definitionOf(steps.slice(0, current)),
                form,
                workflow_version_id: versionId ?? null,
            },
        }).then(setPrepared);
    };

    const stepOf = useCallback(
        (
            stepAnswers: Record<string, string>,
            stepExpect: StepExpect,
        ): EditorStep => ({
            form: stepForm,
            description: stepDescription,
            at: stepAt || null,
            answers: stepAnswers,
            expect: stepExpect,
            force: !offered.includes(stepForm),
        }),
        [stepForm, stepDescription, stepAt, offered],
    );

    // web-forms submitted: the step's answers, and what the app does with them
    const handleSubmit = useCallback(
        (instanceXml: string) => {
            const questions =
                editorForms.find(form => form.form_id === stepForm)
                    ?.questions ?? [];
            const stepAnswers = answersFromSubmission(
                instanceXml,
                questions,
                prepared?.prefilled ?? {},
            );
            setAnswers(stepAnswers);
            preview({
                data: {
                    definition: definitionOf([
                        ...steps.slice(0, current),
                        stepOf(stepAnswers, {}),
                    ]),
                    workflow_version_id: versionId ?? null,
                },
            }).then(response => {
                setOutcome(response);
                const result = response.steps.find(
                    step => step.index === current + 1,
                );
                if (result) {
                    setExpect(defaultChecks(result));
                }
            });
        },
        [
            editorForms,
            stepForm,
            prepared,
            preview,
            definitionOf,
            steps,
            current,
            stepOf,
            versionId,
        ],
    );

    const result = outcome?.steps.find(step => step.index === current + 1);
    const stepRecorded = answers !== undefined && result !== undefined;
    const refusedUnexpectedly = result?.status === 'refused' && !expect.refused;

    const saveStep = (): EditorStep[] => {
        const newSteps = [...steps];
        newSteps[current] = stepOf(answers ?? {}, expect);
        setSteps(newSteps);
        return newSteps;
    };
    const handleSaveStepAndAddNext = () => {
        const newSteps = saveStep();
        openStep(newSteps.length, newSteps);
    };

    const handleSaveScenario = async () => {
        const finalSteps =
            stepRecorded && !refusedUnexpectedly ? saveStep() : steps;
        const definition = definitionOf(finalSteps);
        const saved = scenarioId
            ? await update({ id: scenarioId, data: { definition } })
            : await create({ data: { definition } });
        redirectTo(scenarioDetailUrl(saved.id, versionId).slice(1), {});
    };

    const prefilledNames = Object.keys(prepared?.prefilled ?? {});
    const title = scenarioId
        ? formatMessage(MESSAGES.editScenario)
        : formatMessage(MESSAGES.newScenario);
    return (
        <>
            <TopBar title={title} displayBackButton goBack={() => goBack()} />
            <Box sx={pageStyles.scroll}>
                <Box sx={styles.main}>
                    <Box sx={styles.header}>
                        <TextField
                            sx={styles.name}
                            label={formatMessage(MESSAGES.scenarioName)}
                            value={name}
                            onChange={event => setName(event.target.value)}
                            required
                        />
                        <TextField
                            sx={styles.name}
                            label={formatMessage(MESSAGES.scenarioDescription)}
                            value={description}
                            onChange={event =>
                                setDescription(event.target.value)
                            }
                        />
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
                                    redirectToReplace(baseUrls.scenarioEdit, {
                                        ...params,
                                        versionId: String(value),
                                    })
                                }
                            />
                        </Box>
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
                            label={formatMessage(MESSAGES.showTechnicalNames)}
                        />
                    </Box>

                    <Box sx={styles.columns}>
                        <Box sx={styles.journey}>
                            <JourneyNav
                                steps={steps}
                                current={current}
                                formNames={formNames}
                                onSelect={index => openStep(index, steps)}
                            />
                            {startingPoint && (
                                <EntityAtThisPoint
                                    entityType={entityType?.name ?? ''}
                                    before={startingPoint.profile}
                                    after={result?.profile}
                                    forms={formDescriptions}
                                    referenceFormId={referenceFormId}
                                    showTechnicalNames={showTechnicalNames}
                                />
                            )}
                        </Box>

                        <Box sx={styles.form}>
                            <Paper sx={styles.stepCard}>
                                <Box sx={styles.stepFields}>
                                    <TextField
                                        select
                                        label={formatMessage(
                                            MESSAGES.stepForm,
                                            {
                                                index: String(current + 1),
                                            },
                                        )}
                                        value={stepForm}
                                        onChange={event =>
                                            handleFormChange(event.target.value)
                                        }
                                        sx={{ minWidth: 260 }}
                                    >
                                        {/* the first step registers the entity, the others don't */}
                                        {editorForms
                                            .filter(
                                                form =>
                                                    form.is_reference ===
                                                    (current === 0),
                                            )
                                            .map(form => (
                                                <MenuItem
                                                    key={form.form_id}
                                                    value={form.form_id}
                                                >
                                                    {offered.includes(
                                                        form.form_id,
                                                    )
                                                        ? `${form.name} · ${formatMessage(MESSAGES.offered)}`
                                                        : `${form.name} · ${formatMessage(MESSAGES.notOfferedForce)}`}
                                                </MenuItem>
                                            ))}
                                    </TextField>
                                    <TextField
                                        type="datetime-local"
                                        label={formatMessage(MESSAGES.stepDate)}
                                        helperText={formatMessage(
                                            MESSAGES.stepDateHelp,
                                        )}
                                        value={
                                            stepAt ? stepAt.slice(0, 16) : ''
                                        }
                                        onChange={event =>
                                            setStepAt(
                                                event.target.value
                                                    ? `${event.target.value}:00`
                                                    : '',
                                            )
                                        }
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Box>
                                <TextField
                                    label={formatMessage(
                                        MESSAGES.whatHappensInThisStep,
                                    )}
                                    value={stepDescription}
                                    onChange={event =>
                                        setStepDescription(event.target.value)
                                    }
                                    multiline
                                    minRows={2}
                                />
                                {stepForm && !offered.includes(stepForm) && (
                                    <Alert severity="warning">
                                        {formatMessage(
                                            MESSAGES.formNotOfferedWarning,
                                        )}
                                        {startingPoint?.next &&
                                            referenceForm && (
                                                <NotOfferedHint
                                                    formId={stepForm}
                                                    followups={
                                                        startingPoint.next
                                                            .followups
                                                    }
                                                    forms={formDescriptions}
                                                    referenceFormId={
                                                        referenceForm.id
                                                    }
                                                    referenceFormFormId={
                                                        referenceFormId
                                                    }
                                                    showTechnicalNames={
                                                        showTechnicalNames
                                                    }
                                                />
                                            )}
                                    </Alert>
                                )}
                                {prefilledNames.length > 0 && (
                                    <Alert
                                        severity="info"
                                        sx={styles.prefilled}
                                    >
                                        {formatMessage(
                                            MESSAGES.prefilledFromEntity,
                                            {
                                                values: prefilledNames
                                                    .map(
                                                        question =>
                                                            `${question} = ${prepared?.prefilled[question]}`,
                                                    )
                                                    .join(', '),
                                            },
                                        )}
                                    </Alert>
                                )}
                                {isPreparing && <LinearProgress />}
                                {!isPreparing && !stepForm && (
                                    <Alert severity="info">
                                        {formatMessage(MESSAGES.nothingOffered)}
                                    </Alert>
                                )}
                                {prepared?.xform && (
                                    <WebFormStep
                                        xform={prepared.xform}
                                        onSubmit={handleSubmit}
                                    />
                                )}
                            </Paper>

                            {!result && prepared?.xform && (
                                <ChecksPlaceholder />
                            )}
                            {result && (
                                <StepChecks
                                    result={result}
                                    forms={outcome?.forms ?? {}}
                                    referenceFormId={referenceFormId}
                                    expect={expect}
                                    onChange={setExpect}
                                    showTechnicalNames={showTechnicalNames}
                                />
                            )}

                            <Box sx={styles.actions}>
                                <Button
                                    variant="outlined"
                                    disabled={
                                        !stepRecorded || refusedUnexpectedly
                                    }
                                    onClick={handleSaveStepAndAddNext}
                                >
                                    {formatMessage(MESSAGES.saveStepAndAddNext)}
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={<SaveIcon />}
                                    disabled={
                                        !name ||
                                        (steps.length === 0 && !stepRecorded) ||
                                        isCreating ||
                                        isUpdating
                                    }
                                    onClick={handleSaveScenario}
                                >
                                    {formatMessage(MESSAGES.saveScenario)}
                                </Button>
                            </Box>
                        </Box>

                        <Box sx={styles.side}>
                            <AppWillDo
                                result={result}
                                forms={outcome?.forms ?? {}}
                                referenceFormId={referenceFormId}
                                isLoading={isPreviewing}
                            />
                            {!referenceFormId && workflowForms && (
                                <Typography color="error">
                                    {formatMessage(MESSAGES.noReferenceForm)}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                </Box>
            </Box>
        </>
    );
};
