import React, { FunctionComponent, useMemo } from 'react';
import { CheckCircleOutline } from '@mui/icons-material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Box, Typography } from '@mui/material';
import { useSafeIntl, displayDateFromTimestamp } from 'bluesquare-components';
import {
    fileScanResultError,
    fileScanResultInfected,
    fileScanResultClean,
} from '../../../constants/fileScanResults';
import { SxStyles } from '../../../types/general';
import MESSAGES from './messages';

const styles: SxStyles = {
    baseHeader: {
        padding: 2,
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
    },
    headerCleanFile: {
        backgroundColor: '#E6F4EA',
        color: '#1E4620',
    },
    colorCleanFile: {
        color: '#137333',
    },
    headerPendingFile: {
        backgroundColor: '#FEF7E0',
        color: '#8A5700',
    },
    colorPendingFile: {
        color: '#B06D00',
    },
    headerInfectedFile: {
        backgroundColor: '#FDEDED',
        color: '#8B1A1A',
    },
    colorInfectedFile: {
        color: '#B3261E',
    },
};

type FileScanHeaderProps = {
    scanResult?: string;
    scanTimestamp?: number;
};

export const FileScanHeader: FunctionComponent<FileScanHeaderProps> = ({
    scanResult,
    scanTimestamp,
}) => {
    const { formatMessage } = useSafeIntl();

    const headerStyle = useMemo(() => {
        if (scanResult === fileScanResultClean) {
            return [styles.baseHeader, styles.headerCleanFile];
        }
        if (scanResult === fileScanResultInfected) {
            return [styles.baseHeader, styles.headerInfectedFile];
        }
        return [styles.baseHeader, styles.headerPendingFile];
    }, [scanResult]);

    const headerIcon = useMemo(() => {
        if (scanResult === fileScanResultClean) {
            return <CheckCircleOutline sx={styles.colorCleanFile} />;
        }
        if (scanResult === fileScanResultInfected) {
            return <ErrorOutlineIcon sx={styles.colorInfectedFile} />;
        }
        return <WarningAmberIcon sx={styles.colorPendingFile} />;
    }, [scanResult]);

    const headerText = useMemo(() => {
        if (scanResult === fileScanResultInfected) {
            return formatMessage(MESSAGES.fileScanResultInfected);
        }
        if (scanResult === fileScanResultClean) {
            return formatMessage(MESSAGES.fileScanResultSafe);
        }
        if (scanResult === fileScanResultError) {
            return formatMessage(MESSAGES.fileScanResultError);
        }
        return formatMessage(MESSAGES.fileScanResultPending);
    }, [scanResult, formatMessage]);

    return (
        <Box sx={headerStyle}>
            {headerIcon}
            <Box>
                <Typography fontWeight="bold">{headerText}</Typography>
                {scanTimestamp && (
                    <Typography variant="body2">
                        {formatMessage(MESSAGES.fileScanTimestamp, {
                            datetime: displayDateFromTimestamp(scanTimestamp),
                        })}
                    </Typography>
                )}
            </Box>
        </Box>
    );
};
