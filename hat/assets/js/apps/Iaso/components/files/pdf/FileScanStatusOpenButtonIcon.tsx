import React, { FunctionComponent } from 'react';
import { Warning } from '@mui/icons-material';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Error from '@mui/icons-material/Error';
import {
    fileScanResultInfected,
    fileScanResultClean,
} from '../../../constants/fileScanResults';
import { SxStyles } from '../../../types/general';

const styles: SxStyles = {
    baseIconState: {
        position: 'absolute',
        width: 16,
        height: 16,
        top: '-1px',
        left: '-1px',
    },
    coloredStateSafe: {
        color: 'success.light',
    },
    coloredStateInfected: {
        color: 'error.main',
    },
    coloredStatePending: {
        color: 'warning.main',
    },
    whiteState: {
        color: 'white',
    },
};

type FileScanStatusOpenButtonIconProps = {
    scanResult?: string;
    coloredIcon?: boolean;
};

export const FileScanStatusOpenButtonIcon: FunctionComponent<
    FileScanStatusOpenButtonIconProps
> = ({ scanResult, coloredIcon = false }) => {
    if (scanResult === fileScanResultClean) {
        return (
            <CheckCircle
                sx={[
                    styles.baseIconState,
                    coloredIcon && styles.coloredStateSafe,
                    !coloredIcon && styles.whiteState,
                ]}
            />
        );
    }
    if (scanResult === fileScanResultInfected) {
        return (
            <Error
                sx={[
                    styles.baseIconState,
                    coloredIcon && styles.coloredStateInfected,
                    !coloredIcon && styles.whiteState,
                ]}
            />
        );
    }
    if (!scanResult) {
        return null;
    }
    return (
        <Warning
            sx={[
                styles.baseIconState,
                coloredIcon && styles.coloredStatePending,
                !coloredIcon && styles.whiteState,
            ]}
        />
    );
};
