/* eslint-disable camelcase */
import React, {
    FunctionComponent,
    useCallback,
    useMemo,
    useState,
} from 'react';
import { Typography } from '@mui/material';
import Alert from '@mui/material/Alert';
import {
    ConfirmCancelModal,
    IconButton,
    IntlMessage,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';

import { MutateFunction } from 'react-query';

import MESSAGES from '../messages';
import { useTaskMonitor } from 'Iaso/hooks/taskMonitor';
import { Profile, useCurrentUser } from '../../../utils/usersUtils';
import { Task, TaskApiResponse } from 'Iaso/domains/tasks/types';

const styles: SxStyles = {
    username: {
        fontWeight: 'bold',
    },
    warning: {
        marginBottom: '1rem',
    },
};

type Props = {
    titleMessage: IntlMessage;
    selectedUser: Profile;
    onCreateExport: MutateFunction<any>;
    isOpen: boolean;
    closeDialog: () => void;
};
// Declaring defaultData here because using initialData={} in the props below will cause and infinite loop
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

    const { data: taskData, isFetching: isFetchingTaskStatus } = useTaskMonitor(
        {
            taskId,
        },
    );
    console.log('isFetchingTaskStatus ', isFetchingTaskStatus);
    console.log('taskData', taskData);

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
            <Alert severity="warning" sx={styles.warning}>
                {formatMessage(MESSAGES.exportMobileAppModalBodyWarning)}
            </Alert>
            <Typography mb={2}>
                {formatMessage(MESSAGES.exportMobileAppModalBodySure)}
            </Typography>
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
