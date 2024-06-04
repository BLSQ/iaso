import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { Box, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useSafeIntl } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';

import { HEIGHT } from '../../config';
import MESSAGES from '../../messages';

const useStyles = makeStyles(() => ({
    emptyPaper: {
        height: `calc(${HEIGHT} - 65px)`,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyPaperTypo: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
}));

export const EmptyInstances: FunctionComponent = () => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();

    return (
        <Box className={classes.emptyPaper}>
            <Typography component="p" className={classes.emptyPaperTypo}>
                <ErrorOutlineIcon className={classes.emptyPaperIcon} />
                <Box component="span" ml={2}>
                    {formatMessage(MESSAGES.noInstance)}
                </Box>
            </Typography>
        </Box>
    );
};
