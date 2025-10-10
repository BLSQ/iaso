import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useState,
    useMemo,
} from 'react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import {
    Box,
    Button,
    Drawer,
    Grid,
    Typography,
    Paper,
    IconButton,
    Tooltip,
} from '@mui/material';
import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import { useQueryClient } from 'react-query';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { OpenHexaSvg } from 'Iaso/components/svg/OpenHexaSvg';
import { LQASForm } from 'Iaso/domains/assignments/sampling/customForms/LQASForm';
import { Parameters } from 'Iaso/domains/openHexa/components/Parameters';
import { useGetPipelineConfig } from 'Iaso/domains/openHexa/hooks/useGetPipelineConfig';
import { useGetPipelineDetails } from 'Iaso/domains/openHexa/hooks/useGetPipelineDetails';
import { useGetPipelinesDropdown } from 'Iaso/domains/openHexa/hooks/useGetPipelines';
import { useLaunchTask } from 'Iaso/domains/openHexa/hooks/useLaunchTask';
import { ParameterValues } from 'Iaso/domains/openHexa/types/pipeline';

import { TaskLogMessages } from 'Iaso/domains/tasks/components/TaskLogMessages';
import { useGetLogs } from 'Iaso/domains/tasks/hooks/api';

import { SxStyles } from 'Iaso/types/general';
import { usePollTask } from '../hooks/requests/usePollTask';
import MESSAGES from '../messages';
import { Planning } from '../types/planning';
import { StatusInfos } from './StatusInfos';

type Props = {
    planning: Planning;
    disabled?: boolean;
    disabledMessage?: string;
};

const styles: SxStyles = {
    button: {
        ml: 2,
    },
    icon: {
        mr: 1,
    },
    box: {
        width: '600px',
    },
    container: {
        overflow: 'auto',
        p: 2,
        height: 'calc(100vh - 66px)',
    },
    containerHidden: {
        height: '0',
        overflow: 'hidden',
    },
    paper: {
        p: 2,
    },
    taskLogs: {
        borderRadius: 1,
    },
    taskLogsContainer: {
        p: 3,
        border: '1px solid #e0e0e0',
        minHeight: '120px',
        borderRadius: 2,
        backgroundColor: '#fafafa',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
    },
};

