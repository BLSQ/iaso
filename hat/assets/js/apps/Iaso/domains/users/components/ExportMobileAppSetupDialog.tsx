/* eslint-disable camelcase */
import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { MutateFunction } from 'react-query';
import { Alert, Box, Button, Typography } from '@mui/material';
import LinearProgress, {
    LinearProgressProps,
} from '@mui/material/LinearProgress';
import {
    ConfirmCancelModal,
    IconButton,
    IntlMessage,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';

import MESSAGES from '../messages';
import InputComponent from 'Iaso/components/forms/InputComponent.tsx';
import { useTaskMonitor } from 'Iaso/hooks/taskMonitor';
import { getRequest } from 'Iaso/libs/Api';
import { TaskApiResponse } from 'Iaso/domains/tasks/types';
import { Project, User } from 'Iaso/utils/usersUtils';

const styles: SxStyles = {
    progressWrapper: {
        display: 'flex',
        alignItems: 'center',
    },
    linearProgress: {
        width: '100%',
        mr: 1,
    },
    progressLabel: {
        minWidth: 35,
    },
    alert: {
        marginBottom: '1rem',
        marginTop: '1rem',
    },
    progress: {
        width: '100%',
    },
    downloadBtn: {
        display: 'flex',
        justifyContent: 'center',
        marginTop: '1rem',
    },
};

type DialogProps = {
    titleMessage: IntlMessage;
    selectedUser: User;
    onCreateExport: MutateFunction<any>;
    isOpen: boolean;
    closeDialog: () => void;
};

function LinearProgressWithLabel(
    props: LinearProgressProps & { value: number },
) {
    return (
        <Box sx={styles.progressWrapper}>
            <Box sx={styles.linearProgress}>
                <LinearProgress variant="determinate" {...props} />
            </Box>
            <Box sx={styles.progressLabel}>
                <Typography variant="body2" color="text.secondary">
                    {`${Math.round(props.value)}%`}
                </Typography>
            </Box>
        </Box>
    );
}

const ExportMobileAppSetupDialogComponent: FunctionComponent<DialogProps> = ({
    titleMessage,
    isOpen,
    selectedUser,
    onCreateExport,
    closeDialog,
}) => {
    const { formatMessage } = useSafeIntl();

    const [selectedProject, setSelectedProject] = useState<Project>(
        selectedUser.projects.length === 1 ? selectedUser.projects[0] : null,
    );
    const [password, setPassword] = useState<string>();
    const [passwordErrors, setPasswordErrors] = useState<string>();
    const [isExporting, setIsExporting] = useState<boolean>(false);
    const [taskId, setTaskId] = useState<number>();
    const [presignedUrl, setPresignedUrl] = useState<string>();
    const fullUserName = useMemo(
        () =>
            [
                `${selectedUser.first_name} ${selectedUser.last_name}`,
                selectedUser.user_name,
                selectedUser.email,
            ]
                .filter(item => item?.trim() !== '')
                .join(' - '),
        [selectedUser],
    );
    const projectOptions = useMemo(
        () =>
            selectedUser.projects.map(project => {
                return {
                    value: project.id,
                    label: project.name,
                };
            }),
        [selectedUser],
    );

    const onConfirm = useCallback(() => {
        onCreateExport({
            userId: selectedUser.user_id,
            projectId: selectedProject.id,
            password: password,
        })
            .then((task: TaskApiResponse<any>) => {
                setIsExporting(true);
                setTaskId(task.task.id);
            })
            .catch(error => {
                if (error.status === 400) {
                    Object.keys(error.details).forEach(errorKey => {
                        if (errorKey === 'password') {
                            setPasswordErrors(error.details[errorKey]);
                        }
                    });
                }
            });
    }, [selectedUser, selectedProject, password, onCreateExport]);

    const { data: taskData } = useTaskMonitor({
        taskId,
        enabled: isExporting,
    });

    let taskProgressValue = 0;
    if (isExporting && taskData && taskData.end_value != 0) {
        if (['RUNNING', 'QUEUED'].includes(taskData.status)) {
            taskProgressValue =
                (taskData.progress_value / taskData.end_value) * 100;
        } else if (taskData.status === 'SUCCESS') {
            taskProgressValue = 100;
        }
    }

    useEffect(() => {
        if (taskData?.status === 'SUCCESS') {
            getRequest(`/api/tasks/${taskId}/presigned-url/`).then(resp =>
                setPresignedUrl(resp.presigned_url),
            );
        }
    }, [taskData]);

    return (
        <ConfirmCancelModal
            titleMessage={titleMessage}
            onConfirm={onConfirm}
            cancelMessage={MESSAGES.cancel}
            confirmMessage={MESSAGES.exportMobileAppBtn}
            maxWidth="md"
            open={isOpen}
            closeDialog={() => null}
            allowConfirm={
                selectedUser && selectedProject && password && !isExporting
            }
            onClose={() => null}
            onCancel={() => {
                closeDialog();
            }}
            id="export-dialog"
            dataTestId="export-dialog"
        >
            {selectedUser.projects.length > 0 ? (
                <>
                    <Typography mb={2}>
                        {formatMessage(MESSAGES.exportMobileAppBody)}
                    </Typography>
                    <Typography mb={0}>
                        {formatMessage(MESSAGES.exportMobileAppUser)}{' '}
                        <b>{fullUserName}</b>
                    </Typography>
                    {selectedUser.projects.length === 1 ? (
                        <Typography mb={2}>
                            {formatMessage(MESSAGES.exportMobileAppProject)}{' '}
                            <b>{selectedProject.name}</b>
                        </Typography>
                    ) : (
                        <InputComponent
                            keyValue="project"
                            onChange={(key, value) =>
                                setSelectedProject({
                                    id: value,
                                })
                            }
                            value={selectedProject?.id}
                            type="select"
                            multi={false}
                            label={MESSAGES.project}
                            options={projectOptions}
                        />
                    )}
                    {isExporting && taskData && taskProgressValue !== null ? (
                        <>
                            <Typography my={2}>
                                {formatMessage(
                                    MESSAGES.exportMobileAppInProgress,
                                )}
                            </Typography>
                            <Box sx={styles.progress}>
                                <LinearProgressWithLabel
                                    value={taskProgressValue}
                                />
                            </Box>
                            <Alert severity="info" sx={styles.alert}>
                                {formatMessage(
                                    MESSAGES.exportMobileAppViewTasks,
                                )}
                            </Alert>
                            {taskData.status === 'SUCCESS' && presignedUrl && (
                                <Box sx={styles.downloadBtn}>
                                    <Button
                                        variant="contained"
                                        href={presignedUrl}
                                        target="_blank"
                                    >
                                        {formatMessage(
                                            MESSAGES.exportMobileAppDownloadBtn,
                                        )}
                                    </Button>
                                </Box>
                            )}
                            {taskData.status === 'ERRORED' && (
                                <Alert severity="error" sx={styles.alert}>
                                    {formatMessage(
                                        MESSAGES.exportMobileAppError,
                                    )}
                                </Alert>
                            )}
                        </>
                    ) : (
                        <>
                            <Alert severity="warning" sx={styles.alert}>
                                {formatMessage(
                                    MESSAGES.exportMobileAppBodyWarning,
                                )}
                            </Alert>
                            <InputComponent
                                type="password"
                                keyValue="password"
                                required
                                onChange={(_key, value) =>
                                    setPassword(value.trim())
                                }
                                label={MESSAGES.password}
                                value={password}
                                errors={passwordErrors}
                            />
                            <Typography my={2}>
                                {formatMessage(
                                    MESSAGES.exportMobileAppBodySure,
                                )}
                            </Typography>
                        </>
                    )}
                </>
            ) : (
                <Alert severity="error">
                    {formatMessage(MESSAGES.exportMobileAppBodyNoProjects)}
                </Alert>
            )}
        </ConfirmCancelModal>
    );
};

type PropsIcon = {
    onClick: () => void;
};

export const DownloadIconButton: FunctionComponent<PropsIcon> = ({
    onClick,
}) => {
    return (
        <IconButton
            onClick={onClick}
            icon="download"
            tooltipMessage={MESSAGES.exportMobileAppTooltip}
        />
    );
};

const modal = makeFullModal(
    ExportMobileAppSetupDialogComponent,
    DownloadIconButton,
);

export { modal as ExportMobileAppSetupDialog };
