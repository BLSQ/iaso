import React, {
    FunctionComponent,
    useCallback,
    useState,
    useEffect,
    useMemo,
} from 'react';
import CloseIcon from '@mui/icons-material/Close';
import {
    Box,
    Button,
    Drawer,
    Grid,
    Typography,
    Paper,
    IconButton,
} from '@mui/material';
import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { OpenHexaSvg } from 'Iaso/components/svg/OpenHexaSvg';
import { LQASForm } from 'Iaso/domains/openHexa/customForms/LQASForm';
import { useGetPipelineConfig } from 'Iaso/domains/openHexa/hooks/useGetPipelineConfig';
import { useGetPipelineDetails } from 'Iaso/domains/openHexa/hooks/useGetPipelineDetails';
import { useGetPipelinesDropdown } from 'Iaso/domains/openHexa/hooks/useGetPipelines';
import { useLaunchTask } from 'Iaso/domains/openHexa/hooks/useLaunchTask';
import {
    ParameterValues,
    usePipelineParameters,
} from 'Iaso/domains/openHexa/hooks/usePipelineParameters';
import { SxStyles } from 'Iaso/types/general';
import { usePollTask } from '../hooks/requests/usePollTask';
import MESSAGES from '../messages';
import { Planning } from '../types/planning';

type Props = {
    planning: Planning;
};

const styles: SxStyles = {
    button: {
        ml: 2,
    },
    icon: {
        mr: 1,
    },
    box: {
        width: '500px',
    },
    container: {
        height: 'calc(100vh - 66px)',
        overflow: 'auto',
        p: 2,
    },
    paper: {
        p: 2,
    },
};

