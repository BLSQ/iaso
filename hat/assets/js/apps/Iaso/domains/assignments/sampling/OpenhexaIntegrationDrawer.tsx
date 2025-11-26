import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useState,
    Dispatch,
    SetStateAction,
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
import { OpenHexaSvg } from 'Iaso/components/svg/OpenHexaSvg';
import { useGetPipelineDetails } from 'Iaso/domains/openHexa/hooks/useGetPipelineDetails';
import { useLaunchTask } from 'Iaso/domains/openHexa/hooks/useLaunchTask';
import { ParameterValues } from 'Iaso/domains/openHexa/types/pipeline';

import { OrgUnitTypeHierarchyDropdownValues } from 'Iaso/domains/orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesHierarchy';
import { useGetLogs } from 'Iaso/domains/tasks/hooks/api';

import { TaskStatus } from 'Iaso/domains/tasks/types';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../messages';
import { Planning } from '../types/planning';
import { PipelineInfos } from './components/PipelineInfos';
import { PipelineSelect } from './components/PipelineSelect';

type Props = {
    planning: Planning;
    disabled?: boolean;
    disabledMessage?: string;
    orgunitTypes: OrgUnitTypeHierarchyDropdownValues;
    isFetchingOrgunitTypes: boolean;
    setExtraFilters: Dispatch<SetStateAction<Record<string, any>>>;
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
};

export const OpenhexaIntegrationDrawer: FunctionComponent<Props> = ({
    planning,
    disabled = false,
    disabledMessage,
    orgunitTypes,
    isFetchingOrgunitTypes,
    setExtraFilters,
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [parameterValues, setParameterValues] = useState<
        ParameterValues | undefined
    >(undefined);
    const [currentStep, setCurrentStep] = useState(1);
    const [allowConfirm, setAllowConfirm] = useState(false);
    const [selectedPipelineId, setSelectedPipelineId] = useState<
        string | undefined
    >(
        planning.pipeline_uuids.length === 1
            ? planning.pipeline_uuids[0]
            : undefined,
    );

    const { formatMessage } = useSafeIntl();

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
    const [taskStatus, setTaskStatus] = useState<TaskStatus | undefined>(
        undefined,
    );

    const isPipelineActive =
        (!taskStatus || taskStatus === 'RUNNING' || taskStatus === 'QUEUED') &&
        currentStep === 2;

    const { data: taskLogs, isFetching: isFetchingTaskLogs } = useGetLogs(
        taskId,
        isPipelineActive,
    );
    useEffect(() => {
        if (taskLogs && taskLogs.status !== taskStatus) {
            setTaskStatus(taskLogs.status);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [taskLogs]);
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

    const handleReset = () => {
        setCurrentStep(1);
        setTaskStatus(undefined);
    };

    useEffect(() => {
        if (isSubmitting && !isLaunchingTask) {
            setIsSubmitting(false);
        }
    }, [isSubmitting, isLaunchingTask]);
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
                                            isPipelineActive ||
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
                                        onClick={handleReset}
                                        disabled={
                                            isPipelineActive || isLaunchingTask
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
                        {isFetchingPipeline && (
                            <LoadingSpinner absolute fixed={false} />
                        )}
                        <Box
                            sx={
                                currentStep !== 1
                                    ? styles.containerHidden
                                    : undefined
                            }
                        >
                            <PipelineSelect
                                planning={planning}
                                selectedPipelineId={selectedPipelineId}
                                handleChangePipeline={handleChangePipeline}
                                pipeline={pipeline}
                                parameterValues={parameterValues}
                                setParameterValues={setParameterValues}
                                setAllowConfirm={setAllowConfirm}
                                orgunitTypes={orgunitTypes}
                                isFetchingOrgunitTypes={isFetchingOrgunitTypes}
                                setExtraFilters={setExtraFilters}
                                taskStatus={taskStatus}
                                taskId={taskId}
                            />
                        </Box>
                        {currentStep === 2 && (
                            <PipelineInfos
                                error={error}
                                taskLogs={taskLogs}
                                isFetchingTaskLogs={isFetchingTaskLogs}
                                isPipelineActive={isPipelineActive}
                                taskId={taskId}
                            />
                        )}
                    </Box>
                </Box>
            </Drawer>
        </>
    );
};
