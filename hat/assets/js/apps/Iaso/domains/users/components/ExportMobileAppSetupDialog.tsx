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
import { useTaskMonitor } from 'Iaso/hooks/taskMonitor';
import { getRequest } from 'Iaso/libs/Api';
import { Profile } from '../../../utils/usersUtils';
import { TaskApiResponse } from 'Iaso/domains/tasks/types';

const styles: SxStyles = {
    username: {
        fontWeight: 'bold',
    },
    warning: {
        marginBottom: '1rem',
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

type Props = {
    titleMessage: IntlMessage;
    selectedUser: Profile;
    onCreateExport: MutateFunction<any>;
    isOpen: boolean;
    closeDialog: () => void;
};

function LinearProgressWithLabel(
    props: LinearProgressProps & { value: number },
) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress variant="determinate" {...props} />
            </Box>
            <Box sx={{ minWidth: 35 }}>
                <Typography
                    variant="body2"
                    color="text.secondary"
                >{`${Math.round(props.value)}%`}</Typography>
            </Box>
        </Box>
    );
}

const ExportMobileAppSetupDialogComponent: FunctionComponent<Props> = ({
    titleMessage,
    isOpen,
    selectedUser,
    onCreateExport,
    closeDialog,
}) => {
    const { formatMessage } = useSafeIntl();

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

    const onConfirm = useCallback(() => {
        setIsExporting(true);
        onCreateExport({ userId: selectedUser.user_id, projectId: 2 }).then(
            (task: TaskApiResponse<any>) => {
                setTaskId(task.task.id);
            },
        );
    }, [selectedUser, onCreateExport]);

    const { data: taskData, isSuccess } = useTaskMonitor({
        taskId,
        enabled: isExporting,
    });

    let taskProgressValue;
    if (isExporting && taskData) {
        if (['RUNNING', 'QUEUED'].includes(taskData.status)) {
            taskProgressValue =
                (taskData.progress_value / taskData.end_value) * 100;
        } else if (taskData.status === 'SUCCESS') {
            taskProgressValue = 100;
            getRequest(`/api/tasks/${taskId}/presigned-url/`).then(resp => {
                setPresignedUrl(resp.presigned_url);
            });
        } else {
            taskProgressValue = 0;
        }
    }

    return (
        <ConfirmCancelModal
            titleMessage={titleMessage}
            onConfirm={onConfirm}
            cancelMessage={MESSAGES.cancel}
            confirmMessage={MESSAGES.exportMobileAppModalBtn}
            maxWidth="md"
            open={isOpen}
            closeDialog={() => null}
            allowConfirm={!isExporting}
            onClose={() => null}
            onCancel={() => {
                closeDialog();
            }}
            id="export-dialog"
            dataTestId="export-dialog"
        >
            <Typography mb={2}>
                {formatMessage(MESSAGES.exportMobileAppModalBody)}
            </Typography>
            <Typography mb={2} sx={styles.username}>
                {fullUserName}
            </Typography>
            {isExporting && taskData && taskProgressValue ? (
                <>
                    <Typography mb={2}>
                        {formatMessage(MESSAGES.exportMobileAppModalInProgress)}
                    </Typography>
                    <Box sx={styles.progress}>
                        <LinearProgressWithLabel value={taskProgressValue} />
                    </Box>
                    {taskData.status === 'SUCCESS' && presignedUrl && (
                        <Box sx={styles.downloadBtn}>
                            <Button
                                variant="contained"
                                href={presignedUrl}
                                target="_blank"
                            >
                                {formatMessage(
                                    MESSAGES.exportMobileAppModalDownloadBtn,
                                )}
                            </Button>
                        </Box>
                    )}
                </>
            ) : (
                <>
                    <Alert severity="warning" sx={styles.warning}>
                        {formatMessage(
                            MESSAGES.exportMobileAppModalBodyWarning,
                        )}
                    </Alert>
                    <Typography mb={2}>
                        {formatMessage(MESSAGES.exportMobileAppModalBodySure)}
                    </Typography>
                </>
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