export const OpenhexaIntegrationDrawer: FunctionComponent<Props> = ({
    planning,
    disabled = false,
    disabledMessage,
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [allowConfirm, setAllowConfirm] = useState(false);
    const [parameterValues, setParameterValues] = useState<
        ParameterValues | undefined
    >(undefined);
    const [selectedPipelineId, setSelectedPipelineId] = useState<
        string | undefined
    >(
        planning.pipeline_uuids.length === 1
            ? planning.pipeline_uuids[0]
            : undefined,
    );

    const { formatMessage } = useSafeIntl();

    const { data: config } = useGetPipelineConfig();
    const lQAS_code = config?.lqas_pipeline_code;
    const { data, isFetching: isFetchingPipelineUuids } =
        useGetPipelinesDropdown();
    const { data: pipeline, isFetching: isFetchingPipeline } =
        useGetPipelineDetails(selectedPipelineId, [
            'task_id',
            'pipeline_id',
            'planning_id',
        ]);
    const {
        mutate: launchTask,
        data: launchResult,
        error,
        isLoading: isLaunchingTask,
    } = useLaunchTask(selectedPipelineId, pipeline?.currentVersion?.id, false);
    const taskId = launchResult?.task?.id;
    const handleEndTask = useCallback(() => {
        queryClient.invalidateQueries(['assignmentsList']);
    }, [queryClient]);
    const { data: task } = usePollTask(taskId, handleEndTask);
    const { data: taskLogs, isFetching: isFetchingTaskLogs } = useGetLogs(
        taskId,
        task?.status === 'RUNNING',
    );

    const pipelineUuidsOptions = useMemo(
        () =>
            data?.filter(pipeline =>
                planning.pipeline_uuids.includes(pipeline.value),
            ),
        [data, planning.pipeline_uuids],
    );
    const handleParameterChange = useCallback(
        (parameterName: string, value: any) => {
            setParameterValues?.(prev => ({
                ...prev,
                [parameterName]: value,
            }));
        },
        [setParameterValues],
    );
    const handleSubmit = useCallback(() => {
        setIsSubmitting(true);
        setCurrentStep(2);
        const parameters: Record<string, any> = {
            ...parameterValues,
            planning_id: planning.id,
            pipeline_id: selectedPipelineId,
        };
        launchTask(parameters);
    }, [launchTask, parameterValues, planning.id, selectedPipelineId]);
    const handleChangePipeline = useCallback((_, value) => {
        setSelectedPipelineId(value);
        setParameterValues(undefined);
        setAllowConfirm(false);
    }, []);
    useEffect(() => {
        if (isSubmitting && !isLaunchingTask) {
            setIsSubmitting(false);
        }
    }, [isSubmitting, isLaunchingTask]);

    const isPipelineRunning = task?.status === 'RUNNING';
    return (
        <>
            <Tooltip title={disabled ? disabledMessage : undefined}>
                <Box>
                    <Button
                        variant="outlined"
                        size="medium"
                        onClick={() => {
                            setIsOpen(true);
                        }}
                        sx={styles.button}
                        disabled={disabled}
                    >
                        <OpenHexaSvg sx={styles.icon} disabled={disabled} />
                        {formatMessage(MESSAGES.openHexaIntegration)}
                    </Button>
                </Box>
            </Tooltip>
            <Drawer
                open={isOpen}
                onClose={() => setIsOpen(false)}
                anchor="right"
            >
                <Box sx={styles.box}>
                    <Paper elevation={1} sx={styles.paper}>
                        <Grid
                            container
                            display="flex"
                            justifyContent="flex-end"
                            spacing={1}
                        >
                            <Grid
                                item
                                xs={1}
                                display="flex"
                                alignItems="center"
                            >
                                <IconButton
                                    size="small"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <CloseIcon />
                                </IconButton>
                            </Grid>
                            <Grid
                                xs={9}
                                item
                                display="flex"
                                alignItems="center"
                            >
                                <Typography variant="h6" color="primary">
                                    {formatMessage(
                                        MESSAGES.openHexaIntegration,
                                    )}
                                </Typography>
                            </Grid>
                            <Grid
                                item
                                xs={2}
                                display="flex"
                                alignItems="center"
                            >
                                {currentStep === 1 && (
                                    <Button
                                        size="small"
                                        variant="contained"
                                        onClick={handleSubmit}
                                        disabled={
                                            !allowConfirm ||
                                            isPipelineRunning ||
                                            isFetchingPipeline
                                        }
                                        fullWidth
                                    >
                                        {formatMessage(MESSAGES.launch)}
                                    </Button>
                                )}
                                {currentStep === 2 && (
                                    <Button
                                        size="small"
                                        variant="contained"
                                        onClick={() => setCurrentStep(1)}
                                        disabled={
                                            isPipelineRunning || isLaunchingTask
                                        }
                                        fullWidth
                                    >
                                        <ArrowBackIcon sx={styles.icon} />
                                        {formatMessage(MESSAGES.back)}
                                    </Button>
                                )}
                            </Grid>
                        </Grid>
                    </Paper>
                    <Box position="relative" sx={styles.container}>
                        {(isFetchingPipeline || isPipelineRunning) && (
                            <LoadingSpinner absolute fixed={false} />
                        )}
                        {/* Step 1: Pipeline selection and parameters */}
                        <Box
                            sx={
                                currentStep !== 1
                                    ? styles.containerHidden
                                    : undefined
                            }
                        >
                            <InputComponent
                                type="select"
                                keyValue="pipeline"
                                loading={isFetchingPipelineUuids}
                                options={pipelineUuidsOptions}
                                value={
                                    isFetchingPipelineUuids
                                        ? undefined
                                        : selectedPipelineId
                                }
                                onChange={handleChangePipeline}
                                label={MESSAGES.pipeline}
                                required
                                disabled={
                                    isFetchingPipelineUuids ||
                                    planning.pipeline_uuids.length === 1
                                }
                            />
                            {pipeline && (
                                <>
                                    {!pipeline.currentVersion?.parameters && (
                                        <Typography
                                            variant="body2"
                                            sx={styles.typography}
                                        >
                                            {formatMessage(
                                                MESSAGES.noParameters,
                                            )}
                                        </Typography>
                                    )}
                                    {pipeline.code === lQAS_code && (
                                        <LQASForm
                                            planning={planning}
                                            setAllowConfirm={setAllowConfirm}
                                            parameterValues={parameterValues}
                                            handleParameterChange={
                                                handleParameterChange
                                            }
                                        />
                                    )}
                                    {/* Custom pipeline code - this should be changed */}
                                    {pipeline.code !== lQAS_code && (
                                        <Parameters
                                            parameters={
                                                pipeline.currentVersion
                                                    ?.parameters
                                            }
                                            parameterValues={parameterValues}
                                            setParameterValues={
                                                setParameterValues
                                            }
                                            setAllowConfirm={setAllowConfirm}
                                        />
                                    )}
                                </>
                            )}
                        </Box>
                        {currentStep === 2 && (
                            <Box sx={styles.taskLogsContainer}>
                                {error && (
                                    <StatusInfos
                                        status="ERRORED"
                                        message={error.details.error}
                                    />
                                )}
                                {task && <StatusInfos status={task.status} />}
                                {taskId &&
                                    taskLogs &&
                                    taskLogs?.logs?.length > 0 && (
                                        <Box sx={styles.taskLogs}>
                                            <TaskLogMessages
                                                messages={taskLogs.logs}
                                                isFetching={isFetchingTaskLogs}
                                                isRunning={isPipelineRunning}
                                            />
                                        </Box>
                                    )}
                            </Box>
                        )}
                    </Box>
                </Box>
            </Drawer>
        </>
    );
};
