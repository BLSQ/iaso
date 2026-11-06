import React, { FunctionComponent } from 'react';
import DownloadIcon from '@mui/icons-material/Download';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import {
    Alert,
    AlertTitle,
    Box,
    Button,
    CircularProgress,
    Paper,
    Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import { useTaskResultFile } from '../hooks/useTaskResultFile';
import MESSAGES from '../messages';
import { Task, TaskResult } from '../types';

const styles: SxStyles = {
    alert: {
        '& .MuiAlert-message': { minWidth: 0, flex: 1 },
    },
    alertMuted: {
        '& .MuiAlert-message': { minWidth: 0, flex: 1 },
        bgcolor: 'grey.100',
        color: 'text.secondary',
        '& .MuiAlert-icon': { color: 'grey.500' },
    },
    spinner: {
        '@media (prefers-reduced-motion: reduce)': {
            animation: 'none',
            '& circle': { animation: 'none' },
        },
    },
    message: {
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
    },
    fileCard: {
        p: 1.5,
        display: 'flex',
        gap: 1.5,
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    fileBadge: {
        width: 40,
        height: 46,
        borderRadius: 1,
        flex: 'none',
        position: 'relative',
        display: 'grid',
        placeItems: 'center',
        '& svg': { fontSize: 22, mt: -1 },
    },
    fileExtension: {
        position: 'absolute',
        bottom: 4,
        fontSize: 9,
        fontWeight: 700,
        lineHeight: 1,
        letterSpacing: '0.04em',
    },
    fileName: {
        fontWeight: 500,
        overflowWrap: 'anywhere',
    },
};

// "export.zip" -> ["export", "ZIP"]
const splitExtension = (fileName: string): [string, string] => {
    const dot = fileName.lastIndexOf('.');
    return dot > 0
        ? [fileName.slice(0, dot), fileName.slice(dot + 1).toUpperCase()]
        : [fileName, ''];
};

type ResultFileProps = ReturnType<typeof useTaskResultFile>;

const ResultFile: FunctionComponent<ResultFileProps> = ({
    fileName,
    expiresAt,
    hasExpired,
    presignedUrl,
}) => {
    const { formatMessage } = useSafeIntl();
    if (!fileName) return null;
    const [baseName, extension] = splitExtension(fileName);
    let expiry: string | undefined;
    if (expiresAt && hasExpired) {
        expiry = formatMessage(MESSAGES.fileExpired, {
            date: expiresAt.format('LTS'),
        });
    } else if (expiresAt) {
        expiry = formatMessage(MESSAGES.fileAvailableUntilDate, {
            date: expiresAt.format('LTS'),
            relative: expiresAt.fromNow(),
        });
    }
    return (
        <Paper variant="outlined" sx={styles.fileCard}>
            <Box
                sx={{
                    ...styles.fileBadge,
                    bgcolor: theme =>
                        hasExpired
                            ? theme.palette.grey[100]
                            : alpha(theme.palette.primary.main, 0.08),
                    color: hasExpired ? 'text.disabled' : 'primary.main',
                }}
            >
                <InsertDriveFileIcon />
                {extension && (
                    <Box component="span" sx={styles.fileExtension}>
                        {extension}
                    </Box>
                )}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                    sx={styles.fileName}
                    color={hasExpired ? 'text.secondary' : 'text.primary'}
                    title={fileName}
                >
                    {baseName}
                </Typography>
                {expiry && (
                    <Typography variant="body2" color="text.secondary">
                        {expiry}
                    </Typography>
                )}
            </Box>
            {!hasExpired && (
                <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    href={presignedUrl ?? ''}
                    target="_blank"
                    disabled={!presignedUrl}
                >
                    {formatMessage(MESSAGES.download)}
                </Button>
            )}
        </Paper>
    );
};

type Props = {
    task: Task<TaskResult>;
};

export const TaskResultPanel: FunctionComponent<Props> = ({ task }) => {
    const { formatMessage } = useSafeIntl();
    const file = useTaskResultFile(task);
    const message = task.progress_message ?? task.result?.message;
    const messageNode = message && <Box sx={styles.message}>{message}</Box>;

    switch (task.status) {
        case 'QUEUED':
            return (
                <Alert
                    severity="info"
                    icon={<HourglassEmptyIcon />}
                    data-test="task-result"
                    sx={styles.alert}
                >
                    <AlertTitle>
                        {formatMessage(MESSAGES.waitingForWorker)}
                    </AlertTitle>
                    {formatMessage(MESSAGES.queuedHint)}
                </Alert>
            );
        case 'RUNNING':
            return (
                <Alert
                    severity="info"
                    icon={
                        <CircularProgress
                            size={20}
                            color="info"
                            sx={styles.spinner}
                        />
                    }
                    data-test="task-result"
                    sx={styles.alert}
                >
                    <AlertTitle>
                        {formatMessage(MESSAGES.inProgress)}
                    </AlertTitle>
                    {messageNode}
                </Alert>
            );
        case 'ERRORED':
            return (
                <Alert
                    severity="error"
                    data-test="task-result"
                    sx={styles.alert}
                >
                    <AlertTitle>{formatMessage(MESSAGES.failed)}</AlertTitle>
                    {messageNode}
                </Alert>
            );
        case 'KILLED':
            return (
                <Alert
                    severity="warning"
                    data-test="task-result"
                    sx={styles.alert}
                >
                    <AlertTitle>
                        {formatMessage(MESSAGES.stepStopped)}
                    </AlertTitle>
                    {messageNode}
                </Alert>
            );
        case 'SUCCESS':
        case 'EXPORTED':
            return (
                <>
                    <Alert
                        severity="success"
                        data-test="task-result"
                        sx={file.hasExpired ? styles.alertMuted : styles.alert}
                    >
                        <AlertTitle>
                            {formatMessage(MESSAGES.succeeded)}
                        </AlertTitle>
                        {messageNode}
                    </Alert>
                    <ResultFile {...file} />
                </>
            );
        default:
            return messageNode ? (
                <Alert
                    severity="info"
                    data-test="task-result"
                    sx={styles.alert}
                >
                    {messageNode}
                </Alert>
            ) : null;
    }
};
