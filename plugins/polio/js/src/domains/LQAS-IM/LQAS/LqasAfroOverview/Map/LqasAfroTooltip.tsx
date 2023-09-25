import React, { FunctionComponent } from 'react';
import { Tooltip } from 'react-leaflet';
import { makeStyles, Box } from '@material-ui/core';

import { useSafeIntl } from 'bluesquare-components';
import { Shape } from '../../../../../constants/types';
import MESSAGES from '../../../../../constants/messages';

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
