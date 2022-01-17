import React, { FunctionComponent } from 'react';
import { Typography, Box, makeStyles } from '@material-ui/core';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../constants/messages';
import { RoundString } from '../../constants/types';

type Props = {
    round: RoundString;
};
const useStyles = makeStyles({ lqasImMapHeader: { fontWeight: 'bold' } });
export const LqasImMapHeader: FunctionComponent<Props> = ({ round }) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    return (
        <Box>
            <Typography variant="h5" className={classes.lqasImMapHeader}>
                {`${formatMessage(MESSAGES[round])}`}
            </Typography>
        </Box>
    );
};
