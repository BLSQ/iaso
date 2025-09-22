import React, {
    FunctionComponent,
    useCallback,
    useState,
    useEffect,
    useMemo,
} from 'react';
import { Box, Button, Typography } from '@mui/material';
import {
    ConfirmCancelModal,
    IntlMessage,
    LoadingSpinner,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { OpenHexaSvg } from 'Iaso/components/svg/OpenHexaSvg';
import { useGetPipelineDetails } from 'Iaso/domains/openHexa/hooks/useGetPipelineDetails';
import { useGetPipelinesDropdown } from 'Iaso/domains/openHexa/hooks/useGetPipelines';
import { useLaunchTask } from 'Iaso/domains/openHexa/hooks/useLaunchTask';
import { usePipelineParameters } from 'Iaso/domains/openHexa/hooks/usePipelineParameters';
import { styles } from 'Iaso/styles/mapCustomControl';
import { usePollTask } from '../hooks/requests/usePollTask';
import MESSAGES from '../messages';
import { Planning } from '../types/planning';

type Props = {
    planning: Planning;
    isOpen: boolean;
    closeDialog: () => void;
};

type ButtonProps = {
    onClick: () => void;
    message?: IntlMessage;
    disabled?: boolean;
};
const IconButtonComponent: FunctionComponent<ButtonProps> = ({
    onClick,
    message,
    disabled,
}) => {
    return (
        <Button
            variant="outlined"
            size="medium"
            disabled={disabled}
            onClick={onClick}
            sx={{ ml: 2 }}
        >
            <OpenHexaSvg sx={{ mr: 1 }} /> {message}
        </Button>
    );
};

export const OpenhexaIntegration: FunctionComponent<Props> = ({
    planning,
    isOpen,
    closeDialog,
}) => {
    const { formatMessage } = useSafeIntl();
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
    const { parameterValues, renderParameterInput } =
        usePipelineParameters(pipeline);

    const handleSubmit = useCallback(() => {
        setIsPipelineRunning(true);
        const parameters = {
            ...parameterValues,
            planning_id: planning.id,
            pipeline_id: selectedPipelineId,
        };
        launchTask(parameters as any);
    }, [launchTask, parameterValues, planning.id, selectedPipelineId]);

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
        <ConfirmCancelModal
            allowConfirm={currentStep === 1}
            titleMessage={formatMessage(MESSAGES.openHexaIntegration)}
            onConfirm={() => {
                handleSubmit();
            }}
            open={isOpen}
            onCancel={() => null}
            closeDialog={closeDialog}
            maxWidth="sm"
            closeOnConfirm={false}
            onClose={() => null}
            cancelMessage={currentStep !== 1 ? MESSAGES.close : MESSAGES.cancel}
            confirmMessage={MESSAGES.confirm}
            id="launch-open-hexa-dialog"
            dataTestId="launch-open-hexa-dialog"
        >
            <Box position="relative">
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
                                {!pipeline.currentVersion?.parameters && (
                                    <Typography
                                        variant="body2"
                                        sx={styles.title}
                                    >
                                        {formatMessage(MESSAGES.noParameters)}
                                    </Typography>
                                )}
                                {pipeline.currentVersion?.parameters?.map(
                                    parameter => (
                                        <Box
                                            key={parameter.name}
                                            sx={{ marginBottom: 2 }}
                                        >
                                            {renderParameterInput(parameter)}
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
                                {/* {task.progress_message && (
                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                        {task.progress_message}
                                    </Typography>
                                )}
                                {task.progress_value && (
                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                        Progress: {task.progress_value}%
                                    </Typography>
                                )} */}
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
                                <Typography variant="subtitle2" gutterBottom>
                                    Result:
                                </Typography>
                                <Box
                                    sx={{
                                        backgroundColor: '#f5f5f5',
                                        border: '1px solid #ddd',
                                        borderRadius: 1,
                                        padding: 2,
                                        maxHeight: '300px',
                                        overflow: 'auto',
                                        fontFamily: 'monospace',
                                        fontSize: '0.875rem',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                    }}
                                >
                                    {JSON.stringify(task?.result, null, 2)}
                                </Box>
                            </Box>
                        )}
                    </Box>
                )}
            </Box>
        </ConfirmCancelModal>
    );
};
const dialog = makeFullModal(OpenhexaIntegration, IconButtonComponent);

export { dialog as OpenhexaIntegrationDialog };
