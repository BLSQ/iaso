import React, { FunctionComponent } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import PdfSvgComponent from '../../svg/PdfSvgComponent';
import { FileScanStatusOpenButtonIcon } from './FileScanStatusOpenButtonIcon';
import { useFileScanStatusOpenButtonTooltipText } from './useFileScanStatusOpenButtonTooltipText';

type FileScanStatusOpenButtonProps = {
    scanResult?: string;
    onClick: () => void;
    disabled: boolean;
    coloredIcon?: boolean;
};

export const FileScanStatusOpenButton: FunctionComponent<
    FileScanStatusOpenButtonProps
> = ({ scanResult, coloredIcon = false, onClick, disabled }) => {
    const tooltipMessage = useFileScanStatusOpenButtonTooltipText(scanResult);

    return (
        <Tooltip title={tooltipMessage} arrow>
            <IconButton
                onClick={onClick}
                aria-label="preview document"
                disabled={disabled}
            >
                <FileScanStatusOpenButtonIcon
                    scanResult={scanResult}
                    coloredIcon={coloredIcon}
                />
                {/* TODO: make the icon white also once it's implemented everywhere
                <PdfSvgComponent sx={!coloredIcon && styles.whiteState} />
                */}
                <PdfSvgComponent />
            </IconButton>
        </Tooltip>
    );
};
