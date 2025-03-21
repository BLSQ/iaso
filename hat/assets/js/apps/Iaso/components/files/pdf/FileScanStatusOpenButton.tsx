import React, { FunctionComponent, useMemo } from 'react';
import { Warning } from '@mui/icons-material';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Error from '@mui/icons-material/Error';
import { IconButton, Tooltip } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import {
    fileScanResultInfected,
    fileScanResultClean,
} from '../../../constants/fileScanResults';
import { SxStyles } from '../../../types/general';
import PdfSvgComponent from '../../svg/PdfSvgComponent';
import MESSAGES from './messages';

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

type FileScanStatusOpenButtonProps = {
    scanResult?: string;
    onClick: () => void;
    disabled: boolean;
    coloredIcon?: boolean;
};

export const FileScanStatusOpenButton: FunctionComponent<
    FileScanStatusOpenButtonProps
> = ({
        scanResult,
        coloredIcon = false,
        onClick,
        disabled
}) => {

    const { formatMessage } = useSafeIntl();
    const fileScanResultIcon = useMemo(() => {
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
    }, [coloredIcon, scanResult]);

    const tooltipMessage = useMemo(() => {
        if (scanResult === fileScanResultClean) {
            return MESSAGES.fileScanSafeIconTooltip;
        }
        if (scanResult === fileScanResultInfected) {
            return MESSAGES.fileScanInfectedIconTooltip;
        }
        return MESSAGES.fileScanPendingIconTooltip;
    }, [scanResult]);

    return (
        <Tooltip title={formatMessage(tooltipMessage)} arrow>
            <IconButton
                onClick={onClick}
                aria-label="preview document"
                disabled={disabled}
            >
                {fileScanResultIcon}
                {/* TODO: make the icon white also once it's implemented everywhere
                <PdfSvgComponent sx={!coloredIcon && styles.whiteState} />
                */}
                <PdfSvgComponent />
            </IconButton>
        </Tooltip>
    );
};
