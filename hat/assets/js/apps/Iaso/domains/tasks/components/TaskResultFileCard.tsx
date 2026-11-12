import React, { FunctionComponent } from 'react';
import DownloadIcon from '@mui/icons-material/Download';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { Box, Button, Paper, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import { useTaskResultFile } from '../hooks/useTaskResultFile';
import MESSAGES from '../messages';

const styles: SxStyles = {
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

type Props = ReturnType<typeof useTaskResultFile>;

export const TaskResultFileCard: FunctionComponent<Props> = ({
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
