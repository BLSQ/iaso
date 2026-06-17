import React, { FunctionComponent } from 'react';
import { CheckCircleOutlineOutlined } from '@mui/icons-material';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
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
        return <CheckCircleOutlineOutlined sx={styles.colorCleanFile} />;
    }
    if (scanResult === fileScanResultInfected) {
        return <ErrorOutlineOutlinedIcon sx={styles.colorInfectedFile} />;
    }
    return <WarningAmberIcon sx={styles.colorPendingFile} />;
};
