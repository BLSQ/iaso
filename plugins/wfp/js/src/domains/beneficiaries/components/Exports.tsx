import React, { FunctionComponent } from 'react';
import { Box, Button, Tooltip } from '@mui/material';
import { ExcellSvg, useSafeIntl } from 'bluesquare-components';
import { useDownloadButtonStyles } from 'Iaso/components/DownloadButtonsComponent';
import MESSAGES from './../messages';
import { exportUrl } from './../requests';
import { Filters } from './../types';

type Props = {
    filters: Filters;
    disabled?: boolean;
};

// The files are built by the server when the link is followed, then downloaded by the browser
export const Exports: FunctionComponent<Props> = ({
    filters,
    disabled = false,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes = useDownloadButtonStyles();
    return (
        <Box display="flex" justifyContent="flex-end" mt={2}>
            <Tooltip title={formatMessage(MESSAGES.exportRawTooltip)}>
                <span>
                    <Button
                        variant="outlined"
                        color="primary"
                        className={classes.button}
                        href={exportUrl('raw', filters)}
                        disabled={disabled}
                    >
                        <ExcellSvg />
                        {formatMessage(MESSAGES.exportRaw)}
                    </Button>
                </span>
            </Tooltip>
            <Tooltip title={formatMessage(MESSAGES.exportCodaTooltip)}>
                <span>
                    <Button
                        variant="outlined"
                        color="primary"
                        className={classes.button}
                        href={exportUrl('coda', filters)}
                        disabled={disabled}
                    >
                        <ExcellSvg />
                        {formatMessage(MESSAGES.exportCoda)}
                    </Button>
                </span>
            </Tooltip>
        </Box>
    );
};
