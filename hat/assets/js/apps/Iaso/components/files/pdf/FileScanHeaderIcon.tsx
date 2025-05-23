import React, { FunctionComponent } from 'react';
import { CheckCircleOutline } from '@mui/icons-material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
    fileScanResultInfected,
    fileScanResultClean,
} from '../../../constants/fileScanResults';
import { SxStyles } from '../../../types/general';

const styles: SxStyles = {
    colorCleanFile: {
        color: '#137333',
    },
    colorPendingFile: {
        color: '#B06D00',
    },
    colorInfectedFile: {
        color: '#B3261E',
    },
};

type FileScanHeaderIconProps = {
    scanResult?: string;
};

export const FileScanHeaderIcon: FunctionComponent<FileScanHeaderIconProps> = ({
    scanResult,
}) => {
    if (scanResult === fileScanResultClean) {
        return <CheckCircleOutline sx={styles.colorCleanFile} />;
    }
    if (scanResult === fileScanResultInfected) {
        return <ErrorOutlineIcon sx={styles.colorInfectedFile} />;
    }
    return <WarningAmberIcon sx={styles.colorPendingFile} />;
};
