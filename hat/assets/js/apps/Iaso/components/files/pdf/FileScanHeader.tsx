import React, { FunctionComponent } from 'react';
import { Box, Typography } from '@mui/material';
import { useSafeIntl, displayDateFromTimestamp } from 'bluesquare-components';
import {
    fileScanResultInfected,
    fileScanResultClean,
} from '../../../constants/fileScanResults';
import { SxStyles } from '../../../types/general';
import { FileScanHeaderIcon } from './FileScanHeaderIcon';
import MESSAGES from './messages';
import { useFileScanHeaderText } from './useFileScanHeaderText';

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
    headerPendingFile: {
        backgroundColor: '#FEF7E0',
        color: '#8A5700',
    },
    headerInfectedFile: {
        backgroundColor: '#FDEDED',
        color: '#8B1A1A',
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
    const headerText = useFileScanHeaderText(scanResult);

    const headerStyle = () => {
        if (scanResult === fileScanResultClean) {
            return [styles.baseHeader, styles.headerCleanFile];
        }
        if (scanResult === fileScanResultInfected) {
            return [styles.baseHeader, styles.headerInfectedFile];
        }
        return [styles.baseHeader, styles.headerPendingFile];
    };

    return (
        <Box sx={headerStyle()}>
            <FileScanHeaderIcon scanResult={scanResult} />
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
