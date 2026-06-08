import React, { FunctionComponent } from 'react';
import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';

import { useSafeIntl } from 'bluesquare-components';
import { Tooltip } from 'react-leaflet';
import MESSAGES from '../../../../../constants/messages';
import { Shape } from '../../../../../constants/types';

type Props = {
    name: string;
    shape: Shape;
};

const useStyles = makeStyles(() => ({
    label: {
        fontWeight: 'bold',
    },
}));

export const LqasAfroTooltip: FunctionComponent<Props> = ({ name, shape }) => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    return (
        // @ts-ignore
        <Tooltip title={shape.name} pane="popupPane">
            <Box display="block">
                <span className={classes.label}>{name}</span>
            </Box>
            {shape.data?.campaign && (
                <Box display="block">
                    <span className={classes.label}>
                        {formatMessage(MESSAGES.obrName)}:{' '}
                    </span>
                    {shape.data.campaign}
                </Box>
            )}
            {shape.data?.round_number && (
                <Box display="block">
                    <span className={classes.label}>
                        {formatMessage(MESSAGES.round)}:{' '}
                    </span>
                    {shape.data.round_number}
                </Box>
            )}
        </Tooltip>
    );
};