export const OpenhexaIntegrationDrawer: FunctionComponent<Props> = ({
    planning,
}) => {
    const { formatMessage } = useSafeIntl();

    const { data: config } = useGetPipelineConfig();
    const lQAS_code = config?.lqas_pipeline_code;
    const [isOpen, setIsOpen] = useState(false);
    const [allowConfirm, setAllowConfirm] = useState(false);
    const [parameterValues, setParameterValues] = useState<
        ParameterValues | undefined
    >(undefined);
    const [isPipelineRunning, setIsPipelineRunning] = useState(false);
    const { data, isFetching: isFetchingPipelineUuids } =
        useGetPipelinesDropdown();
    const pipelineUuidsOptions = data?.filter(pipeline =>
        planning.pipeline_uuids.includes(pipeline.value),
    );
    const [selectedPipelineId, setSelectedPipelineId] = useState<
        string | undefined
    >(
        planning.pipeline_uuids.length === 1
            ? planning.pipeline_uuids[0]
            : undefined,
    );

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
        isSuccess,
    } = useLaunchTask(selectedPipelineId, pipeline?.currentVersion?.id, false);
    const { renderParameterInput, handleParameterChange } =
        usePipelineParameters(pipeline, parameterValues, setParameterValues);
    const handleSubmit = useCallback(() => {
        setIsPipelineRunning(true);
        const parameters: Record<string, any> = {
            ...parameterValues,
            planning_id: planning.id,
            pipeline_id: selectedPipelineId,
        };
        if (config?.connection_name) {
            parameters.connection_name = config.connection_name;
        }
        launchTask(parameters);
    }, [
        launchTask,
        parameterValues,
        planning.id,
        selectedPipelineId,
        config?.connection_name,
    ]);

    const taskId = launchResult?.task?.id;
    const { data: task } = usePollTask(taskId);
    useEffect(() => {
        if (
            (error && isPipelineRunning) ||
            (task && task?.status !== 'RUNNING')
        ) {
            setIsPipelineRunning(false);
        }
    }, [error, isPipelineRunning, task]);

    const currentStep = useMemo(() => {
        if (isPipelineRunning) return 2;
        if (task && !isPipelineRunning && task.status !== 'RUNNING') return 3;
        return 1;
    }, [isPipelineRunning, task]);
    return (
        <>
            <Button
                variant="outlined"
                size="medium"
                onClick={() => {
                    setIsOpen(true);
                }}
                sx={styles.button}
            >
                <OpenHexaSvg sx={styles.icon} />
                {formatMessage(MESSAGES.openHexaIntegration)}
            </Button>
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
                            </Grid>
                        </Grid>
                    </Paper>
                    <Box position="relative" sx={styles.container}>
                        {(isFetchingPipeline || isPipelineRunning) && (
                            <LoadingSpinner absolute fixed={false} />
                        )}
                        {/* Step 1: Pipeline selection and parameters */}
                        {currentStep === 1 && (
                            <>
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
                                    onChange={(_, value) =>
                                        setSelectedPipelineId(value)
                                    }
                                    label={MESSAGES.pipeline}
                                    required
                                    disabled={
                                        isFetchingPipelineUuids ||
                                        planning.pipeline_uuids.length === 1
                                    }
                                />
                                {pipeline && (
                                    <>
                                        {!pipeline.currentVersion
                                            ?.parameters && (
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
                                                setAllowConfirm={
                                                    setAllowConfirm
                                                }
                                                parameterValues={
                                                    parameterValues
                                                }
                                                handleParameterChange={
                                                    handleParameterChange
                                                }
                                            />
                                        )}
                                        {pipeline.code !== lQAS_code &&
                                            pipeline.currentVersion?.parameters?.map(
                                                parameter => (
                                                    <Box
                                                        key={parameter.name}
                                                        mb={2}
                                                    >
                                                        {renderParameterInput(
                                                            parameter,
                                                        )}
                                                    </Box>
                                                ),
                                            )}
                                    </>
                                )}
                            </>
                        )}
                        {/* Step 2: Pipeline running */}
                        {currentStep === 2 && (
                            <Box
                                minHeight="120px"
                                sx={{
                                    p: 3,
                                    border: '1px solid #e0e0e0',
                                    borderRadius: 2,
                                    backgroundColor: '#fafafa',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 2,
                                }}
                            >
                                {error && (
                                    <Box
                                        sx={{
                                            p: 2,
                                            backgroundColor: '#ffebee',
                                            border: '1px solid #f44336',
                                            borderRadius: 1,
                                            color: '#d32f2f',
                                        }}
                                    >
                                        <Typography
                                            variant="subtitle2"
                                            sx={{ fontWeight: 'bold' }}
                                        >
                                            Error launching pipeline:
                                        </Typography>
                                        <Typography variant="body2">
                                            {error.details.error}
                                        </Typography>
                                    </Box>
                                )}

                                {isSuccess && !error && (
                                    <Box
                                        sx={{
                                            p: 2,
                                            backgroundColor: '#e8f5e8',
                                            border: '1px solid #4caf50',
                                            borderRadius: 1,
                                            color: '#2e7d32',
                                        }}
                                    >
                                        <Typography
                                            variant="subtitle2"
                                            sx={{ fontWeight: 'bold' }}
                                        >
                                            ✅ Pipeline launched successfully
                                        </Typography>
                                    </Box>
                                )}

                                {taskId && (
                                    <Box
                                        sx={{
                                            p: 2,
                                            backgroundColor: '#e3f2fd',
                                            border: '1px solid #2196f3',
                                            borderRadius: 1,
                                            color: '#1565c0',
                                        }}
                                    >
                                        <Typography
                                            variant="subtitle2"
                                            sx={{ fontWeight: 'bold' }}
                                        >
                                            Task ID: {taskId}
                                        </Typography>
                                    </Box>
                                )}

                                {task && (
                                    <Box
                                        sx={{
                                            p: 2,
                                            backgroundColor: '#fff3e0',
                                            border: '1px solid #ff9800',
                                            borderRadius: 1,
                                            color: '#ef6c00',
                                        }}
                                    >
                                        <Typography
                                            variant="subtitle2"
                                            sx={{ fontWeight: 'bold' }}
                                        >
                                            Status: {task.status}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        )}
                        {/* Step 3: Pipeline result */}
                        {currentStep === 3 && (
                            <Box
                                minHeight="100px"
                                sx={{ width: '100%', maxWidth: '500px' }}
                            >
                                <Typography variant="h6" gutterBottom>
                                    {task?.progress_message}
                                </Typography>
                                {task?.result && (
                                    <Box>
                                        <Typography
                                            variant="subtitle2"
                                            gutterBottom
                                        >
                                            Result:
                                        </Typography>
                                        <Box
                                            sx={{
                                                backgroundColor: '#f5f5f5',
                                                border: '1px solid #ddd',
                                                borderRadius: 1,
                                                padding: 2,
                                                height: '60vh',
                                                overflow: 'auto',
                                                fontFamily: 'monospace',
                                                fontSize: '0.875rem',
                                                whiteSpace: 'pre-wrap',
                                                wordBreak: 'break-word',
                                            }}
                                        >
                                            {JSON.stringify(
                                                task?.result,
                                                null,
                                                2,
                                            )}
                                        </Box>
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
