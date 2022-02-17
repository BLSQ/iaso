import React, { FunctionComponent } from 'react';
import { Typography, Box, makeStyles } from '@material-ui/core';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../constants/messages';
import { RoundString } from '../../constants/types';

type Props = {
    round: RoundString;
};

const styles = theme => ({
    lqasImMapHeader: {
        padding: theme.spacing(2),
        fontWeight: 'bold',
    },
});

const useStyles = makeStyles(styles);
export const LqasImMapHeader: FunctionComponent<Props> = ({ round }) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    return (
        <Box>
            <Typography
                variant="h5"
                className={classes.lqasImMapHeader}
                color="primary"
            >
                {`${formatMessage(MESSAGES[round])}`}
            </Typography>
        </Box>
    );
};
